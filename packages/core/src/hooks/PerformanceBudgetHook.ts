import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type PerformanceBudgetDefinition = Record<string, number>; // label -> ms
export type PerformanceBudgetOptions = {
    budgets: PerformanceBudgetDefinition;
    failOnExceeded?: boolean;
};

class PerfTracker {
    private startTime?: number;
    private endTime?: number;
    constructor(private label: string) {}
    start() {
        this.startTime = performance.now();
    }
    stop() {
        if (this.startTime === undefined) throw new Error("Tracker not started");
        this.endTime = performance.now();
    }
    elapsed() {
        if (this.startTime === undefined) throw new Error("Tracker not started");
        return (this.endTime ?? performance.now()) - this.startTime;
    }
    getLabel() {
        return this.label;
    }
}

/**
 * PerformanceBudgetHook
 * Measures labeled code segments and compares elapsed times against declared budgets after each test.
 * Use: usePerformanceBudget({budgets:{label:ms}}) then const t = usePerformanceBudget().start('label'); t.stop().
 */
export class PerformanceBudgetHook extends Hook {
    private options?: PerformanceBudgetOptions;
    private trackers: PerfTracker[] = [];
    private results: {label: string; ms: number}[] = [];

    constructor() {
        super(4); // High priority so evaluation runs before cleanup (reverse order afterEachTest)
    }

    call(options: PerformanceBudgetOptions) {
        this.options = options;
    }

    override beforeEachTest() {
        this.trackers = [];
        this.results = [];
    }

    override afterEachTest() {
        if (!this.options) return;
        const logger = useLogger();
        for (const t of this.trackers) {
            // finalize any running tracker implicitly
            if (t["startTime"] !== undefined && t["endTime"] === undefined) {
                t.stop();
            }
        }
        for (const t of this.trackers) {
            this.results.push({label: t.getLabel(), ms: t.elapsed()});
        }
        const failures: string[] = [];
        for (const [label, budget] of Object.entries(this.options.budgets)) {
            const measurement = this.results.find(r => r.label === label);
            if (!measurement) continue; // not used
            if (measurement.ms > budget) {
                const msg = `Performance budget exceeded for '${label}': ${measurement.ms.toFixed(2)}ms > ${budget}ms`;
                failures.push(msg);
                logger.warn(msg);
            } else {
                logger.debug(`Performance within budget for '${label}': ${measurement.ms.toFixed(2)}ms <= ${budget}ms`);
            }
        }
        if (failures.length && this.options.failOnExceeded) {
            throw new Error(failures.join(" | "));
        }
    }

    use() {
        return {
            start: (label: string) => {
                const tracker = new PerfTracker(label);
                tracker.start();
                this.trackers.push(tracker);
                return {
                    stop: () => tracker.stop(),
                    elapsed: () => tracker.elapsed(),
                };
            },
        };
    }
}
