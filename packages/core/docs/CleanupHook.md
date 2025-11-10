# CleanupHook

Provides lifecycle-bound cleanup utilities for tests. Register functions to run after each test or once after all tests complete. Useful for tearing down resources, clearing mocks, deleting temp files, closing DB connections, etc.

## When It Runs

-   afterEachTest: Executes per-test cleanup functions registered with `afterEach`.
-   afterTests: Executes global cleanup functions registered with `afterAll`.

## Registering Cleanup Functions

```ts
useCleanup({
    afterEach: () => {
        /* per-test cleanup */
    },
});

useCleanup({
    afterAll: () => {
        /* global cleanup */
    },
});
```

You can call `useCleanup` multiple times; functions accumulate.

## API

`useCleanup(options: { afterEach?: () => void; afterAll?: () => void })`

-   `afterEach`: Runs after every test.
-   `afterAll`: Runs once after entire test suite.

## Example

```ts
describe("temp files", () => {
    const {useFileSystemSandbox, useCleanup} = useNodeBoot(MyApp, ({useFileSystemSandbox, useCleanup}) => {
        useFileSystemSandbox();
        useCleanup({afterEach: () => console.log("Test cleaned")});
        useCleanup({afterAll: () => console.log("Suite cleaned")});
    });

    test("writes file", () => {
        const sandbox = useFileSystemSandbox();
        sandbox.writeText("a.txt", "hello");
    });
});
```

## Best Practices

-   Keep cleanup idempotent (safe to run even if state already cleared).
-   Do not throw unless failure must fail suite; prefer logging.
-   Prefer per-test cleanup for isolation; use afterAll for expensive global resources.

## Troubleshooting

-   If a cleanup throws, other functions still run; review logs for errors.
