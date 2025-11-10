import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

type SetupOptions = {
    beforeAll?: () => void;
    beforeEach?: () => void;
};

/**
 * The `SetupHook` allows registering setup logic that must run before tests.
 *
 * Lifecycle mapping:
 * - `beforeTests`     -> runs all global (beforeAll) setup functions once.
 * - `beforeEachTest`  -> runs per-test (beforeEach) setup functions.
 */
export class SetupHook extends Hook {
    /**
     * Functions executed before each test.
     */
    private perTestSetupFns: Array<() => void> = [];

    /**
     * Functions executed once before all tests.
     */
    private globalSetupFns: Array<() => void> = [];

    /**
     * Priority kept low so setup runs early (default 1).
     */
    constructor() {
        super(1);
    }

    /**
     * Register setup functions.
     * At least one of `beforeEach` or `beforeAll` must be provided.
     */
    call(options: SetupOptions) {
        if (!options.beforeEach && !options.beforeAll) {
            throw new Error('Invalid setup hook, provide one of "beforeEach" or "beforeAll".');
        }
        if (options.beforeEach) {
            this.perTestSetupFns.push(options.beforeEach);
        }
        if (options.beforeAll) {
            this.globalSetupFns.push(options.beforeAll);
        }
    }

    /**
     * Runs once before all tests.
     */
    override async beforeTests(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running global setup before all tests.");
        for (const fn of this.globalSetupFns) {
            try {
                fn();
                logger.debug("Global setup function executed successfully.");
            } catch (error) {
                logger.error("Error during global setup:", error);
            }
        }
        // Clear so they are not re-run if lifecycle invoked again.
        this.globalSetupFns = [];
        logger.debug("Completed global setup before all tests.");
    }

    /**
     * Runs before each test.
     */
    override async beforeEachTest(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running per-test setup.");
        for (const fn of this.perTestSetupFns) {
            try {
                fn();
                logger.debug("Per-test setup function executed successfully.");
            } catch (error) {
                logger.error("Error during per-test setup:", error);
            }
        }
        logger.debug("Completed per-test setup.");
    }
}
