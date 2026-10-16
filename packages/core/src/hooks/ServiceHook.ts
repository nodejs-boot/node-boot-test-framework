import {Hook} from "./Hook";
import {getIocContainer} from "../utils/nodeboot";

/**
 * Resolves any class managed by the Node-Boot IoC container: @Service, @Component or any other
 * DI-registered class. The container is the source of truth, since only @Service leaves a runtime marker.
 */
export class ServiceHook extends Hook {
    use<T>(serviceClass: new (...args: any[]) => T): T {
        const iocContainer = getIocContainer();
        if (!iocContainer) {
            throw new Error(`IOC Container is required for useService hook to work`);
        }
        try {
            return iocContainer.get(serviceClass);
        } catch (e) {
            throw new Error(
                `Could not resolve ${serviceClass.name} from the IOC Container. ` +
                    `Make sure the class is decorated with @Service or @Component and is part of the application scan: ${
                        (e as Error).message
                    }`,
            );
        }
    }
}
