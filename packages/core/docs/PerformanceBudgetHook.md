# PerformanceBudgetHook

Detect performance regressions early by enforcing maximum allowed durations for named code segments inside tests (e.g., `dbQuery`, `renderCycle`, `cacheWarmup`). Provides a simple timing abstraction without manual `Date.now()` usage.

## Features

-   Declarative per-label budgets.
-   Automatic finalization if `stop()` omitted.
-   Optional test failure when exceeding thresholds.
-   Multiple concurrent trackers per test.
-   Elapsed time inspection before stop.

## Setup

Register in `useNodeBoot` setup callback:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PerformanceBudgetHook - Basic", () => {
    const {usePerformanceBudget} = useNodeBoot(EmptyApp, ({usePerformanceBudget}) => {
        usePerformanceBudget({budgets: {dbQuery: 50}});
    });

    it("measures dbQuery", async () => {
        const {start} = usePerformanceBudget();
        const t = start("dbQuery");
        await fakeDbWork();
        t.stop();
        assert.ok(t.elapsed() <= 50); // or rely on hook for failure
    });
});
```

## Basic Usage

```typescript
const {start} = usePerformanceBudget();
const tracker = start("render");
// do render
tracker.stop();
console.log(`Render took ${tracker.elapsed()}ms`);
```

## Configuration

```typescript
usePerformanceBudget({
    budgets: {dbQuery: 50, render: 30},
    failOnExceeded: true,
});
```

## Advanced Usage

-   **Group Labels**: Prefix labels (e.g. `repo.user.save`) for natural categorization.
-   **Dynamic Budgets**: Compute budgets from environment variables or prior metrics.
-   **Exploratory Mode**: Disable `failOnExceeded` initially to gather baseline timings before enforcing.
-   **Parallel Trackers**: Start multiple trackers in same test; each is independent.

```typescript
it("parallel operations", async () => {
    const {start} = usePerformanceBudget();
    const a = start("opA");
    const b = start("opB");
    await Promise.all([doA(), doB()]);
    a.stop();
    b.stop();
});
```

## Integration Patterns

| Hook                   | Pattern                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| TimerHook              | Use fake timers for deterministic time progression when code uses timeouts. |
| MetricsHook            | Record tracker elapsed values as custom metrics for historical comparison.  |
| MongoMemoryReplSetHook | Apply budgets to transaction or change stream initialization times.         |

## API Reference

### Registration

```typescript
usePerformanceBudget({
  budgets?: Record<string, number>; // label -> max ms
  failOnExceeded?: boolean;         // throw when exceeded
});
```

### Test Access

```typescript
const { start } = usePerformanceBudget();
const tracker = start(label: string): {
  stop(): void;
  elapsed(): number; // ms
};
```

### Behavior

-   Multiple calls to `start(label)` create distinct trackers (last win for budget comparison).
-   Missing budget => measured but never fails.
-   `stop()` optional; auto finalization occurs in `afterEachTest`.

## Logging Format

-   Success: `Performance within budget for 'label': 12.34ms <= 50ms`
-   Failure: `Performance budget exceeded for 'label': 75.12ms > 50ms`

## Edge Cases

| Case                          | Outcome               | Guidance                               |
| ----------------------------- | --------------------- | -------------------------------------- |
| Forgot `stop()`               | Auto-stop in cleanup  | Prefer explicit `stop()` for clarity.  |
| Ultra-fast operation (~0ms)   | Elapsed may be 0      | Acceptable; no action needed.          |
| Duplicate label started twice | Last tracker compared | Use unique labels or suffixes.         |
| Negative/zero budget          | Treat as threshold    | Avoid unrealistic values; set >= 1ms.  |
| Fake timers + real async      | Skewed results        | Use only one timing strategy per test. |

## Best Practices

-   Start trackers as close to the operation boundary as possible.
-   Use stable environments (disable noise like network variability) before tightening budgets.
-   Revisit budgets periodically—avoid permanent overly strict thresholds.
-   Keep labels consistent across suites for aggregation.

## Troubleshooting

| Symptom             | Cause                                     | Fix                                     |
| ------------------- | ----------------------------------------- | --------------------------------------- |
| All trackers exceed | Budget unrealistic                        | Increase thresholds or optimize code.   |
| Nothing logs        | Hook not registered                       | Call `usePerformanceBudget()` in setup. |
| Unexpected failure  | Label reused for multiple long operations | Split operations into distinct labels.  |

## Comparison

| Manual Timing            | PerformanceBudgetHook     |
| ------------------------ | ------------------------- |
| Repetitive boilerplate   | Single concise API        |
| No automatic enforcement | Built-in threshold checks |
| Harder to standardize    | Centralized config        |

## Summary

PerformanceBudgetHook provides a lightweight mechanism to codify performance expectations directly in tests—measure, observe, then enforce.
