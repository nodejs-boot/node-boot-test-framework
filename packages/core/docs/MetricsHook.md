# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.

# MetricsHook

Collects and reports custom metrics plus per-test durations.

## Automatic Metrics

-   `testDuration`: ms elapsed for each test.

## Custom Metrics

```ts
const {useMetrics} = useNodeBoot(MyApp, ({useMetrics}) => {
    /* no registration needed */
});

test("records metrics", () => {
    const {recordMetric, startTimer, getMetrics} = useMetrics();
    recordMetric("apiCalls", 3);
    const timer = startTimer("dbRead");
    // ... do work
    const ms = timer.end();
    expect(ms).toBeGreaterThan(0);
    const all = getMetrics();
    expect(all.apiCalls).toContain(3);
});
```

## API

`useMetrics()` returns:

-   `recordMetric(name, value)` append value.
-   `getMetrics(name?)` array for name or object of all metrics.
-   `startTimer(name)` returns `{ end(): number }` measuring duration & auto-recording under `name`.

## Reporting

After all tests a summary logs averages for numeric series.
Format: `metricName: avg=12.34ms, min=10ms, max=15ms`.

## Best Practices

-   Use consistent metric naming (`layer.operation`).
-   Record numeric data for aggregations; non-numeric values stored but not summarized meaningfully.

## Troubleshooting

If averages look NaN ensure values are numeric; avoid mixing types in same metric.
