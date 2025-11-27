# MetricsHook

Collect custom metrics and per-test durations during test execution. Useful for profiling critical operations, tracking API call counts, query timings, and computing summary statistics at the end of the suite.

## Features

-   Automatic per-test duration metric (`testDuration`)
-   Record arbitrary numeric/string metrics via `recordMetric`
-   Timers for operation measurement via `startTimer`
-   Retrieve specific or all metrics with `getMetrics`
-   Summary reporting after tests (avg/min/max/count for numeric series)

## Setup / Activation (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MetricsHook - Basic Usage", () => {
    const {useMetrics} = useNodeBoot(EmptyApp, () => {
        // Metrics available without explicit registration
    });

    it("records custom metrics", () => {
        const {recordMetric, getMetrics} = useMetrics();
        recordMetric("apiCalls", 3);
        recordMetric("apiCalls", 5);
        recordMetric("apiCalls", 2);

        const metrics = getMetrics("apiCalls");
        assert.deepStrictEqual(metrics, [3, 5, 2]);
    });
});
```

## Using Timers

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MetricsHook - Timers", () => {
    const {useMetrics} = useNodeBoot(EmptyApp, () => {});

    it("measures operation duration", () => {
        const {startTimer, getMetrics} = useMetrics();
        const t = startTimer("dbQuery");
        // simulate work
        let sum = 0;
        for (let i = 0; i < 1_000_0; i++) sum += i;
        const elapsed = t.end();
        assert.ok(elapsed > 0);
        assert.strictEqual(getMetrics("dbQuery")[0], elapsed);
    });
});
```

## Naming Conventions

```typescript
it("hierarchical names", () => {
    const {recordMetric, getMetrics} = useMetrics();
    recordMetric("api.users.create", 150);
    recordMetric("db.users.select", 75);
    recordMetric("cache.users.get", 5);
    const all = getMetrics();
    assert.ok(all["api.users.create"]);
    assert.ok(all["db.users.select"]);
    assert.ok(all["cache.users.get"]);
});
```

## Reporting

After tests complete, a summary is logged for numeric metrics:

Format: `metricName: avg=12.34ms, min=10ms, max=15ms, count=5`

Example:

```
Metrics Summary:
  api.users.create: avg=150ms, min=120ms, max=180ms, count=10
  db.query.time:    avg=75ms,  min=50ms,  max=100ms, count=25
  testDuration:     avg=250ms, min=100ms, max=500ms, count=15
```

## API

`useMetrics()` returns:

-   `recordMetric(name: string, value: number | string): void` — append value under `name`
-   `getMetrics(name?: string): any` — array for `name`, or object of all metrics
-   `startTimer(name: string): { end(): number }` — measure duration and auto-record under `name`

## Best Practices

-   Use consistent hierarchical naming (`layer.entity.operation`)
-   Prefer numeric values for aggregations (avg/min/max)
-   Use timers for durations rather than manual `Date.now()`
-   Keep metrics granular and focused to aid analysis
-   Combine with PerformanceBudgetHook for enforcement

## Troubleshooting

**Averages show NaN**

-   Ensure values are numeric; avoid mixing types within a single metric name

**Metrics missing**

-   Verify `recordMetric` and `startTimer().end()` are called
-   Check name spelling; `getMetrics("name")` returns an array only if recorded

**Timer values unexpected**

-   Call `end()` exactly once per measurement
-   Avoid reusing a timer object; create a new one per operation
