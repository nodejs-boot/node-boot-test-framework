import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type LogPattern = string | RegExp;
export type LogMatchOptions = {
    expect?: LogPattern[]; // patterns that must appear
    forbid?: LogPattern[]; // patterns that must NOT appear
    scope?: "current" | "all"; // evaluation scope for expect patterns
};

/**
 * LogMatchHook captures logs and validates presence/absence of patterns.
 * Independent from LogCaptureHook (duplicates capture) for simplicity.
 */
export class LogMatchHook extends Hook {
    private allLogs: string[] = [];
    private currentLogs: string[] = [];
    private expect: LogPattern[] = [];
    private forbid: LogPattern[] = [];
    private scope: "current" | "all" = "current";
    private originalLog?: any;

    constructor() {
        super(-4); // After LogCaptureHook (-5) so ordering predictable
    }

    call(options: LogMatchOptions) {
        if (options.expect) this.expect.push(...options.expect);
        if (options.forbid) this.forbid.push(...options.forbid);
        if (options.scope) this.scope = options.scope;
    }

    override beforeTests() {
        const logger: any = useLogger();
        if (this.originalLog) return;
        this.originalLog = logger.log.bind(logger);
        logger.log = (...args: any[]) => {
            let msg: string | undefined;
            if (typeof args[0] === "object" && args[0]?.message) {
                msg = args[0].message;
            } else {
                msg = args[1];
            }
            if (msg !== undefined) {
                const raw = String(msg);
                this.allLogs.push(raw);
                this.currentLogs.push(raw);
            }
            return this.originalLog(...args);
        };
    }

    override beforeEachTest() {
        this.currentLogs = [];
    }

    private matches(pattern: LogPattern, log: string) {
        return typeof pattern === "string" ? log.includes(pattern) : pattern.test(log);
    }

    private evaluate(scope: "current" | "all") {
        const haystack = scope === "current" ? this.currentLogs : this.allLogs;
        // Expect
        for (const p of this.expect) {
            const found = haystack.some(l => this.matches(p, l));
            if (!found) {
                throw new Error(`Expected log pattern not found: ${p.toString()}`);
            }
        }
        // Forbid
        for (const p of this.forbid) {
            const found = haystack.some(l => this.matches(p, l));
            if (found) {
                throw new Error(`Forbidden log pattern appeared: ${p.toString()}`);
            }
        }
    }

    override afterEachTest() {
        if (this.expect.length || this.forbid.length) {
            // Evaluate only against current test for per-test validation
            this.evaluate("current");
        }
        this.currentLogs = [];
    }

    override afterTests() {
        if (this.expect.length || this.forbid.length) {
            // Evaluate global scope if configured
            if (this.scope === "all") this.evaluate("all");
        }
        if (this.originalLog) {
            const logger: any = useLogger();
            logger.log = this.originalLog;
            this.originalLog = undefined;
        }
        this.allLogs = [];
        this.currentLogs = [];
        this.expect = [];
        this.forbid = [];
    }

    use() {
        return {
            getAll: () => [...this.allLogs],
            getCurrentTest: () => [...this.currentLogs],
        };
    }
}
