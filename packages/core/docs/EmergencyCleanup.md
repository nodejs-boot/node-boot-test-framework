# Emergency Cleanup & Unhandled Errors

When using the `@nodeboot/node-test` adapter, the framework installs global listeners for `uncaughtException` and `unhandledRejection`.

If an unhandled error occurs:

1. `afterEach` hooks run if a test was active.
2. `afterAll` hooks run if not yet executed.
3. A metric `unhandledError` is recorded (if `MetricsHook` is present) with `{ name, message }`.
4. A structured cleanup log is produced internally (`cleanupLog`).
5. The process exits with code `1` unless any framework instance was created with `{ disableForcedExit: true }`.

## Disabling Forced Exit

```ts
const {useMetrics} = useNodeBoot(MyApp, setupCb, new HooksLibrary(), {disableForcedExit: true});
```

This allows the process to remain alive for debugging lingering handles/resources. You will see a console message indicating the error was captured but forced exit disabled.

## Inspecting Captured Errors

```ts
const {useMetrics} = useNodeBoot(MyApp);
const {getMetrics} = useMetrics();
const unhandled = getMetrics("unhandledError");
console.log(unhandled);
```

## Test Strategy for Emergency Cleanup

You can simulate an unhandled rejection inside a test by scheduling a failing promise:

```ts
setTimeout(() => {
    Promise.reject(new Error("background failure"));
}, 10);
```

With `disableForcedExit: true` you can assert metrics afterward to ensure the emergency path executed.

## Cleanup Log Entries

Possible entries in the internal cleanup log:

-   `hooks.afterEachTest.emergency`
-   `hooks.afterTests`
-   `server.close`
-   `ioc.reset`
-   `typeorm.destroy`

## Notes

-   Ensure MetricsHook is included (it is by default in HooksLibrary) to capture the `unhandledError` metric.
-   The emergency cleanup is idempotent and will not run twice for multiple cascading errors.
-   For multiple framework instances, all will receive emergency cleanup calls.
