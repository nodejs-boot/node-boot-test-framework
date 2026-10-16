import {Hook} from "./Hook";
import type {Config, JsonObject} from "@nodeboot/context";
import {getConfigServiceClass, getIocContainer} from "../utils/nodeboot";

export class ConfigHook extends Hook {
    private configs: JsonObject[] = [];

    constructor() {
        super(-1);
    }

    override beforeStart(testConfig: JsonObject) {
        const mergedConfig = Object.assign(testConfig, ...this.configs);
        this.setState("config", mergedConfig);
    }

    call(config: JsonObject) {
        this.configs.push(config);
    }

    use(): Config {
        const iocContainer = getIocContainer();
        if (iocContainer?.has(getConfigServiceClass())) {
            return iocContainer.get(getConfigServiceClass());
        }
        throw new Error(
            `No Config found in the IOC container. Please bootstrap your NodeBoot server before calling useConfig hook`,
        );
    }
}
