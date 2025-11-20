import {Hook} from "./Hook";
import {ApplicationContext} from "@nodeboot/context";
import {IocContainer} from "@nodeboot/context/dist/ioc/types";

/**
 * Hook to access the IOC Container.
 * Usage:
 * ```ts
 * const {container} = useHook();
 * ```
 */
export class IocContainerHook extends Hook {
    use(): IocContainer {
        const iocContainer = ApplicationContext.getIocContainer();
        if (!iocContainer) {
            throw new Error(`IOC Container is required. Please check if nodeboot application is initialized properly.`);
        }
        return iocContainer;
    }
}
