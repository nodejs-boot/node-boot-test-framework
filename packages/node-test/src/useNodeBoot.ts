import {after, afterEach, before, beforeEach} from "node:test";
import {NodeBootApp} from "@nodeboot/core";
import {HooksLibrary, NodeBootTestFramework} from "@nodeboot/test";

const activeFrameworks: any[] = (global as any).__nodeboot_active_frameworks__ || [];

if (!(global as any).__nodeboot_active_frameworks__) {
    (global as any).__nodeboot_active_frameworks__ = activeFrameworks;
    // Register global handlers only once
    const installHandler = (event: string) => {
        process.on(event as any, async (err: any) => {
            try {
                for (const fw of activeFrameworks) {
                    try {
                        await fw.emergencyCleanup(err);
                    } catch (e) {
                        // swallow
                    }
                }
            } finally {
                console.error(`[nodeboot] ${event} captured. Error:`, err);
            }
        });
    };
    installHandler("uncaughtException");
    installHandler("unhandledRejection");
}

export function useNodeBoot<App extends NodeBootApp, CustomLibrary extends HooksLibrary = HooksLibrary>(
    AppClass: new (...args: any[]) => App,
    callback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    hooksLibrary: CustomLibrary = new HooksLibrary() as CustomLibrary,
): ReturnType<CustomLibrary["getReturnHooks"]> {
    const framework = new NodeBootTestFramework(AppClass, hooksLibrary);
    activeFrameworks.push(framework);

    // Setup hook - simplified async handling
    before(async () => {
        await framework.runBeforeAll(callback);
    });

    // Teardown hook - simplified
    after(async () => {
        await framework.runAfterAll();
    });

    beforeEach(async () => {
        await framework.runBeforeEachTest();
    });

    afterEach(async () => {
        await framework.runAfterEachTest();
    });

    return framework.getReturnHooks();
}
