# SpyHook

Attaches a spy to a method of a service instance (IoC-managed) recording calls, results, errors, and supports async method tracking.

## Usage

```ts
const spy = useSpy(UserService, "findAllUser");
await userService.findAllUser();
expect(spy.callCount).toBe(1);
expect(spy.calls[0]).toEqual([]);
```

## Returned Object

-   `callCount`: number of invocations
-   `calls`: argument arrays per call
-   `results`: return values (resolved values for promises)
-   `errors`: captured thrown/rejected errors
-   `restore()`: revert method to original implementation
-   `original`: original function reference

## Lifecycle

All active spies automatically restored after tests.

## Best Practices

-   Use for behavior assertions without changing functionality.
-   Avoid spying on frequently called hot paths unless needed (can add overhead).

## Troubleshooting

Error `method is not a function` — ensure method name correct and decorated service resolved.
