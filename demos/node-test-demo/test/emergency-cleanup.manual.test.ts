import {describe, it} from "node:test";
import assert from "node:assert";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("Emergency cleanup: manual trigger", () => {
    const {useMetrics, useTimer} = useNodeBoot(EmptyApp);

    it("records emergency cleanup metrics when triggered manually", async () => {
        // Manually trigger emergency cleanup via a scheduled timer (uses fake timers from TimerHook)
        const {control} = useTimer();

        setTimeout(() => {
            const fw = (global as any).__nodeboot_active_frameworks__?.[0];
            fw?.emergencyCleanup(new Error("background failure test"));
        }, 5);

        // Advance fake time so the scheduled callback executes
        control().advanceTimeBy(5);

        // Allow any asynchronous microtasks (setImmediate in cleanup) to flush
        await new Promise(r => setImmediate(r));

        const {getMetrics} = useMetrics();
        const events = getMetrics("emergencyCleanup.events");
        const errors = getMetrics("emergencyCleanup.error");
        assert.ok((events as any).length >= 1, "Expected at least one emergencyCleanup.events metric");
        assert.ok((errors as any).length >= 1, "Expected at least one emergencyCleanup.error metric");
        assert.ok((errors as any).some((e: any) => e.message?.includes("background failure test")));
    });
});
