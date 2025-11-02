import {describe, it} from "node:test";
import assert from "node:assert/strict";

/**
 * A minimal test to verify node:test works without NodeBoot
 */
describe("Minimal Test", () => {
    it("should pass without any framework", () => {
        assert.strictEqual(1 + 1, 2);
    });
});
