# GenericContainerHook

Starts arbitrary Docker containers using Testcontainers based on declarative configuration. See `useGenericContainer.md` for extended guide; this file summarizes core hook behavior.

## Registration

```ts
useGenericContainer({
    containers: {
        redis: {image: "redis:7-alpine", exposedPorts: [6379]},
        postgres: {image: "postgres:15-alpine", exposedPorts: [5432], environment: {POSTGRES_PASSWORD: "pw"}},
    },
});
```

## Access

```ts
const redis = useGenericContainer("redis");
const port = redis.getPort(6379);
```

## ContainerOptions

Key fields: `image`, `exposedPorts`, `environment`, `command`, `privilegedMode`, `labels`, `reuse`, `platform`, `waitForLog`.

## Lifecycle

-   beforeStart: starts all configured containers (auto runtime detection).
-   afterTests: stops them.

## API

-   `useGenericContainer(options)` to configure.
-   `useGenericContainer(name)` to get `ContainerInfo` with `{ container, host, ports, getPort }`.
-   `useGenericContainer.useAll()` returns Map of all.

## Logging

Enable `containerLogging: true` to funnel container logs to framework logger.

## See Also

-   Detailed cookbook: `useGenericContainer.md`.
-   Raw factory approach: `GenericContainerRawHook.md` / `useGenericContainerRaw.md`.
