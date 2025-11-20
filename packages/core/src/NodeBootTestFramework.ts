import {NodeBootApp, NodeBootAppView} from "@nodeboot/core";
import {HookManager} from "./HookManager";
import {HooksLibrary} from "./HooksLibrary";
import {ApplicationContext, ApplicationLifecycleBridge} from "@nodeboot/context";
import {binAppLogger, useLogger} from "./utils/useLogger";

export class NodeBootTestFramework<App extends NodeBootApp, CustomLibrary extends HooksLibrary = HooksLibrary> {
    private appInstance!: App;
    private bootAppView!: NodeBootAppView;
    private hookManager: HookManager;
    private hooksLibrary: CustomLibrary;
    // Added lifecycle flags
    private hasRunBeforeAll = false;
    private hasRunAfterAll = false;
    private inTest = false;
    private emergencyShutdownInitiated = false;
    private cleanupLog: string[] = [];

    constructor(private AppClass: new (...args: any[]) => App, hooksLibrary: CustomLibrary) {
        this.hookManager = new HookManager();
        this.hooksLibrary = hooksLibrary;

        // Register hooks from the provided library
        this.hooksLibrary.registerHooks(this.hookManager);
    }

    async runBeforeAll(
        setupCallback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    ): Promise<void> {
        const logger = useLogger();
        this.hasRunBeforeAll = true;
        // Allow user-defined setup via callback
        setupCallback?.(this.hooksLibrary.getSetupHooks() as any);

        // Run all `runBeforeStart` hooks
        logger.info("Starting runBeforeAll hooks lifecycle...");
        await this.hookManager.runBeforeStart();
        const testConfig = this.hookManager.getTestConfig();
        logger.info("Completed runBeforeAll hooks lifecycle.");

        // Start the application
        logger.info("Starting application instance...");
        this.appInstance = new this.AppClass();
        this.bootAppView = await this.appInstance.start(testConfig);

        const applicationLifecycle = ApplicationContext.getIocContainer()?.get(ApplicationLifecycleBridge);
        // Wait until persistence layer is fully started
        await applicationLifecycle?.awaitEvent("persistence.started");

        // This awaits for postConstruct lifecycle events to complete
        await applicationLifecycle?.awaitEvent("application.adapters.bound");

        // Give event loop a chance to finish pending microtasks
        await new Promise(r => setImmediate(r));

        binAppLogger(this.bootAppView);
        logger.info("Application instance started.");

        // Run all `runAfterStart` hooks
        logger.info("Starting runAfterStart hooks lifecycle...");
        await this.hookManager.runAfterStart(this.bootAppView);
        logger.info("Completed runAfterStart hooks lifecycle.");

        // Run all `runBeforeTests` hooks
        logger.info("Starting runBeforeTests hooks lifecycle...");
        await this.hookManager.runBeforeTests();
        logger.info("Completed runBeforeTests hooks lifecycle.");
    }

    async runAfterAll(): Promise<void> {
        const logger = useLogger();
        if (this.hasRunAfterAll) return; // idempotent
        this.hasRunAfterAll = true;
        logger.info("Starting runAfterAll tests lifecycle...");

        try {
            await this.hookManager.runAfterTests();
            this.cleanupLog.push("hooks.afterTests");

            if (this.bootAppView?.server) {
                await this.bootAppView.server.close();
                this.cleanupLog.push("server.close");
            }

            ApplicationContext.getIocContainer()?.reset();
            this.cleanupLog.push("ioc.reset");

            try {
                const dataSource: any = ApplicationContext.getIocContainer()?.get?.(require("typeorm").DataSource);
                if (dataSource?.isInitialized) {
                    logger.debug("Closing TypeORM DataSource...");
                    await dataSource.destroy();
                    logger.debug("TypeORM DataSource closed.");
                    this.cleanupLog.push("typeorm.destroy");
                }
            } catch (err) {
                logger.debug("DataSource cleanup skipped (typeorm not available): " + (err as Error).message);
            }

            logger.info("Completed runAfterAll tests lifecycle.");
        } catch (e) {
            logger.error("Error during runAfterAll tests lifecycle: " + (e as Error).stack);
        } finally {
            // Diagnostics: list active handles to aid in lingering resource detection
            const handles = (process as any)._getActiveHandles?.() || [];
            const requests = (process as any)._getActiveRequests?.() || [];
            if (handles.length || requests.length) {
                logger.debug(
                    "Active handles after cleanup: " +
                        handles.map((h: any) => h?.constructor?.name || "Unknown").join(", ") +
                        (requests.length ? "; requests: " + requests.length : ""),
                );
            }

            // Yield event loop so microtasks finish
            await new Promise(r => setImmediate(r));

            // If still lingering handles that commonly keep process alive (e.g. timers), optionally force exit.
            const lingering = ((process as any)._getActiveHandles?.() || []).filter(
                (h: any) =>
                    h?.constructor?.name === "Server" ||
                    h?.constructor?.name === "Timeout" ||
                    h?.constructor?.name === "Socket",
            );
            if (lingering.length === 0) {
                logger.debug("No lingering critical handles detected after cleanup.");
                // eslint-disable-next-line no-unsafe-finally
                return; // allow node:test to exit naturally
            }
            logger.debug(
                `Lingering handles detected (${lingering
                    .map((h: any) => h.constructor.name)
                    .join(", ")}). Forcing exit to prevent hang.`,
            );
            // Force a clean exit code (tests passed) instead of leaving process alive.
            process.exitCode = process.exitCode ?? 0;
            setImmediate(() => process.exit(process.exitCode));
            logger.debug("Cleanup summary: " + this.cleanupLog.join(", "));
        }
    }

    async runBeforeEachTest(): Promise<void> {
        this.inTest = true;
        // Run all `beforeEach` hooks
        await this.hookManager.runBeforeEachTest();
    }

    async runAfterEachTest(): Promise<void> {
        // Run all `afterEach` hooks
        await this.hookManager.runAfterEachTest();
        this.inTest = false;
    }

    async emergencyCleanup(error?: any): Promise<void> {
        if (this.emergencyShutdownInitiated) return;
        this.emergencyShutdownInitiated = true;
        const logger = useLogger();
        const errInfo =
            error instanceof Error
                ? {name: error.name, message: error.message, stack: error.stack}
                : {value: String(error)};
        logger.error(
            `Emergency cleanup triggered due to unhandled error: ${
                errInfo.message || errInfo.stack || JSON.stringify(errInfo)
            }`,
        );

        // Metrics integration
        const metricsApi = (this.hooksLibrary as any)?.metricsHook?.use?.();
        metricsApi?.recordMetric?.("emergencyCleanup.events", 1);
        metricsApi?.recordMetric?.("emergencyCleanup.error", errInfo);

        const phasesRun: string[] = [];

        // If in the middle of a test, run afterEachTest hooks
        if (this.inTest) {
            try {
                await this.hookManager.runAfterEachTest();
                this.cleanupLog.push("hooks.afterEachTest.emergency");
                phasesRun.push("afterEachTest");
            } catch (e) {
                logger.error("Error during emergency afterEachTest cleanup: " + (e as Error).stack);
            }
            this.inTest = false;
        }
        // If beforeAll has run but afterAll has not, run afterAll hooks
        if (this.hasRunBeforeAll && !this.hasRunAfterAll) {
            try {
                await this.runAfterAll();
                phasesRun.push("afterAll");
            } catch (e) {
                logger.error("Error during emergency afterAll cleanup: " + (e as Error).stack);
            }
        }

        // Structured summary of which hooks ran in emergency context
        const summary: Record<string, string[]> = {};
        for (const phase of phasesRun) {
            summary[phase] = this.hookManager.getExecutedHooks(phase === "afterAll" ? "afterTests" : phase);
        }
        logger.error("Emergency cleanup hook execution summary: " + JSON.stringify(summary));
        logger.debug("Emergency cleanup log entries: " + this.cleanupLog.join(", "));
    }

    getReturnHooks(): ReturnType<CustomLibrary["getReturnHooks"]> {
        return this.hooksLibrary.getReturnHooks() as any;
    }
}
