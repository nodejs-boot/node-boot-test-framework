import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// Demo for PerformanceBudgetHook
// - Declares performance budgets for labeled code segments
// - Starts and stops trackers inside tests
// - Shows passing budget (quickOp) and exceeding budget (heavyOp) without failing (failOnExceeded=false)
// - Demonstrates multiple labeled measurements in a single test

const budgets = {
    quickOp: 100, // plenty of headroom for a trivial operation
    heavyOp: 5, // intentionally small to trigger a warning
    comboOpA: 50,
    comboOpB: 50,
};

describe("PerformanceBudgetHook Demo", () => {
    const {usePerformanceBudget} = useNodeBoot(EmptyApp, ({useConfig, usePerformanceBudget}) => {
        useConfig({app: {port: 35005}});
        // Set failOnExceeded=false so exceeding budgets only logs warnings and does not fail tests
        usePerformanceBudget({budgets, failOnExceeded: false});
    });

    it("tracks a fast operation within budget", () => {
        const {start} = usePerformanceBudget();
        const tracker = start("quickOp");
        // Trivial synchronous work
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        tracker.stop();
        const elapsed = tracker.elapsed();
        assert.ok(elapsed >= 0, "Elapsed time should be non-negative");
        assert.ok(elapsed < budgets.quickOp, `quickOp should complete within its ${budgets.quickOp}ms budget`);
    });

    it("exceeds a tight budget and only logs a warning (heavyOp)", () => {
        const {start} = usePerformanceBudget();
        const tracker = start("heavyOp");
        // Busy loop until we cross ~10ms (overshooting 5ms budget). Loop condition avoids excessive spin.
        const targetMs = 10;
        while (tracker.elapsed() < targetMs) {
            // minimal work; checking elapsed repeatedly
        }
        tracker.stop();
        const elapsed = tracker.elapsed();
        assert.ok(elapsed >= targetMs, `heavyOp should overshoot target ~${targetMs}ms`);
        assert.ok(elapsed > budgets.heavyOp, "heavyOp should exceed its strict budget to trigger warning");
        // Test still passes because failOnExceeded=false
    });

    it("records multiple labeled segments in one test", () => {
        const {start} = usePerformanceBudget();
        const a = start("comboOpA");
        for (let i = 0; i < 50_000; i++) Math.sqrt(i); // some work
        a.stop();
        const b = start("comboOpB");
        for (let i = 0; i < 20_000; i++) JSON.stringify({i});
        b.stop();
        assert.ok(a.elapsed() < budgets.comboOpA + 100, "comboOpA should be reasonably fast");
        assert.ok(b.elapsed() < budgets.comboOpB + 100, "comboOpB should be reasonably fast");
    });
});
