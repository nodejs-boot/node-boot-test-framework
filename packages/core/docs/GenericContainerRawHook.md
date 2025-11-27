# GenericContainerRawHook

Factory-based variant of `GenericContainerHook` allowing full Testcontainers API surface (build images, custom pull policies, BuildKit, etc.). Complement to the extended documentation in `useGenericContainerRaw.md`.

## Purpose

Provides _factory-level_ access to Testcontainers allowing custom build steps, conditional logic, and fine-grained container configuration beyond the declarative `GenericContainerHook` abstraction.

## Features

-   Full Testcontainers API (build from Dockerfile, BuildKit, custom wait strategies).
-   Lazy factory evaluation in setup phase.
-   Multiple heterogeneous container definitions.
-   Access to raw container instance for exec / logs / inspect.
-   Shared helper retrieval via `useGenericContainerRaw(name)`.

## Setup / Registration

Call in the `useNodeBoot` setup callback.

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {GenericContainer} from "testcontainers";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("GenericContainerRawHook - Basic", () => {
    const {useGenericContainerRaw} = useNodeBoot(EmptyApp, ({useGenericContainerRaw}) => {
        useGenericContainerRaw({
            containers: {
                redis: () => new GenericContainer("redis:7-alpine").withExposedPorts(6379),
            },
        });
    });

    it("starts redis", () => {
        const info = useGenericContainerRaw("redis");
        assert.ok(info.getPort(6379));
    });
});
```

## Factory Configuration Examples

```typescript
useGenericContainerRaw({
    containers: {
        // Build from local Dockerfile
        app: () => GenericContainer.fromDockerfile("./docker/app").build().withExposedPorts(8080),
        // Custom wait strategy (log message)
        mongo: () =>
            new GenericContainer("mongo:7")
                .withEnv("MONGO_INITDB_ROOT_USERNAME", "root")
                .withEnv("MONGO_INITDB_ROOT_PASSWORD", "pass")
                .withExposedPorts(27017)
                .withWaitStrategy({
                    // pseudo interface – ensure actual Wait.forLog usage in codebase
                    // shown here conceptually
                }),
    },
});
```

## Accessing Container Info

```typescript
const mongoInfo = useGenericContainerRaw("mongo");
console.log(mongoInfo.host, mongoInfo.getPort(27017));
// raw instance
await mongoInfo.container.exec(["bash", "-c", "echo healthy"]);
```

## Advanced Usage

-   **Conditional Factories**: Provide a factory that branches on env flags.
-   **Dynamic Tags**: Read process.env to choose image version.
-   **Exec for Seeding**: Use `container.exec` to seed DB after startup.
-   **Parallel Containers**: Start multiple service dependencies (e.g., Redis + Postgres + LocalStack).

## Integration Patterns

| Goal                    | Pattern                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Performance measurement | Pair with `PerformanceBudgetHook` to time container startup labels.               |
| DB integration tests    | Combine with `RepositoryHook` to hit real database behavior.                      |
| Cleanup assurance       | Verify emergency cleanup stops containers using `EmergencyCleanup` docs guidance. |

## API Reference

### Registration

```typescript
// Type shape (illustrative)
useGenericContainerRaw({
  containers: {
    [name: string]: () => PromiseLike<StartedTestContainer> | StartedTestContainer | GenericContainer;
  },
  containerLogging?: boolean; // forwards logs to framework logger
});
```

### Retrieval

```typescript
// Retrieval usage example
const info = useGenericContainerRaw("mongo");
// info has shape:
// {
//   container: StartedTestContainer;
//   host: string;
//   ports: Map<number, number>;
//   getPort(original: number): number;
// }
```

### All Containers

```typescript
const map = useGenericContainerRaw.useAll(); // Map<string, ContainerInfo>
```

## Best Practices

-   **Name Uniqueness**: Use descriptive keys (`authDb`, `cache`, `search`) to avoid collisions.
-   **Log Forwarding**: Enable `containerLogging` when debugging startup issues.
-   **Explicit Ports**: Declare only needed exposed ports to reduce resource usage.
-   **Reuse Strategy**: Consider image tag reuse; avoid `latest` for determinism.

## Troubleshooting

| Issue                   | Cause                   | Remedy                                     |
| ----------------------- | ----------------------- | ------------------------------------------ |
| Image pull slow         | Network or large image  | Pre-pull in CI or use slimmer base image.  |
| Port undefined          | Not exposed             | Add port to `withExposedPorts(...)`.       |
| Exec fails              | Container not ready yet | Add wait strategy or log wait.             |
| Multiple start attempts | Duplicate factory names | Ensure unique keys in `containers` object. |

## Edge Cases

-   **Ephemeral Ports**: Random mapped ports may change each run; avoid hardcoding.
-   **Build Failures**: Dockerfile errors surface as factory rejection; wrap with try/catch if you need fallback.
-   **Container Logging Flood**: High volume logs can slow tests; disable `containerLogging` in stable suites.
-   **Platform Mismatch**: M1/mac vs linux/amd64 images—specify platform if needed.

## Comparison

| Raw                           | Declarative                       |
| ----------------------------- | --------------------------------- |
| Full API access (build, exec) | Simpler config object             |
| Manual factory logic          | Automatic uniform container start |
| More verbose                  | More concise                      |

## Summary

Use GenericContainerRawHook when you need unrestricted Testcontainers flexibility; prefer GenericContainerHook for straightforward dependency declarations.
