import {Hook} from "./Hook";
import FakeTimers from "@sinonjs/fake-timers";
import {useLogger} from "../utils/useLogger";

class TimeControl {
    constructor(private clock: FakeTimers.InstalledClock) {}
    advanceTimeBy(ms: number) {
        this.clock.tick(ms);
    }
    runAllTimers() {
        this.clock.runAll?.();
    }
}

type FAKEABLE = "setTimeout" | "clearTimeout" | "setInterval" | "clearInterval" | "Date";

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
        const logger = useLogger();
        const toFake = this.getState<FAKEABLE[]>("to-fake");
        if (toFake) {
            if (!this.clock) {
                logger.info(`[TimerHook] Faking timers: ${toFake.join(", ")}`);
                this.clock = FakeTimers.install({
                    now: Date.now(),
                    toFake,
                });
                this.timeControl = new TimeControl(this.clock);
            }
        } else {
            logger.info(
                `[TimerHook] No timers to fake. Defaults to real timers. Please call this hook inside the useNodeBoot setup phase if you want to fake timers.`,
            );
        }
    }

    override afterTests() {
        const logger = useLogger();
        const toFake = this.getState<FAKEABLE[]>("to-fake");
        if (toFake) {
            logger.info(`[TimerHook] Restoring real timers from faked: ${toFake.join(", ")}`);
            this.clock?.uninstall();
            this.clock = null;
            this.timeControl = undefined;
            this.trackingInstances = [];
        }
    }

    call({toFake = ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"]}: {toFake?: FAKEABLE[]}) {
        this.setState("to-fake", toFake);
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
        useLogger().info("[TimerHook] Starting time tracking instance");
        if (!this.clock) throw new Error("Timers not initialized yet");
        const tracker = new TimeTracking(this);
        tracker.start();
        this.trackingInstances.push(tracker);
        return tracker;
    }
}
