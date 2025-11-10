# SetupHook

Runs arbitrary user-defined setup code prior to test execution. Useful for preparing external resources, seeding databases, or computing derived configuration.

## Usage

```ts
useSetup(async () => {
    await seedDatabase();
});
```

Multiple calls accumulate; executed in registration order before tests start.

## Error Handling

If any setup function throws/rejects, test bootstrapping fails early.

## Best Practices

-   Keep setup idempotent; safe to rerun if watch mode restarts.
-   Prefer dedicated hooks (e.g., `useMongoContainer`, `useConfig`) when available.
-   Avoid long-running tasks; keep under a few seconds for fast feedback.

## Example

```ts
const {useSetup, useConfig} = useNodeBoot(MyApp, ({useSetup, useConfig}) => {
    useConfig({app: {port: 3000}});
    useSetup(() => console.log("Custom pre-test setup"));
});

test("app booted", () => {
    /* ... */
});
```
