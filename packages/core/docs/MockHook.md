# MockHook

Temporarily overrides methods or properties of IoC-managed service instances for tests.

## Usage (Convenience `use` API)

```ts
const {useMock} = useNodeBoot(MyApp, ({useMock}) => {
    useMock(MyService, {compute: () => 42});
});

test("mocked compute", () => {
    const svc = useService(MyService);
    expect(svc.compute()).toBe(42);
});
```

## Introspection

`useMock(MyService, { method: fn })` returns:

-   `restore()` manually restore early.
-   `getMethodMeta(name)` access `{ callCount, calls }`.
-   `allMeta` map of all spied methods.

## Alternative `call` API

Allows plain patch without meta tracking.

```ts
useMock(MyService, {other: () => "x"});
```

## Lifecycle

-   beforeTests: applies all mocks.
-   afterTests: restores originals.

## Best Practices

-   Only mock what test needs; avoid broad replacement.
-   Use returned meta to assert invocation counts instead of separate spies.
-   Keep mock functions pure for repeatability.

## Troubleshooting

Error `Service instance ... not found` indicates service not registered or server not booted.
