import {Hook} from "./Hook";
import {ApplicationContext, IocContainer} from "@nodeboot/context";

/**
 * Hook to access the IOC Container.
 * Usage:
 * ```ts
 * const iocContainer = useHook();
 * ```
 */
export class IocContainerHook extends Hook {
    use(): IocContainer {
        const iocContainer = ApplicationContext.getIocContainer();
        if (iocContainer) {
            return iocContainer;
        }
        throw new Error(`IOC Container is required. Please check if nodeboot application is initialized properly.`);
    }
}
