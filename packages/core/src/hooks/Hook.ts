import {NodeBootAppView} from "@nodeboot/core";
import {JsonObject} from "@nodeboot/context";

export abstract class Hook {
    private readonly priority: number;
    private readonly state: Record<string, any>;

    constructor(priority: number = 0) {
        this.priority = priority;
        this.state = {};
    }

    getState<T>(key: string): T | undefined {
        return this.state[key];
    }

    setState<T>(key: string, value: T): void {
        this.state[key] = value;
    }

    getPriority() {
        return this.priority;
    }

    beforeStart(_testConfig: JsonObject): Promise<void> | void {
        // Implemented in concrete hooks when required; hooks can mutate _config directly
    }

    afterStart(_: NodeBootAppView): Promise<void> | void {
        // Implemented in concrete hooks when required
    }

    beforeTests(): Promise<void> | void {
        // Implemented in concrete hooks when required
    }

    afterTests(): Promise<void> | void {
        // Implemented in concrete hooks when required
    }

    beforeEachTest(): Promise<void> | void {
        // Implemented in concrete hooks when required
    }

    afterEachTest(): Promise<void> | void {
        // Implemented in concrete hooks when required
    }
}
