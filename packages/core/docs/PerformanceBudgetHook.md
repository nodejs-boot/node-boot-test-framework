# PerformanceBudgetHook

Enforces time budgets for labeled code segments within tests. Helps catch regressions by measuring durations and optionally failing when thresholds exceeded.

## Configuration

```ts
usePerformanceBudget({
    budgets: {dbQuery: 50, render: 30}, // ms thresholds
    failOnExceeded: true, // throw if exceeded
});
```

## Usage

```ts
const {start} = usePerformanceBudget();
const t = start("dbQuery");
await doDbWork();
t.stop(); // measurement recorded
```

Implicit stop: If you forget `stop()`, the hook stops remaining trackers automatically at `afterEachTest`.

## Lifecycle

-   beforeEachTest: resets trackers.
-   afterEachTest: finalizes trackers, compares results vs budgets, logs warnings, optionally throws.

## API

`usePerformanceBudget().start(label)` returns:

-   `stop(): void` finalize.
-   `elapsed(): number` current or final elapsed ms.

## Logging

-   Success: `Performance within budget for 'label': 12.34ms <= 50ms`
-   Failure: `Performance budget exceeded for 'label': 75.12ms > 50ms`

## Best Practices

-   Keep budgets realistic; start with observed median + headroom.
-   Isolate external variability (network, I/O) before enforcing strict limits.
-   Use descriptive labels (`repo.saveUser`) rather than generic (`operation`).

## Troubleshooting

If all measurements are zero:

-   Ensure asynchronous work awaited before `stop()`.
-   Avoid mixing real timers with fake timers without synchronizing.
