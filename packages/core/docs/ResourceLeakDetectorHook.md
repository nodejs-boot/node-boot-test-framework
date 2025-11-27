# ResourceLeakDetectorHook

Detects potential resource leaks between tests by comparing active handles and requests counts.

## Purpose

Detect potential resource leaks between tests by tracking Node active handles and requests. Helps reveal unclosed timers, sockets, DB connections, or lingering async operations that can cause flaky suites and slow CI.

## Features

-   Baseline snapshot per test of `process._getActiveHandles()` and `process._getActiveRequests()`
-   Computes deltas after each test and warns or fails based on configuration
-   Optional programmatic snapshot access for custom diagnostics
-   Passive monitoring—no changes to your application code required

## Setup / Activation (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ResourceLeakDetectorHook - Basic", () => {
    const {useResourceLeakDetector} = useNodeBoot(EmptyApp, ({useResourceLeakDetector}) => {
        useResourceLeakDetector({failOnLeak: false});
    });

    it("runs without leaks", async () => {
        // No lingering handles expected
        assert.ok(true);
    });
});
```

## Configuration

```typescript
useResourceLeakDetector({
    failOnLeak: true, // throw error when leak is detected
});
```

## Simulating a Leak (for demonstration)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ResourceLeakDetectorHook - Simulated Leak", () => {
    const {useResourceLeakDetector} = useNodeBoot(EmptyApp, ({useResourceLeakDetector}) => {
        useResourceLeakDetector({failOnLeak: true});
    });

    it("detects unclosed timer leak", () => {
        // Intentionally create a timer and do not clear it
        setInterval(() => {}, 1000);
        assert.ok(true);
        // After test, detector will compare counts and fail due to +1 handle
    });
});
```

## Programmatic Snapshot

```typescript
const {snapshot} = useResourceLeakDetector();
const {handles, requests} = snapshot();
console.log({handles, requests});
```

## Lifecycle

-   beforeEachTest: capture baseline counts
-   afterEachTest: compute deltas and report (warn or throw)

## Output Examples

-   Warning: `Potential resource leak detected: +1 handles, +0 requests.`
-   Error (with `failOnLeak: true`): same message thrown

## Integration Patterns

| Hook                 | Pattern                                                            |
| -------------------- | ------------------------------------------------------------------ |
| TimerHook            | Use fake timers and ensure all timers are stopped to avoid leaks.  |
| GenericContainerHook | Ensure containers stop properly; detector flags lingering handles. |
| EmergencyCleanup     | Confirms cleanup path reduced handles after unexpected failures.   |

## API (shape)

```typescript
useResourceLeakDetector({
  failOnLeak?: boolean; // default false
});

// Access during tests
const { snapshot } = useResourceLeakDetector();
// snapshot(): { handles: number; requests: number }
```

## Common Leak Sources

-   Open timers not cleared
-   Server sockets left listening
-   Unresolved promises holding resources
-   Streams not closed (file/network)

## Mitigation Tips

-   Close DB connections in per-test cleanup (`afterEach`)
-   Use `TimerHook` to manage fake timers, ensuring timers stopped
-   Prefer `beforeAll` for expensive setup and ensure `afterAll` cleanup
-   Ensure HTTP servers are closed on test completion

## Caveats

-   Internal Node APIs may change; counts are heuristic
-   Some handles remain intentionally (e.g., process signal handlers)
-   Not all resource types are reflected in these counts

## Troubleshooting

| Symptom               | Cause                         | Resolution                                         |
| --------------------- | ----------------------------- | -------------------------------------------------- |
| Persistent +1 handles | Timer/interval left running   | Clear intervals/timeouts; use `TimerHook`.         |
| Requests delta > 0    | Pending network/file requests | Ensure requests complete or are aborted.           |
| False positives       | Background framework activity | Validate with snapshot logs; add targeted cleanup. |
