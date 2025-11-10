import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

export type SnapshotStateOptions<T = any> = {
    capture: () => T;
    diff?: (before: T, after: T) => any;
    onDiff?: (diff: any) => void;
    assertEmpty?: boolean;
    label?: string;
};

export class SnapshotStateHook extends Hook {
    private options?: SnapshotStateOptions;
    private baseline?: any;

    constructor() {
        super(5);
    }

    call<T>(options: SnapshotStateOptions<T>) {
        this.options = options;
    }

    override beforeEachTest() {
        if (!this.options) return;
        this.baseline = this.safeCapture();
    }

    override afterEachTest() {
        if (!this.options) return;
        const after = this.safeCapture();
        const diffResult = this.computeDiff(this.baseline, after);
        if (diffResult) {
            const logger = useLogger();
            const label = this.options.label || "snapshot";
            logger.warn(`State difference detected for ${label}`);
            if (this.options.onDiff) {
                try {
                    this.options.onDiff(diffResult);
                } catch {
                    /* ignore */
                }
            }
            if (this.options.assertEmpty) {
                throw new Error(`State changed for ${label}: ${JSON.stringify(diffResult).slice(0, 500)}`);
            }
        }
        this.baseline = undefined;
    }

    private safeCapture() {
        try {
            return this.options?.capture();
        } catch (e) {
            useLogger().error(`Snapshot capture failed: ${(e as any)?.message || e}`);
            return undefined;
        }
    }

    private computeDiff(before: any, after: any) {
        if (this.options?.diff) return this.options.diff(before, after);
        try {
            const b = JSON.stringify(before);
            const a = JSON.stringify(after);
            if (b !== a) return {before, after};
        } catch {
            if (before !== after) return {before, after};
        }
        return undefined;
    }

    use() {
        return {recapture: () => (this.baseline = this.safeCapture())};
    }
}
