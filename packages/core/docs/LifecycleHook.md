# LifecycleHook

The `LifecycleHook` unifies setup and cleanup logic for all test lifecycle phases. Register functions to run before/after all tests or before/after each test. This replaces both `SetupHook` and `CleanupHook`.

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

## API

`useLifecycle(options: { beforeAll?: () => void; beforeEach?: () => void; afterEach?: () => void; afterAll?: () => void })`

-   `beforeAll`: Runs once before all tests
-   `beforeEach`: Runs before each test
-   `afterEach`: Runs after each test
-   `afterAll`: Runs once after all tests

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

## Best Practices

-   Keep setup/cleanup idempotent (safe to run even if state already set/cleared).
-   Prefer per-test setup/cleanup for isolation; use global for expensive resources.
-   Do not throw unless failure must fail suite; prefer logging.

## Migration

-   Replace `useSetup` and `useCleanup` with `useLifecycle`.
-   All options are supported in a single call.

## Troubleshooting

-   If a function throws, other functions still run; review logs for errors.
