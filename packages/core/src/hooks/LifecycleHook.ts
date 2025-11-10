import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type LifecycleOptions = {
    beforeAll?: () => void;
    beforeEach?: () => void;
    afterEach?: () => void;
    afterAll?: () => void;
};

/**
 * The `LifecycleHook` allows registering functions for all test lifecycle phases.
 *
 * Lifecycle mapping:
 * - `beforeAll`     -> runs once before all tests
 * - `beforeEach`    -> runs before each test
 * - `afterEach`     -> runs after each test
 * - `afterAll`      -> runs once after all tests
 */
export class LifecycleHook extends Hook {
    private beforeAllFns: Array<() => void> = [];
    private beforeEachFns: Array<() => void> = [];
    private afterEachFns: Array<() => void> = [];
    private afterAllFns: Array<() => void> = [];

    /**
     * Priority: setup (1), cleanup (3), default (2)
     * By default, runs in the middle of the lifecycle.
     */
    constructor(priority = 2) {
        super(priority);
    }

    /**
     * Register lifecycle functions. At least one must be provided.
     */
    call(options: LifecycleOptions) {
        if (!options.beforeAll && !options.beforeEach && !options.afterEach && !options.afterAll) {
            throw new Error("Invalid lifecycle hook, provide at least one lifecycle function.");
        }
        if (options.beforeAll) this.beforeAllFns.push(options.beforeAll);
        if (options.beforeEach) this.beforeEachFns.push(options.beforeEach);
        if (options.afterEach) this.afterEachFns.push(options.afterEach);
        if (options.afterAll) this.afterAllFns.push(options.afterAll);
    }

    override async beforeTests(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running beforeAll lifecycle functions.");
        for (const fn of this.beforeAllFns) {
            try {
                await fn();
                logger.debug("beforeAll function executed successfully.");
            } catch (error) {
                logger.error("Error during beforeAll:", error);
            }
        }
        this.beforeAllFns = [];
        logger.debug("Completed beforeAll lifecycle.");
    }

    override async beforeEachTest(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running beforeEach lifecycle functions.");
        for (const fn of this.beforeEachFns) {
            try {
                await fn();
                logger.debug("beforeEach function executed successfully.");
            } catch (error) {
                logger.error("Error during beforeEach:", error);
            }
        }
        logger.debug("Completed beforeEach lifecycle.");
    }

    override async afterEachTest(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running afterEach lifecycle functions.");
        for (const fn of this.afterEachFns) {
            try {
                await fn();
                logger.debug("afterEach function executed successfully.");
            } catch (error) {
                logger.error("Error during afterEach:", error);
            }
        }
        logger.debug("Completed afterEach lifecycle.");
    }

    override async afterTests(): Promise<void> {
        const logger = useLogger();
        logger.debug("Running afterAll lifecycle functions.");
        for (const fn of this.afterAllFns) {
            try {
                await fn();
                logger.debug("afterAll function executed successfully.");
            } catch (error) {
                logger.error("Error during afterAll:", error);
            }
        }
        this.afterAllFns = [];
        logger.debug("Completed afterAll lifecycle.");
    }
}
