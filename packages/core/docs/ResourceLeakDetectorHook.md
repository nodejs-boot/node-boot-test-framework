# ResourceLeakDetectorHook

Detects potential resource leaks between tests by comparing active handles and requests counts.

## What It Checks

-   `process._getActiveHandles()` count
-   `process._getActiveRequests()` count

If either increases relative to baseline captured at test start, a warning or error is produced.

## Configuration

```ts
useResourceLeakDetector({failOnLeak: true});
```

## Lifecycle

-   beforeEachTest: capture baseline counts.
-   afterEachTest: compute deltas and report.

## Output Examples

-   Warning: `Potential resource leak detected: +1 handles, +0 requests.`
-   Error (with `failOnLeak: true`): same message thrown.

## Usage

Mostly passive; include hook to monitor tests:

```ts
useResourceLeakDetector();
```

Optional utility:

```ts
const {snapshot} = useResourceLeakDetector();
console.log(snapshot()); // { handles: 5, requests: 0 }
```

## Common Leak Sources

-   Open timers not cleared.
-   Server sockets left listening.
-   Unresolved promises holding resources.

## Mitigation Tips

-   Close DB connections in per-test cleanup.
-   Use `TimerHook` to manage fake timers, ensuring timers stopped.
-   Defer large shared setup to `beforeAll` then teardown in `afterAll` (via `CleanupHook`).

## Caveats

-   Internal Node APIs may change; counts are heuristic.
-   Some handles remain intentionally (e.g., process signal handlers).
