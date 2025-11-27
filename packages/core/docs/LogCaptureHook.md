# LogCaptureHook

Captures logs emitted by the framework logger during tests to assert log content, levels, and sequences. Useful for validating operational behavior, warnings, and error paths without relying on console output.

## Features

-   Minimum level filter (debug/info/warn/error)
-   Per-test isolation and global aggregation
-   Optional automatic failure on error-level logs
-   Simple API: getCurrentTest, getAll, clearCurrent

## Setup / Activation

Register in `useNodeBoot` setup callback:

```ts
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("LogCaptureHook - Basic", () => {
    const {useLogCapture, useLogger} = useNodeBoot(EmptyApp, ({useLogCapture}) => {
        useLogCapture({level: "info"});
    });

    it("captures info & warn logs", () => {
        const logger = useLogger();
        const {getCurrentTest} = useLogCapture();

        logger.info("Test log message");
        logger.warn("Warning message");

        const logs = getCurrentTest();
        assert.strictEqual(logs.length, 2);
        assert.ok(logs.some(l => l.message.includes("Test log message")));
    });
});
```

## Configuration

```ts
useLogCapture({
    level: "info", // minimum level to record (default: debug)
    assertNoError: true, // fail test if any error log occurs
});
```

## Usage Examples

### Assert no errors

```ts
const {getCurrentTest} = useLogCapture();
const errors = getCurrentTest().filter(e => e.level === "error");
assert.strictEqual(errors.length, 0);
```

### Per-test isolation

```ts
it("first test", () => {
    const {getCurrentTest} = useLogCapture();
    const logger = useLogger();
    logger.info("First test log");
    assert.strictEqual(getCurrentTest().length, 1);
});

it("second test", () => {
    const {getCurrentTest} = useLogCapture();
    const logger = useLogger();
    logger.info("Second test log");
    const logs = getCurrentTest();
    assert.strictEqual(logs.length, 1);
    assert.ok(logs[0].message.includes("Second test"));
});
```

### Global aggregation

```ts
const {getAll} = useLogCapture();
assert.ok(getAll().length >= 2);
```

### Clear current buffer

```ts
const {getCurrentTest, clearCurrent} = useLogCapture();
// ... emit some logs
clearCurrent();
assert.strictEqual(getCurrentTest().length, 0);
```

## API

`useLogCapture()` returns:

-   `getAll(): LogEntry[]` — all captured entries across all tests
-   `getCurrentTest(): LogEntry[]` — entries for the current test
-   `clearCurrent(): void` — empties current test buffer

`LogEntry` shape:

```ts
{
    level: string; // "debug" | "info" | "warn" | "error"
    message: string; // log message
}
```

## Lifecycle

-   beforeTests: patches logger
-   beforeEachTest: resets current buffer
-   afterEachTest: performs `assertNoError` check
-   afterTests: restores original logger and clears buffers

## Assertions Examples

```ts
expect(getAll().some(e => /started/i.test(e.message))).toBe(true);
```

## Best Practices

-   Use `assertNoError` sparingly; negative tests that emit errors will fail
-   Combine with `LogMatchHook` for richer pattern checks
-   Keep level at `info` or `warn` to reduce noise

## Troubleshooting

**No logs captured**

-   Ensure tests use the framework logger (not `console.log`)
-   Verify minimum level isn’t excluding desired logs
-   Check logger initialization

**Too many logs**

-   Increase minimum level
-   Filter by message pattern
-   Prefer `getCurrentTest()` instead of `getAll()` for isolation
