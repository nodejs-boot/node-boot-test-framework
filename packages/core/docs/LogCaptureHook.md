# LogCaptureHook

Captures logs emitted by the shared framework logger during test execution for assertions and diagnostics.

## Features

-   Captures logs at or above a chosen minimum level.
-   Per-test log isolation (`getCurrentTest`).
-   Global aggregation (`getAll`).
-   Optional automatic failure when error-level logs appear.

## Configuration

```ts
useLogCapture({
    level: "info", // minimum level to record (default: debug)
    assertNoError: true, // fail test if any error log occurs
});
```

## Usage

```ts
const {getCurrentTest, getAll, clearCurrent} = useLogCapture();
const errors = getCurrentTest().filter(e => e.level === "error");
expect(errors.length).toBe(0);
clearCurrent(); // optional
```

## API

`useLogCapture()` returns:

-   `getAll(): LogEntry[]` all captured entries.
-   `getCurrentTest(): LogEntry[]` entries for the current test.
-   `clearCurrent(): void` empties current test buffer.

`LogEntry`:

```ts
{
    level: string;
    message: string;
}
```

## Lifecycle

-   beforeTests: patches logger.
-   beforeEachTest: resets current buffer.
-   afterEachTest: performs `assertNoError` check.
-   afterTests: restores original logger and clears buffers.

## Assertions Examples

```ts
expect(getAll().some(e => /started/i.test(e.message))).toBe(true);
```

## Best Practices

-   Use `assertNoError` sparingly; intentional error logging for negative tests will fail them.
-   Combine with `LogMatchHook` for richer pattern checks.

## Troubleshooting

If no logs are captured:

-   Ensure tests use the same logger instance via framework utilities.
-   Verify minimum level is not excluding desired logs.
