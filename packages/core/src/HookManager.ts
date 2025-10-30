import {Hook} from "./hooks";
import {NodeBootAppView} from "@nodeboot/core";
import {useLogger} from "./utils/useLogger";
import {JsonObject} from "@nodeboot/context";

export class HookManager {
    private hooks: Hook[] = [];
    private testConfig: JsonObject = {};

    addHook(hook: Hook) {
        this.hooks.push(hook);
        // Sort hooks by priority (ascending)
        this.hooks.sort((a, b) => a.getPriority() - b.getPriority());
    }

    async runBeforeStart() {
        useLogger().debug(
            `Hooks sorted by priority. Current order: ${this.hooks.map(h => h.constructor.name).join(", ")}`,
        );

        useLogger().debug("Running beforeStart phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.beforeStart(this.testConfig);
        }
        useLogger().debug("Completed beforeStart phase.");
    }

    async runAfterStart(bootApp: NodeBootAppView) {
        useLogger().debug("Running afterStart phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.afterStart(bootApp);
        }
        useLogger().debug("Completed afterStart phase.");
    }

    async runBeforeTests() {
        useLogger().debug("Running beforeTests phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.beforeTests();
        }
        useLogger().debug("Completed beforeTests phase.");
    }

    async runAfterTests() {
        useLogger().debug("Running afterTests phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.afterTests();
        }
        useLogger().debug("Completed afterTests phase.");
    }

    async runBeforeEachTest() {
        useLogger().debug("Running beforeEachTest phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.beforeEachTest();
        }
        useLogger().debug("Completed beforeEachTest phase.");
    }

    async runAfterEachTest() {
        useLogger().debug("Running afterEachTest phase for all hooks.");
        for (const hook of this.hooks) {
            await hook.afterEachTest();
        }
        useLogger().debug("Completed afterEachTest phase.");
    }

    getTestConfig(): JsonObject {
        return this.testConfig;
    }
}
