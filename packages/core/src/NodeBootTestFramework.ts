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

        // Wait until persistence layer is fully started
        const applicationLifecycle = ApplicationContext.getIocContainer()?.get(ApplicationLifecycleBridge);
        await applicationLifecycle?.awaitEvent("persistence.started");

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
        logger.info("Starting runAfterAll tests lifecycle...");
        await this.bootAppView.server.close();

        // Attempt to gracefully close persistence DataSource if present
        try {
            const dataSource: any = ApplicationContext.getIocContainer()?.get?.(require("typeorm").DataSource);
            if (dataSource?.isInitialized) {
                logger.debug("Closing TypeORM DataSource...");
                await dataSource.destroy();
                logger.debug("TypeORM DataSource closed.");
            }
        } catch (err) {
            logger.debug("DataSource cleanup skipped (typeorm not available): " + (err as Error).message);
        }

        // Run after-tests hooks (e.g. container shutdown)
        ApplicationContext.getIocContainer()?.reset();
        await this.hookManager.runAfterTests();
        logger.info("Completed runAfterAll tests lifecycle.");

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
    }

    async runBeforeEachTest(): Promise<void> {
        // Run all `beforeEach` hooks
        await this.hookManager.runBeforeEachTest();
    }

    async runAfterEachTest(): Promise<void> {
        // Run all `afterEach` hooks
        await this.hookManager.runAfterEachTest();
    }

    getReturnHooks(): ReturnType<CustomLibrary["getReturnHooks"]> {
        return this.hooksLibrary.getReturnHooks() as any;
    }
}
