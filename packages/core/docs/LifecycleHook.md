# LifecycleHook

The `LifecycleHook` unifies setup and cleanup logic for all test lifecycle phases. Register functions to run before/after all tests or before/after each test. This replaces both `SetupHook` and `CleanupHook`.

## Purpose

Unify suite-wide and per-test setup/cleanup using a single hook. Replace older `useSetup` and `useCleanup` with a coherent API that covers `beforeAll`, `beforeEach`, `afterEach`, and `afterAll`.

## When It Runs

-   `beforeAll`: Runs once before all tests
-   `beforeEach`: Runs before each test
-   `afterEach`: Runs after each test
-   `afterAll`: Runs once after all tests

## Registering Lifecycle Functions

```ts
useLifecycle({
    beforeAll: () => {
        /* global setup */
    },
    beforeEach: () => {
        /* per-test setup */
    },
    afterEach: () => {
        /* per-test cleanup */
    },
    afterAll: () => {
        /* global cleanup */
    },
});
```

You can call `useLifecycle` multiple times; functions accumulate for each phase.

## Basic Usage (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("LifecycleHook - Basic", () => {
    let suiteReady = false;
    let perTest = 0;

    const {} = useNodeBoot(EmptyApp, ({useLifecycle}) => {
        useLifecycle({
            beforeAll: () => {
                suiteReady = true;
            },
            beforeEach: () => {
                perTest++;
            },
            afterEach: () => {
                /* cleanup */
            },
            afterAll: () => {
                /* global cleanup */
            },
        });
    });

    it("runs lifecycle", () => {
        assert.ok(suiteReady);
        assert.ok(perTest >= 1);
    });

    it("increments per test", () => {
        assert.ok(perTest >= 2);
    });
});
```

## Async Lifecycle Functions

```typescript
describe("LifecycleHook - Async", () => {
    let cache: Map<string, any>;

    const {} = useNodeBoot(EmptyApp, ({useLifecycle}) => {
        useLifecycle({
            beforeAll: async () => {
                cache = new Map();
                await Promise.resolve();
            },
            beforeEach: async () => {
                cache.clear();
            },
            afterAll: async () => {
                cache = new Map();
            },
        });
    });

    it("supports async phases", async () => {
        cache.set("k", "v");
        assert.strictEqual(cache.get("k"), "v");
    });
});
```

## Multiple Registrations Accumulate

```typescript
describe("LifecycleHook - Multiple", () => {
    const log: string[] = [];

    const {} = useNodeBoot(EmptyApp, ({useLifecycle}) => {
        useLifecycle({beforeEach: () => log.push("setup1"), afterEach: () => log.push("cleanup1")});
        useLifecycle({beforeEach: () => log.push("setup2"), afterEach: () => log.push("cleanup2")});
    });

    it("runs all", () => {
        assert.ok(log.includes("setup1"));
        assert.ok(log.includes("setup2"));
    });
});
```

## Integration Patterns

| Hook                  | Pattern                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| FileSystemSandboxHook | Create per-test sandbox in `beforeEach`, rely on automatic deletion in `afterEach`. |
| MetricsHook           | Start/stop timers or record metrics in lifecycle phases around expensive setup.     |
| EmergencyCleanup      | Lifecycle cleanup still runs when emergency path triggers after a test failure.     |

## API

`useLifecycle(options: { beforeAll?: () => void; beforeEach?: () => void; afterEach?: () => void; afterAll?: () => void })`

-   `beforeAll`: Runs once before all tests
-   `beforeEach`: Runs before each test
-   `afterEach`: Runs after each test
-   `afterAll`: Runs once after all tests

## Detailed API

```typescript
useLifecycle(options: {
  beforeAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
});
```

Notes:

-   All phases are optional.
-   Multiple `useLifecycle` calls accumulate functions, executed in registration order.
-   Async functions are awaited properly before proceeding to the next phase.

## Best Practices

-   Keep setup/cleanup idempotent (safe to run even if state already set/cleared).
-   Prefer per-test setup/cleanup for isolation; use global for expensive resources.
-   Do not throw unless failure must fail suite; prefer logging.
-   Keep functions idempotent; repeated runs should be safe.
-   Prefer `beforeEach`/`afterEach` for isolation; reserve `beforeAll`/`afterAll` for expensive shared resources.
-   Avoid throwing unless failing entire suite is intentional; log and assert within tests.
-   Use small, explicit side-effects; document via logs for easier debugging.

## Troubleshooting

| Symptom               | Cause                          | Resolution                                                                 |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Phase seems skipped   | Not registered in setup        | Ensure `useLifecycle` is called inside the `useNodeBoot` setup callback.   |
| Wrong order execution | Mixed registrations            | Check registration order; functions run in the order they were registered. |
| Async not awaited     | Function not returning promise | Return/await appropriately in async lifecycle functions.                   |

## Edge Cases

-   Lifecycle functions must be defined synchronously in the setup callback; avoid dynamic conditional registration during tests.
-   Long-running async operations in `beforeAll` can delay tests; consider timeouts and performance budgets.
-   Ensure `afterAll` does not throw, so cleanup completes in CI.

## Example

```ts
describe("temp files", () => {
    const {useFileSystemSandbox, useLifecycle} = useNodeBoot(MyApp, ({useFileSystemSandbox, useLifecycle}) => {
        useFileSystemSandbox();
        useLifecycle({
            beforeEach: () => console.log("Test setup"),
            afterEach: () => console.log("Test cleaned"),
            afterAll: () => console.log("Suite cleaned"),
        });
    });

    test("writes file", () => {
        const sandbox = useFileSystemSandbox();
        sandbox.writeText("a.txt", "hello");
    });
});
```

## Migration

-   Replace `useSetup` and `useCleanup` with `useLifecycle`.
-   All options are supported in a single call.
