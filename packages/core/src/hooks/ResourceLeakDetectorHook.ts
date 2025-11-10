import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type ResourceLeakDetectorOptions = {
    failOnLeak?: boolean;
};

/**
 * Detects potential resource leaks (active handles/requests) between tests.
 * Uses Node's internal process APIs; best-effort only.
 */
export class ResourceLeakDetectorHook extends Hook {
    private options: ResourceLeakDetectorOptions = {};
    private baselineHandlesCount = 0;
    private baselineRequestsCount = 0;

    constructor() {
        super(-10); // Run last afterEachTest (lowest priority) to observe remaining leaks
    }

    call(options?: ResourceLeakDetectorOptions) {
        if (options) this.options = {...this.options, ...options};
    }

    override beforeEachTest() {
        this.baselineHandlesCount = this.getActiveHandles().length;
        this.baselineRequestsCount = this.getActiveRequests().length;
    }

    override afterEachTest() {
        const logger = useLogger();
        const handles = this.getActiveHandles();
        const requests = this.getActiveRequests();
        const leakedHandles = handles.length - this.baselineHandlesCount;
        const leakedRequests = requests.length - this.baselineRequestsCount;
        if (leakedHandles > 0 || leakedRequests > 0) {
            const msg = `Potential resource leak detected: +${leakedHandles} handles, +${leakedRequests} requests.`;
            if (this.options.failOnLeak) {
                throw new Error(msg);
            } else {
                logger.warn(msg);
            }
        }
    }

    private getActiveHandles(): any[] {
        const fn: any = (process as any)._getActiveHandles;
        if (typeof fn === "function") return fn.call(process) as any[];
        return [];
    }

    private getActiveRequests(): any[] {
        const fn: any = (process as any)._getActiveRequests;
        if (typeof fn === "function") return fn.call(process) as any[];
        return [];
    }

    use() {
        return {
            snapshot: () => ({
                handles: this.getActiveHandles().length,
                requests: this.getActiveRequests().length,
            }),
        };
    }
}
