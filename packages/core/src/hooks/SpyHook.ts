import {Hook} from "./Hook";
import {ApplicationContext} from "@nodeboot/context";

export class SpyHook extends Hook {
    private activeSpies: Array<() => void> = [];

    use<T>(serviceClass: new (...args: any[]) => T, methodName: keyof T & string) {
        const ioc = ApplicationContext.getIocContainer();
        if (!ioc) throw new Error("IOC Container is required to use service spies.");
        const instance = ioc.get(serviceClass) as T;
        if (!instance) throw new Error(`Service instance for ${serviceClass.name} not found.`);

        const original: any = (instance as any)[methodName];
        if (typeof original !== "function") {
            throw new Error(`${String(methodName)} is not a function on ${serviceClass.name}`);
        }

        let callCount = 0;
        const calls: any[][] = [];
        const results: any[] = [];
        const errors: any[] = [];

        const spyWrapper = function (this: any, ...args: any[]) {
            callCount++;
            calls.push(args);
            try {
                const ret = original.apply(this, args);
                if (ret && typeof ret.then === "function") {
                    return ret
                        .then((val: any) => {
                            results.push(val);
                            return val;
                        })
                        .catch((e: any) => {
                            errors.push(e);
                            throw e;
                        });
                }
                results.push(ret);
                return ret;
            } catch (e) {
                errors.push(e);
                throw e;
            }
        };

        (instance as any)[methodName] = spyWrapper;

        const restore = () => {
            (instance as any)[methodName] = original;
        };
        this.activeSpies.push(restore);

        return {
            original,
            restore,
            get callCount() {
                return callCount;
            },
            get calls() {
                return calls.slice();
            },
            get results() {
                return results.slice();
            },
            get errors() {
                return errors.slice();
            },
        };
    }

    override afterTests() {
        this.activeSpies.forEach(r => r());
        this.activeSpies = [];
    }
}
