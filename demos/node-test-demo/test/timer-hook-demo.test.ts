import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {TestAppWithMongoPersistence} from "../src/app";

describe("TimerHook Demo", () => {
    const {useTimer} = useNodeBoot(TestAppWithMongoPersistence, ({useConfig}) => {
        useConfig({app: {port: 20005}});
    });

    it("advances fake timers and tracks elapsed time", () => {
        const {control, tracking} = useTimer();
        const tracker = tracking();
        let fired = false;
        setTimeout(() => {
            fired = true;
        }, 5000);
        control().advanceTimeBy(4999);
        assert.equal(fired, false, "Should not have fired yet");
        control().advanceTimeBy(1);
        assert.equal(fired, true, "Should have fired after advancing remaining ms");
        tracker.stop();
        assert.ok(tracker.elapsed() >= 0, "Elapsed should be >= 0");
    });
});
