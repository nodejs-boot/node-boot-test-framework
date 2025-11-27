# MongoContainerHook

Launches a real MongoDB container and wires persistence config automatically. See `useMongoContainer.md` for extensive examples.

## Purpose

Starts a real MongoDB instance in a Docker container for integration tests requiring authentic engine features (journaling, storage internals, production-like performance characteristics) beyond what in-memory servers provide.

## Features

-   Real MongoDB engine via Docker image.
-   Automatic persistence configuration & `MONGODB_URI` env wiring.
-   Optional authentication & custom database name.
-   Configurable image, port, credentials, environment variables.
-   Automatic lifecycle (start before tests, stop after tests).

## Quick Start

```ts
useMongoContainer();

test("uri available", () => {
    const {mongoUri} = useMongoContainer();
    expect(mongoUri).toMatch(/^mongodb:\/\//);
});
```

## Setup / Activation

Register in the `useNodeBoot` setup callback.

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoContainerHook - Basic", () => {
    const {useMongoContainer} = useNodeBoot(EmptyApp, ({useMongoContainer}) => {
        useMongoContainer(); // default image & config
    });

    it("provides mongoUri", () => {
        const {mongoUri} = useMongoContainer();
        assert.ok(mongoUri.startsWith("mongodb://"));
    });
});
```

## Options

```ts
useMongoContainer({
    image: "mongo:7",
    dbName: "mydb",
    username: "user",
    password: "pass",
    port: 27017,
    env: {MONGO_INITDB_DATABASE: "mydb"},
});
```

## Configuration Examples

```typescript
useMongoContainer({
    image: "mongo:7", // MongoDB version
    dbName: "mydb", // custom database name
    username: "user", // enable auth
    password: "pass", // password
    port: 27017, // container internal port (host mapped automatically)
    env: {MONGO_INITDB_DATABASE: "mydb"},
});
```

### With Authentication

```typescript
useMongoContainer({
    image: "mongo:7",
    dbName: "securedb",
    username: "admin",
    password: "secret123",
});
```

### Custom Port Mapping

If `port` omitted framework chooses default internal; host port random unless explicitly configured elsewhere.

### Initialization Script (via env)

```typescript
useMongoContainer({
    image: "mongo:7",
    env: {
        MONGO_INITDB_ROOT_USERNAME: "root",
        MONGO_INITDB_ROOT_PASSWORD: "rootpw",
        MONGO_INITDB_DATABASE: "initdb",
    },
});
```

## Provided Persistence Config

Automatically sets `persistence.type = 'mongodb'` and connection details.

## Advanced Usage

-   **Replica / Sharding Tests**: Prefer GenericContainerRawHook + custom factories for multi-node topologies.
-   **Performance Timing**: Pair with `PerformanceBudgetHook` to label startup duration.
-   **Seeding Data**: After retrieval, exec inside container or use your ORM/repository layer to seed inline within tests.

```typescript
it("seeds collection", async () => {
    const {mongoUri} = useMongoContainer();
    const client = await import("mongodb").then(m => new m.MongoClient(mongoUri));
    await client.connect();
    const col = client.db().collection("items");
    await col.insertOne({name: "widget"});
    const found = await col.findOne({name: "widget"});
    assert.ok(found);
    await client.close();
});
```

## Integration Patterns

| Hook                  | Pattern                                        |
| --------------------- | ---------------------------------------------- |
| RepositoryHook        | Run real persistence CRUD tests against Mongo. |
| PerformanceBudgetHook | Enforce query latency budgets.                 |
| MetricsHook           | Record startup timings & operation counts.     |

## API Reference

### Registration

```typescript
useMongoContainer(options?: {
  image?: string;
  dbName?: string;
  username?: string;
  password?: string;
  port?: number; // internal container port
  env?: Record<string,string>; // extra environment variables
});
```

### Retrieval

```typescript
const {mongoUri, container} = useMongoContainer();
// container: underlying StartedTestContainer instance (Testcontainers)
```

## Lifecycle

| Phase       | Action                                                           |
| ----------- | ---------------------------------------------------------------- |
| beforeStart | Pull image (if needed) & start container, set env `MONGODB_URI`. |
| afterTests  | Stop container & release resources.                              |

## Best Practices

-   **Pin Versions**: Use explicit image tags (e.g., `mongo:7.0.4`) for reproducibility.
-   **Ephemeral Tests**: Keep test data inline; rely on auto teardown for cleanup.
-   **Avoid Global State**: Reconfigure per suite rather than reusing external container state.
-   **Security**: Use simple credentials—never real secrets; CI ephemeral only.

## Troubleshooting

| Symptom            | Cause                              | Resolution                                             |
| ------------------ | ---------------------------------- | ------------------------------------------------------ |
| Startup timeout    | Docker daemon slow / image large   | Pre-pull image in CI, ensure Docker resources.         |
| Auth failures      | Wrong username/password            | Match `MONGO_INITDB_ROOT_*` env if root auth needed.   |
| Connection refused | Container not ready yet            | Add small retry/backoff or wait for log.               |
| Port collision     | Host port mapped to an in-use port | Use dynamic mapping (default) or change internal port. |

## Edge Cases

-   **Docker Not Installed**: Hook fails early—fallback to MongoMemoryServerHook.
-   **Resource Limits**: Low memory can cause Mongo to terminate—check container logs.
-   **Network Isolation**: Custom Docker network not configured—use GenericContainerRawHook for network scenarios.
-   **Replica Requirements**: Transactions requiring replica sets—use MongoMemoryReplSetHook or custom multi-container setup.

## Comparison

| MongoMemoryServerHook   | MongoContainerHook    |
| ----------------------- | --------------------- |
| In-memory, very fast    | Real engine behavior  |
| Limited feature surface | Full feature fidelity |
| No Docker required      | Requires Docker       |

## Summary

MongoContainerHook offers production-like MongoDB behavior for integration tests needing real engine semantics; use memory hooks for speed, replica set hook for advanced transaction/change stream scenarios.
