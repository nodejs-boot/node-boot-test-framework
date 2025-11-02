import {Hook} from "./Hook";
import FakeTimers from "@sinonjs/fake-timers";

class TimeControl {
    constructor(private clock: FakeTimers.InstalledClock) {}
    advanceTimeBy(ms: number) {
        this.clock.tick(ms);
    }
    runAllTimers() {
        this.clock.runAll?.();
    }
}

class TimeTracking {
    private startTime?: number;
    private endTime?: number;
    constructor(private hook: TimerHook) {}
    start() {
        this.startTime = Date.now();
    }
    stop() {
        if (!this.startTime) throw new Error("Time tracking not started");
        this.endTime = Date.now();
        this.hook.clear(this);
    }
    elapsed() {
        if (!this.startTime) throw new Error("Invalid tracking instance");
        return (this.endTime ?? Date.now()) - this.startTime;
    }
}

export class TimerHook extends Hook {
    private clock: FakeTimers.InstalledClock | null = null;
    private timeControl?: TimeControl;
    private trackingInstances: TimeTracking[] = [];

    override beforeTests() {
        if (!this.clock) {
            this.clock = FakeTimers.install({
                now: Date.now(),
                toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
            });
            this.timeControl = new TimeControl(this.clock);
        }
    }

    override afterTests() {
        this.clock?.uninstall();
        this.clock = null;
        this.timeControl = undefined;
        this.trackingInstances = [];
    }

    use() {
        return {
            control: () => this.timeControl!,
            tracking: () => this.startTracking(),
        };
    }

    clear(tracking: TimeTracking) {
        const i = this.trackingInstances.indexOf(tracking);
        if (i >= 0) this.trackingInstances.splice(i, 1);
    }

    private startTracking() {
        if (!this.clock) throw new Error("Timers not initialized yet");
        const tracker = new TimeTracking(this);
        tracker.start();
        this.trackingInstances.push(tracker);
        return tracker;
    }
}
