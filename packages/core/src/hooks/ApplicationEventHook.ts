import {Hook} from "./Hook";
import {ApplicationContext, ApplicationLifecycleBridge, LifecycleType} from "@nodeboot/context";

export class ApplicationEventHook extends Hook {
    // This hook does not participate in setup, only exposes a test-scope utility
    use() {
        return {
            /**
             * Await a specific application event. Only valid in test scope.
             * @param applicationEvent (required) The event name to await (e.g., "application.adapters.bound")
             */
            awaitEvent: async (applicationEvent: LifecycleType): Promise<void> => {
                if (!applicationEvent) {
                    throw new Error("applicationEvent is required");
                }
                const applicationLifecycle = ApplicationContext.getIocContainer()?.get(ApplicationLifecycleBridge);
                if (!applicationLifecycle) {
                    throw new Error("ApplicationLifecycleBridge not available in IoC container");
                }
                await applicationLifecycle.awaitEvent(applicationEvent);
            },
        };
    }
}
