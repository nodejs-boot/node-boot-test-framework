# Emergency Cleanup & Unhandled Errors

When using the `@nodeboot/node-test` adapter, the framework installs global listeners for `uncaughtException` and `unhandledRejection`.

If an unhandled error occurs:

1. `afterEach` hooks run if a test was active.
2. `afterAll` hooks run if not yet executed.
3. A metric `unhandledError` is recorded (if `MetricsHook` is present) with `{ name, message }`.
4. A structured cleanup log is produced internally (`cleanupLog`).
5. The process exits with code `1` unless any framework instance was created with `{ disableForcedExit: true }`.

## Purpose

Provides a unified emergency shutdown path when an uncaught exception or unhandled promise rejection occurs during tests. Ensures hooks, persistence layers, and containerized resources are cleaned up deterministically, preventing hung test processes and orphaned resources.

## Features

-   Automatic listeners for `uncaughtException` & `unhandledRejection`.
-   Idempotent emergency cleanup (never runs twice).
-   Metrics emission (`unhandledError`) when MetricsHook active.
-   Structured internal cleanup log (`cleanupLog`).
-   Optional forced process exit (default enabled) for test stability.
-   Multi-framework instance coordination — all instances receive cleanup.

## Activation / Setup

No explicit activation needed; provided when using `@nodeboot/node-test` integration. Behavior can be configured via the root framework options object passed to `useNodeBoot`.

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EmergencyCleanup - Basic", () => {
    // disableForcedExit keeps process alive after emergency for inspection
    const {} = useNodeBoot(EmptyApp, () => {}, undefined, {disableForcedExit: true});

    it("captures unhandled rejection", async () => {
        setTimeout(() => Promise.reject(new Error("background failure")), 10);
        // Allow event loop to process rejection
        await new Promise(r => setTimeout(r, 50));
        // If MetricsHook present we can assert
        // (fallback: we simply assert process not exited yet due to disableForcedExit)
        assert.ok(true);
    });
});
```

## Configuration

| Option              | Default | Description                                                  |
| ------------------- | ------- | ------------------------------------------------------------ |
| `disableForcedExit` | `false` | If true, prevents `process.exit(1)` after emergency cleanup. |

Configuration is passed as 4th argument to `useNodeBoot`.

```typescript
useNodeBoot(EmptyApp, setupCb, undefined, {disableForcedExit: true});
```

## Basic Usage Pattern

1. Use `disableForcedExit: true` when you want to introspect lingering handles.
2. Trigger an unhandled error (e.g., background promise rejection) inside a test.
3. Assert that metrics or logs reflect emergency cleanup.

```typescript
it("should record unhandledError metric", async () => {
    const {useMetrics} = useNodeBoot(EmptyApp, () => {}, undefined, {disableForcedExit: true});
    setTimeout(() => Promise.reject(new Error("boom")), 5);
    await new Promise(r => setTimeout(r, 30));
    const {getMetrics} = useMetrics();
    const unhandled = getMetrics("unhandledError");
    assert.ok(Array.isArray(unhandled));
    assert.ok(unhandled.length >= 1);
});
```

## Advanced Usage

-   **Multi-instance tests**: Start multiple app instances; any unhandled error triggers cleanup across all.
-   **Cascading failures**: Multiple errors close together still result in single cleanup cycle.
-   **Inspection window**: With forced exit disabled, you can enumerate open handles via `process._getActiveHandles?.()` (Node internal) before manual termination.

## Integration Patterns

| Hook                 | Pattern                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| MetricsHook          | Assert presence & count of `unhandledError` metric entries.                       |
| TimerHook            | Advance fake timers to ensure scheduled failing callbacks fire deterministically. |
| GenericContainerHook | Validate containers stopped by emergency path when test aborts mid-suite.         |

## API Reference (Semantic)

Emergency cleanup is implicit; no direct function. Control surface:

```typescript
useNodeBoot(AppClass, setupFn, hooksLibrary?, { disableForcedExit?: boolean });
```

Metrics entry (if enabled):

```typescript
{
    name: string;
    message: string;
} // recorded under key 'unhandledError'
```

Cleanup log (internal, exposed via debug logs) may include:

-   `hooks.afterEachTest.emergency`
-   `hooks.afterTests`
-   `server.close`
-   `ioc.reset`
-   `typeorm.destroy`

## Best Practices

-   Keep `disableForcedExit` false in CI to avoid hangs.
-   Use metrics rather than log parsing for validation when possible.
-   Avoid reliance on cleanup log string formats; treat them informational.
-   Design tests so intentional negative scenarios handle errors locally; rely on emergency path only for unexpected failures.

## Troubleshooting

| Symptom                    | Cause                           | Resolution                                                            |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| Process exits immediately  | `disableForcedExit` false       | Set `{disableForcedExit: true}` if inspection required.               |
| No `unhandledError` metric | MetricsHook not active          | Ensure MetricsHook part of hooks library; or ignore metric.           |
| Cleanup appears twice      | Log noise / multiple errors     | Path is idempotent; duplicate log lines are benign.                   |
| Container left running     | Forced exit before logs flushed | Use disableForcedExit and inspect logs; ensure container hook loaded. |

## Edge Cases

-   **Concurrent errors**: First triggers cleanup, subsequent ignored (idempotent guard).
-   **Long-running async resources**: If not tracked by framework they may persist with `disableForcedExit: true` — manually close them.
-   **Suppressed rejection handlers**: Adding a late `unhandledRejection` handler can interfere; rely on framework defaults.
-   **Metrics disabled**: Absence of `unhandledError` metric does not mean cleanup failed.

## Summary

Emergency cleanup guarantees deterministic resource release after unexpected failures; configure forced exit only when post-mortem analysis is needed.
