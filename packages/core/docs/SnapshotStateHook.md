# SnapshotStateHook

Captures and compares state before and after each test to detect unintended mutations.

## Configuration

```ts
useSnapshotState({
    capture: () => deepClone(globalState),
    assertEmpty: true, // throw if diff detected
    label: "globalState",
    onDiff: diff => console.warn("State changed", diff),
});
```

## Diff Strategies

-   Custom: provide `diff(before, after)` returning any truthy diff object.
-   Default: JSON.stringify comparison; falls back to strict inequality.

## Lifecycle

-   beforeEachTest: capture baseline via `capture()`.
-   afterEachTest: recapture and compute diff; log warning or throw if `assertEmpty`.

## API

`useSnapshotState().recapture()` — manually resets baseline mid-test after intentional state changes.

## Example

```ts
useSnapshotState({
    capture: () => ({cacheSize: myCache.size}),
    diff: (b, a) => (b.cacheSize !== a.cacheSize ? {before: b, after: a} : undefined),
});
```

## Best Practices

-   Keep captured objects small; avoid huge graphs.
-   Use selective capture (counts, lengths) for performance.
-   Combine with `MockHook` to observe side effects of mocks.

## Troubleshooting

If diff always empty:

-   Ensure `capture` returns new object each time (avoid returning same reference).
