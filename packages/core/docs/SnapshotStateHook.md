# SnapshotStateHook

Captures and compares state before and after each test to detect unintended mutations.

## Purpose

Detect unintended global or shared state mutations between tests by capturing structured snapshots before and after each test and computing diffs. Helps enforce isolation and purity, catching hidden side-effects.

## Features

-   Custom `capture()` strategy for domain-specific state extraction.
-   Pluggable `diff(before, after)` logic.
-   Automatic baseline capture per test.
-   Optional assertion failure on non-empty diff.
-   Manual `recapture()` to reset baseline mid-test after intentional mutation.

## Configuration

```ts
useSnapshotState({
    capture: () => deepClone(globalState),
    assertEmpty: true, // throw if diff detected
    label: "globalState",
    onDiff: diff => console.warn("State changed", diff),
});
```

## Setup

Register snapshot hook in setup callback:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

const globalState = {cache: new Map<string, string>()};

describe("SnapshotStateHook - Basic", () => {
    const {useSnapshotState} = useNodeBoot(EmptyApp, ({useSnapshotState}) => {
        useSnapshotState({
            capture: () => ({cacheSize: globalState.cache.size}),
            label: "cache",
            assertEmpty: true,
            diff: (b, a) => (b.cacheSize !== a.cacheSize ? {before: b, after: a} : undefined),
        });
    });

    it("adds entry", () => {
        globalState.cache.set("k", "v");
        // Will trigger diff after test
        assert.ok(globalState.cache.get("k") === "v");
    });
});
```

## Basic Usage

```typescript
useSnapshotState({
    capture: () => ({users: userService.count()}),
    diff: (b, a) => (b.users !== a.users ? {before: b, after: a} : undefined),
    assertEmpty: false,
});
```

## Advanced Usage

-   **Selective Fields**: Capture only counters (`length`, `size`, counts) for performance.
-   **Multiple Hooks**: Register separate SnapshotStateHook instances for different domains (e.g. cache, subscriptions).
-   **Mid-test Reset**: Call `recapture()` after intentional mutation to set a new baseline.

```typescript
it("intentional mutation then recapture", () => {
    const {recapture} = useSnapshotState();
    performIntentionalChange();
    recapture(); // New baseline set here
    // Further unintended changes still detected
});
```

## Integration Patterns

| Hook                 | Pattern                                                      |
| -------------------- | ------------------------------------------------------------ |
| MemoryFileSystemHook | Capture file count before/after for unwanted file creation.  |
| MockHook             | Ensure mocks do not leak added properties into global state. |
| MetricsHook          | Log diff size as custom metric when present.                 |

## API Reference

### Registration

```typescript
useSnapshotState({
  capture: () => any,            // required
  diff?: (before: any, after: any) => any | undefined,
  assertEmpty?: boolean,         // default false
  label?: string,                // descriptive label for logging
  onDiff?: (diff: any) => void,  // invoked when diff detected
});
```

### Test Access

```typescript
const {recapture} = useSnapshotState();
recapture(); // resets baseline to current capture()
```

### Diff Behavior

-   If custom `diff` provided: non-`undefined` return treated as difference object.
-   If no `diff`: falls back to JSON string comparison, then strict inequality.

## Edge Cases

| Case                     | Description                              | Guidance                                     |
| ------------------------ | ---------------------------------------- | -------------------------------------------- |
| Large object graphs      | Slower capture & diff                    | Reduce scope; capture summary counts.        |
| Mutable references       | Same object returned twice => empty diff | Always return a _new_ object in `capture()`. |
| Async late mutation      | Mutation after afterEach                 | Avoid scheduling mutations beyond test end.  |
| Multiple recapture calls | Baselines keep updating                  | Limit recapture to intentional resets only.  |

## Troubleshooting

| Symptom                      | Cause                           | Fix                                                        |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Diff always empty            | Returning same reference        | Return cloned / new object each call.                      |
| Unexpected assertion failure | Legit side-effect               | Inspect diff object; adjust test or recapture.             |
| Performance slowdown         | Heavy capture                   | Capture smaller subset (counts only).                      |
| onDiff not called            | Diff function returns undefined | Ensure logic returns truthy object when difference exists. |

## Best Practices

-   Keep capture minimal & stable.
-   Provide explicit `label` for clearer logs.
-   Use `assertEmpty: true` only after verifying baseline stability.
-   Combine with metrics to trend mutation frequency.

## Example (Mutation Detection)

```typescript
useSnapshotState({
    capture: () => ({activeSessions: sessionRegistry.size}),
    diff: (b, a) => (b.activeSessions !== a.activeSessions ? {before: b, after: a} : undefined),
    assertEmpty: true,
    onDiff: d => console.warn("Session leak detected", d),
});
```

## Summary

SnapshotStateHook surfaces hidden shared state mutations, reinforcing test isolation and reliability. Start with non-failing observation, then enforce when stable.
