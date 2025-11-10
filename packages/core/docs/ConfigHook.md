# ConfigHook

Augments and accesses application configuration before NodeBoot starts. Allows merging test-specific overrides.

## Registration

```ts
useConfig({app: {port: 3100}, featureFlags: {beta: true}});
useConfig({logging: {level: "debug"}}); // merges into previous
```

Registered objects merge (shallow) into initial test config provided by framework.

## Accessing Config

```ts
const config = useConfig();
expect(config.app.port).toBe(3100);
```

## Lifecycle

-   beforeStart: merges all queued configs into testConfig and stores output.
-   use(): fetches `ConfigService` from IoC container; throws if app not bootstrapped.

## API

-   `useConfig(partial: JsonObject)` to register.
-   `useConfig(): Config` to retrieve (inside tests after boot).

## Best Practices

-   Keep overrides minimal and focused on test scenario.
-   Avoid deep mutation; prefer providing complete objects for keys you change.

## Troubleshooting

Error `No Config found in the IOC container` indicates server not started or misordered setup.
