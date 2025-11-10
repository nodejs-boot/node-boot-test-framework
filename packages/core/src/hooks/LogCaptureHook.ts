import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type LogEntry = {
    level: string;
    message: string;
};

export type LogCaptureOptions = {
    level?: string; // minimum level to capture
    assertNoError?: boolean; // throw if any error-level log in test scope
};

/**
 * Captures logs emitted through the shared logger during test execution.
 */
export class LogCaptureHook extends Hook {
    private originalLog?: any;
    private globalEntries: LogEntry[] = [];
    private currentTestEntries: LogEntry[] = [];
    private options: LogCaptureOptions = {};

    constructor() {
        super(-5); // run very early
    }

    call(options?: LogCaptureOptions) {
        if (options) this.options = {...this.options, ...options};
    }

    override beforeTests() {
        const logger: any = useLogger();
        if (this.originalLog) return; // already patched
        this.originalLog = logger.log.bind(logger);
        const minLevel = this.options.level || "debug";
        const levelOrder = ["error", "warn", "info", "http", "verbose", "debug", "silly"];
        const thresholdIndex = levelOrder.indexOf(minLevel);
        logger.log = (...args: any[]) => {
            // Support both logger.log(level, message, meta?) and logger.log(infoObject)
            let level: string | undefined;
            let message: string | undefined;
            if (typeof args[0] === "object" && args[0]?.level) {
                level = args[0].level;
                message = args[0].message;
            } else {
                level = args[0];
                message = args[1];
            }
            if (level && message) {
                const entryIndex = levelOrder.indexOf(level);
                if (!(thresholdIndex >= 0 && entryIndex >= 0 && entryIndex > thresholdIndex)) {
                    const entry = {level, message: String(message)};
                    this.globalEntries.push(entry);
                    this.currentTestEntries.push(entry);
                }
            }
            return this.originalLog(...args);
        };
    }

    override beforeEachTest() {
        this.currentTestEntries = [];
    }

    override afterEachTest() {
        if (this.options.assertNoError) {
            const errorLogs = this.currentTestEntries.filter(e => e.level === "error");
            if (errorLogs.length) {
                throw new Error(`Error logs detected: ${errorLogs.map(e => e.message).join(" | ")}`);
            }
        }
        this.currentTestEntries = [];
    }

    override afterTests() {
        if (this.originalLog) {
            const logger: any = useLogger();
            logger.log = this.originalLog;
            this.originalLog = undefined;
        }
        this.globalEntries = [];
        this.currentTestEntries = [];
    }

    use() {
        return {
            getAll: () => [...this.globalEntries],
            getCurrentTest: () => [...this.currentTestEntries],
            clearCurrent: () => (this.currentTestEntries = []),
        };
    }
}
