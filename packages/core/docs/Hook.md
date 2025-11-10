# Hook (Base Class)

Abstract foundation for all lifecycle hooks. Provides priority ordering, state storage, and overridable lifecycle methods.

## Responsibilities

-   Defines lifecycle extension points: `beforeStart`, `afterStart`, `beforeTests`, `beforeEachTest`, `afterEachTest`, `afterTests`.
-   Provides `setState(key, value)` and `getState<T>(key)` for sharing data across lifecycle phases.
-   Priority ordering: lower numeric priority runs earlier on ascending phase order (and reverse for tear-down where applicable).

## Implementing a Custom Hook

```ts
class MyHook extends Hook {
    constructor() {
        super(10);
    }
    override beforeTests() {
        /* setup */
    }
    override afterTests() {
        /* cleanup */
    }
    use() {
        return {
            /* public API */
        };
    }
}
```

## Priority Semantics

-   Construction assigns a number; framework sorts hooks.
-   Example: `LogCaptureHook` uses `-5` to patch logger very early.

## State Usage Example

```ts
this.setState("resource", connection);
const conn = this.getState<MyConn>("resource");
```

## Guidelines for Custom Hooks

-   Keep side effects explicit and reversible.
-   Always restore patched globals (loggers, timers) in `afterTests`.
-   Provide a `use()` method for test-time interaction when appropriate.

## Error Handling

Throwing in lifecycle methods fails setup or test phase; log warnings for non-critical issues to avoid cascading failures.

# AddressHook

Provides the application base URL (e.g., `http://localhost:PORT`) after the NodeBoot server starts.

## Usage

```ts
const {useAddress} = useNodeBoot(MyApp, ({useAddress}) => {
    useAddress(addr => console.log("Server at", addr));
});

test("address available", () => {
    // Use consumer above or capture inside callback
});
```

## Behavior

-   afterStart: computes address from `bootApp.appOptions.port` and stores it.
-   beforeTests: invokes registered consumer callbacks with address.

## API

`useAddress((address: string) => void)` — registers a consumer.

## When To Use

-   Integrating external HTTP clients needing server base URL.
-   Configuring tools that require address before tests start.

## Notes

For HTTP calls consider `HttpClientHook` or `SupertestHook` for richer clients.
