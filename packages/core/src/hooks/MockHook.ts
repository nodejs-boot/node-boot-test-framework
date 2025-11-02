import {Hook} from "./Hook";
import {ApplicationContext} from "@nodeboot/context";

/**
 * A hook for mocking services in a test environment. This class provides
 * functionality to mock specific methods of a service or replace an entire service
 * while ensuring original functionality is restored after tests.
 */
export class MockHook extends Hook {
    private mocks: (() => void)[] = [];

    /**
     * Runs all registered mock setup functions before tests.
     */
    override beforeTests() {
        this.mocks.forEach(mockFn => mockFn());
    }

    /**
     * Clears all registered mocks after tests.
     */
    override afterTests() {
        this.mocks.forEach(restoreFn => restoreFn());
        this.mocks = [];
    }

    /**
     * Mocks specific methods of a service instance or replaces the service instance entirely.
     *
     * @param serviceClass - The class of the service to mock.
     * @param mock - A partial implementation of the service.
     * @returns An object containing a restore function to revert the mock.
     */
    use<T>(serviceClass: new (...args: any[]) => T, mock: Partial<T>) {
        const iocContainer = ApplicationContext.getIocContainer();
        const originalInstance = iocContainer?.get(serviceClass);
        if (!iocContainer) throw new Error("IoC container not found.");
        if (!originalInstance) throw new Error(`Service instance for ${serviceClass.name} not found.`);

        const originalValues: Record<string | symbol, any> = {};
        const callMeta: Record<string | symbol, {callCount: number; calls: any[][]}> = {};

        Object.keys(mock).forEach(k => {
            const key = k as keyof T & string;
            const replacement = mock[key];
            originalValues[key] = (originalInstance as any)[key];
            if (typeof replacement === "function") {
                callMeta[key] = {callCount: 0, calls: []};
                (originalInstance as any)[key] = (...args: any[]) => {
                    const meta = callMeta[key];
                    meta.callCount++;
                    meta.calls.push(args);
                    return (replacement as Function).apply(originalInstance, args);
                };
            } else if (replacement !== undefined) {
                (originalInstance as any)[key] = replacement;
            }
        });

        const restoreFn = () => {
            Object.keys(originalValues).forEach(k => {
                (originalInstance as any)[k] = originalValues[k];
            });
        };
        this.mocks.push(restoreFn);

        return {
            restore: restoreFn,
            getMethodMeta(name: keyof T & string) {
                return callMeta[name];
            },
            get allMeta() {
                return callMeta;
            },
        };
    }

    /**
     * Mocks specific methods of a service or replaces the service in the IoC container.
     * Restores the original state after tests.
     *
     * @param serviceClass - The class of the service to mock.
     * @param mock - A partial implementation of the service.
     */
    call<T>(serviceClass: new (...args: any[]) => T, mock: Partial<T>) {
        const iocContainer = ApplicationContext.getIocContainer();

        if (!iocContainer) {
            throw new Error("IoC container not found.");
        }

        const originalInstance = iocContainer.get(serviceClass);
        if (!originalInstance) {
            throw new Error(`Service instance for ${serviceClass.name} not found.`);
        }

        const originalMethods: Partial<T> = {};

        // Patch methods provided in the mock
        Object.keys(mock).forEach(key => {
            const methodName = key as keyof T;

            if (typeof mock[methodName] === "function") {
                originalMethods[methodName] = originalInstance[methodName];
                (originalInstance[methodName] as any) = mock[methodName]!;
            }
        });

        // Replace the IoC container's instance with the patched instance
        iocContainer.set(serviceClass, originalInstance);

        // Register a restore function
        const restoreFn = () => {
            Object.keys(originalMethods).forEach(key => {
                const methodName = key as keyof T;
                (originalInstance[methodName] as any) = originalMethods[methodName];
            });

            // Reset the original instance in the IoC container
            iocContainer.set(serviceClass, originalInstance);
        };

        this.mocks.push(restoreFn);
    }
}
