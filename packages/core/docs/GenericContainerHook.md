# GenericContainerHook

Starts arbitrary Docker containers using Testcontainers based on declarative configuration. See `useGenericContainer.md` for extended guide; this file summarizes core hook behavior.

## Purpose

Start arbitrary Docker containers via declarative configuration for integration tests that require real external dependencies (databases, caches, message brokers). Provides simple setup and automatic lifecycle management.

## Features

-   Declarative multi-container configuration
-   Automatic port mapping and host access
-   Environment variables, commands, labels, platform, reuse
-   Optional log forwarding to framework logger
-   Automatic start before tests and stop after tests

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

## Configuration Examples

```typescript
useGenericContainer({
    containerLogging: true, // forward container logs
    containers: {
        mysql: {
            image: "mysql:8",
            exposedPorts: [3306],
            environment: {
                MYSQL_ROOT_PASSWORD: "root",
                MYSQL_DATABASE: "testdb",
            },
            labels: {"test.suite": "integration"},
            reuse: false,
            platform: "linux/amd64",
            waitForLog: "ready for connections",
        },
    },
});
```

## Advanced Usage

-   **Seeding Data**: Connect using host/port from `getPort` then seed with client libraries.
-   **Custom Commands**: Provide `command` for images requiring non-default process start.
-   **Selective Reuse**: Use `reuse: true` for faster local runs (be mindful of cross-test state).
-   **Platform Pinning**: Specify `platform` on arm64/mac or CI runners if needed.

```typescript
it("seeds redis", async () => {
    const redis = useGenericContainer("redis");
    const host = redis.host;
    const port = redis.getPort(6379);
    const {createClient} = await import("redis");
    const client = createClient({url: `redis://${host}:${port}`});
    await client.connect();
    await client.set("k", "v");
    const v = await client.get("k");
    assert.strictEqual(v, "v");
    await client.disconnect();
});
```

## Integration Patterns

| Hook                  | Pattern                                                        |
| --------------------- | -------------------------------------------------------------- |
| RepositoryHook        | Run integration tests against real DB containers.              |
| PerformanceBudgetHook | Measure container startup or query latency.                    |
| MetricsHook           | Record operation counts & timings interacting with containers. |
| EmergencyCleanup      | Ensure containers stopped on unexpected failures.              |

## API Reference

### Registration

```typescript
// Illustrative shape
useGenericContainer({
    containerLogging: true,
    containers: {
        myservice: {
            image: "repo/image:tag",
            exposedPorts: [1234],
            environment: {KEY: "VALUE"},
            command: ["cmd", "--arg"],
            privilegedMode: false,
            labels: {key: "value"},
            reuse: false,
            platform: "linux/amd64",
            waitForLog: "ready",
        },
    },
});
```

### Retrieval

```typescript
const info = useGenericContainer("redis");
// info: { container, host, ports: Map<number, number>, getPort(original: number): number }
```

### All Containers

```typescript
const all = useGenericContainer.useAll(); // Map<string, ContainerInfo>
```

## Lifecycle

-   **beforeStart**: starts all configured containers (auto runtime detection)
-   **afterTests**: stops containers

## Best Practices

-   **Pin Versions**: Avoid `latest`; use explicit tags for reproducibility
-   **Minimal Exposure**: Expose only required ports
-   **Log Forwarding**: Enable `containerLogging` when debugging startup issues
-   **Avoid Reuse in CI**: Prefer clean state per run for reliability

## Troubleshooting

| Symptom                  | Cause                         | Resolution                                             |
| ------------------------ | ----------------------------- | ------------------------------------------------------ |
| Container fails to start | Image pull issue / bad config | Verify image, env vars; enable logging; pre-pull in CI |
| Port undefined           | Port not in `exposedPorts`    | Add port to configuration                              |
| Connection refused       | Container not ready           | Add `waitForLog` or retry/backoff                      |
| Huge logs                | `containerLogging` on         | Disable in stable suites                               |

## Edge Cases

-   **Docker missing**: Hook will fail early; fall back to memory or skip
-   **Platform mismatch**: Pin `platform` for arm64/mac vs amd64 images
-   **State leakage**: `reuse: true` can leak state across tests—disable for strict isolation
-   **Network policies**: Custom networks require raw variant configuration

## See Also

-   Detailed cookbook: `useGenericContainer.md`.
-   Raw factory approach: `GenericContainerRawHook.md` / `useGenericContainerRaw.md`.
