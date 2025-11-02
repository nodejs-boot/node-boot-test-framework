import {NodeBootApp} from "@nodeboot/core";
import {HooksLibrary, NodeBootTestFramework} from "@nodeboot/test";
import {afterAll, afterEach, beforeAll, beforeEach} from "@jest/globals";

export function useNodeBoot<App extends NodeBootApp, CustomLibrary extends HooksLibrary = HooksLibrary>(
    AppClass: new (...args: any[]) => App,
    callback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    hooksLibrary: CustomLibrary = new HooksLibrary() as CustomLibrary,
): ReturnType<CustomLibrary["getReturnHooks"]> {
    // Initialize the NodeBoot test framework
    const framework = new NodeBootTestFramework(AppClass, hooksLibrary);

    // Setup hook - simplified async handling
    beforeAll(async () => {
        await framework.runBeforeAll(callback);
    });

    // Teardown hook - simplified
    afterAll(async () => {
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
