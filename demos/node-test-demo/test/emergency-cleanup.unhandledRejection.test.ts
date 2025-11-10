import {describe, it} from "node:test";
import assert from "node:assert";
import {useNodeBoot} from "@nodeboot/node-test";
import {removeDefaultTestListeners} from "@nodeboot/test";
import {EmptyApp} from "../src/empty-app";

describe("Emergency cleanup: unhandledRejection", () => {
    const {useMetrics} = useNodeBoot(EmptyApp);

    it("triggers emergency cleanup on unhandledRejection via process.emit", async () => {
        const {getMetrics} = useMetrics();
        const initialEvents = getMetrics("emergencyCleanup.events") || [];

        // Remove default test listeners to avoid interference and allow test to proceed normally after emitting the event
        const {restore} = removeDefaultTestListeners();

        // Emit unhandledRejection directly to trigger the handler
        const testError = new Error("forced unhandled rejection via emit");
        const fakePromise = Promise.reject(testError);
        process.emit("unhandledRejection", testError, fakePromise);

        // Allow the handler to process
        await new Promise(r => setImmediate(r));

        const events = getMetrics("emergencyCleanup.events") || [];
        const errors = getMetrics("emergencyCleanup.error") || [];

        assert.ok(events.length > initialEvents.length, "Expected new emergencyCleanup.events metric");
        assert.ok((errors as any).some((e: any) => e.message?.includes("forced unhandled rejection via emit")));

        // Restore the removed listeners
        restore();
    });
});
