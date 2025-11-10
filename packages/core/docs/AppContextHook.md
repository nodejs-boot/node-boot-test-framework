# AppContextHook

Exposes the full `NodeBootAppView` (minus raw server) to tests for advanced introspection or custom instrumentation.

## Usage

```ts
const {useAppContext} = useNodeBoot(MyApp, ({useAppContext}) => {
    useAppContext(ctx => console.log("App started with port", ctx.appOptions.port));
});
```

## Behavior

-   afterStart: stores the application context.
-   beforeTests: runs all registered consumer callbacks.

## API

`useAppContext((context: Omit<NodeBootAppView,'server'>) => void)` — registers a consumer.

## Scenarios

-   Reading configuration resolved at boot.
-   Accessing logger instance for custom log routing.
-   Inspecting IoC container contents.

## Best Practices

Prefer dedicated hooks (e.g., `useConfig`, `useService`) for targeted operations; use context only when necessary.
