import {HookManager, HooksLibrary, ReturnHooks, SetUpHooks} from "@nodeboot/test";
import {MongoMemoryHook} from "./hooks";

export type InfraSetUpHooks = SetUpHooks & {
    useMongoMemory: MongoMemoryHook["call"];
};

export type InfraReturnHooks = ReturnHooks & {
    useMongoMemory: MongoMemoryHook["use"];
};

export class InfraHooksLibrary extends HooksLibrary {
    mongoMemoryHook = new MongoMemoryHook();

    override registerHooks(hookManager: HookManager) {
        super.registerHooks(hookManager);
        hookManager.addHook(this.mongoMemoryHook);
    }

    override getSetupHooks(): InfraSetUpHooks {
        const baseHooks = super.getSetupHooks();
        return {
            ...baseHooks,
            useMongoMemory: this.mongoMemoryHook.call.bind(this.mongoMemoryHook),
        };
    }

    override getReturnHooks(): InfraReturnHooks {
        const baseHooks = super.getReturnHooks();
        return {
            ...baseHooks,
            useMongoMemory: this.mongoMemoryHook.use.bind(this.mongoMemoryHook),
        };
    }
}
