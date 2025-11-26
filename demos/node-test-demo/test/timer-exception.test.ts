import {describe, it} from "node:test";
import assert from "node:assert";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("Timer exception capture", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        // required to enable fake timers
        useTimer({});
    });

    it("surfaces timer callback thrown error with assert.throws via fake timers", () => {
        const {control} = useTimer();

        setTimeout(() => {
            throw new Error("simulated failure for test");
        }, 5);

        assert.throws(
            () => {
                control().advanceTimeBy(5);
            },
            /simulated failure for test/,
            "Expected timer callback to throw the simulated failure error",
        );
    });
});
