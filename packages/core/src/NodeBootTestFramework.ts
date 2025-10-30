import {NodeBootApp, NodeBootAppView} from "@nodeboot/core";
import {HookManager} from "./HookManager";
import {HooksLibrary} from "./HooksLibrary";
import {ApplicationContext} from "@nodeboot/context";
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
        // Stop the application
        const logger = useLogger();
        logger.info("Starting runAfterAll tests lifecycle...");
        await this.bootAppView.server.close();
        ApplicationContext.getIocContainer()?.reset();

        await this.hookManager.runAfterTests();
        logger.info("Completed runAfterAll tests lifecycle.");

        setTimeout(() => process.exit(1), 500);
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
