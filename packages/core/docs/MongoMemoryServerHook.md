# MongoMemoryServerHook

The `MongoMemoryServerHook` provides an in-memory MongoDB instance for testing using `mongodb-memory-server`. This is a lightweight alternative to `MongoContainerHook` that doesn't require Docker, making it ideal for unit tests and CI environments.

## Important Note

**The hook only runs when explicitly configured** by calling `useMongoMemoryServer()` in the setup phase. If you don't call this function, the hook is inactive and won't affect your test lifecycle. This allows the hook to be registered globally while only activating when needed.

## Purpose

Provide a lightweight, Docker-free MongoDB instance for rapid CRUD and simple aggregation tests. Optimized for speed in CI and local development when replica set features (transactions/change streams) are not required.

## Features

-   **No Docker Required**: Runs MongoDB in-memory without containers
-   **Fast Startup**: Significantly faster than container-based solutions
-   **Automatic Configuration**: Integrates with NodeBoot's persistence layer
-   **Clean Isolation**: Each test suite gets a fresh database instance
-   **Version Control**: Specify MongoDB version for testing compatibility
-   **Opt-in Activation**: Only runs when explicitly configured

## Installation

```bash
pnpm add -D mongodb-memory-server
```

## Basic Usage

### Hook Activation

The hook **must** be explicitly activated by calling `useMongoMemoryServer()` in the setup phase:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// ✓ CORRECT: Hook is activated
describe("MongoDB Memory Server Test", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer(); // This activates the hook
    });

    it("should have MongoDB running", async () => {
        const {mongoUri} = useMongoMemoryServer();
        console.log(`MongoDB running at: ${mongoUri}`);

        // Your tests here
        assert.ok(mongoUri);
    });
});
```

### Hook Remains Inactive

If you don't call `useMongoMemoryServer()` in setup, the hook remains inactive:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// ✓ Hook is registered but NOT activated
describe("MongoDB Test Without Hook", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, () => {
        // NOT calling useMongoMemoryServer()
    });

    it("should throw error when hook not configured", () => {
        // Attempting to use will throw an error:
        // "MongoMemoryServer not started yet. Ensure test lifecycle has begun."
        assert.throws(() => useMongoMemoryServer());
    });
});
```

This design allows the hook to be globally registered while only running when needed, preventing unnecessary resource consumption.

### Setup Phase (beforeAll)

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoDB Test", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer();
    });

    it("should connect to MongoDB", async () => {
        const {mongoUri} = useMongoMemoryServer();
        console.log(`MongoDB running at: ${mongoUri}`);
    });
});
```

## Configuration Options

### Custom Database Name

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoDB with Custom DB", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "my-test-db",
            },
        });
    });

    it("should use custom database name", () => {
        const {mongoUri} = useMongoMemoryServer();
        assert.ok(mongoUri.includes("my-test-db"));
    });
});
```

### Specific Port

```typescript
describe("MongoDB on Custom Port", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                port: 27017,
            },
        });
    });
});
```

### MongoDB Version

```typescript
describe("MongoDB Specific Version", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            binary: {
                version: "6.0.0",
            },
        });
    });
});
```

### Storage Engine

```typescript
describe("MongoDB with WiredTiger", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                storageEngine: "wiredTiger",
            },
        });
    });
});
```

### Advanced Configuration

```typescript
describe("MongoDB Advanced Config", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "testdb",
                port: 27017,
                ip: "127.0.0.1",
                storageEngine: "wiredTiger",
            },
            binary: {
                version: "6.0.0",
                downloadDir: "./mongodb-binaries",
            },
        });
    });
});
```

## Complete Example with Persistence Layer

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {MyApp} from "../src/app";

describe("User Repository Integration Test", () => {
    const {useMongoMemoryServer, useRepository} = useNodeBoot(MyApp, ({useMongoMemoryServer, useConfig}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "user-service-test",
            },
        });
        useConfig({
            app: {port: 3000},
        });
    });

    it("should save and retrieve user", async () => {
        const {mongoUri} = useMongoMemoryServer();
        console.log(`Using MongoDB at: ${mongoUri}`);

        const userRepository = useRepository("UserRepository");

        // Create a user
        const user = await userRepository.save({
            name: "John Doe",
            email: "john@example.com",
        });

        // Verify
        const found = await userRepository.findOne({email: "john@example.com"});
        assert.ok(found);
        assert.strictEqual(found.name, "John Doe");
    });
});
```

## Accessing the Server Instance

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoDB Server Instance", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer();
    });

    it("should access server instance", async () => {
        const {mongoUri, server} = useMongoMemoryServer();

        // Access the underlying MongoMemoryServer instance
        const instanceInfo = await server.getInstanceInfo();
        console.log(`Instance info:`, instanceInfo);
        console.log(`Port: ${instanceInfo.port}`);
    });
});
```

## Environment Variables

The hook automatically sets the `MONGODB_URI` environment variable:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoDB Environment Variables", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer();
    });

    it("should set MONGODB_URI env var", () => {
        console.log(process.env.MONGODB_URI);
        // mongodb://127.0.0.1:xxxxx/testdb

        assert.ok(process.env.MONGODB_URI);
        assert.ok(process.env.MONGODB_URI.includes("mongodb://"));
    });
});
```

## When to Use

### Use MongoMemoryServerHook when:

-   Running unit tests that need a database
-   CI/CD environments without Docker
-   Fast iteration during development
-   Testing database operations in isolation
-   You need quick startup/teardown times

### Use MongoContainerHook when:

-   Testing with exact production MongoDB version
-   Integration tests requiring specific configurations
-   You need to test MongoDB features not available in memory server
-   Testing replication or clustering scenarios

## Integration Patterns

| Goal                   | Pattern                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| Repository integration | Use `RepositoryHook` to persist domain entities against memory DB.      |
| Fast isolated tests    | Prefer over container for speed & no external dependencies.             |
| Seeding strategy       | Seed using repositories/services in a `beforeEach` block for isolation. |

## Lifecycle

**Important: The hook only activates when `useMongoMemoryServer()` is called in the setup phase.**

```
Setup Phase (if useMongoMemoryServer() is called):
  └─ Hook state set to enabled

beforeAll (if enabled):
  ├─ Download MongoDB binary (first time only)
  ├─ Start in-memory MongoDB instance
  ├─ Configure persistence layer
  └─ Set environment variables

Test Execution:
  └─ MongoDB available via useMongoMemoryServer()

afterAll (if enabled):
  └─ Stop MongoDB instance and cleanup

If useMongoMemoryServer() is NOT called:
  └─ Hook remains inactive, no lifecycle events triggered
```

## TypeScript Types

```typescript
type MongoMemoryServerOptions = {
    dbName?: string;
    port?: number;
    storageEngine?: string;
    version?: string;
    binary?: {
        version?: string;
        downloadDir?: string;
    };
    instance?: {
        port?: number;
        ip?: string;
        dbName?: string;
        storageEngine?: string;
    };
};
```

## Return Type

```typescript
{
    mongoUri: string; // Connection string
    server: MongoMemoryServer; // Server instance
}
```

## Best Practices

1. **Binary Caching**: The MongoDB binary is downloaded once and cached. Consider setting a custom download directory in CI:

```typescript
const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
    useMongoMemoryServer({
        binary: {
            downloadDir: "./mongodb-binaries",
        },
    });
});
```

2. **Version Pinning**: Pin the MongoDB version for consistent test behavior:

```typescript
const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
    useMongoMemoryServer({
        binary: {
            version: "6.0.0",
        },
    });
});
```

3. **Cleanup**: The hook automatically stops the server after tests. No manual cleanup needed.

4. **Performance**: For test suites with many test files, consider sharing a single instance across tests rather than spinning up new instances.

## Troubleshooting Quick Reference

| Symptom                             | Cause                                      | Fix                                                |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Hook inactive                       | Not called in setup                        | Ensure `useMongoMemoryServer()` in setup callback. |
| Slow first run                      | Initial binary download                    | Cache `downloadDir` between runs.                  |
| Authentication expectations failing | Auth not supported without explicit config | Use container variant for advanced auth scenarios. |

## Performance Tips

-   Group high-Mongo test suites to amortize startup cost.
-   Prefer smaller fixture inserts; large bulk loads increase memory use.

## Edge Cases

| Scenario                           | Consideration                                                    |
| ---------------------------------- | ---------------------------------------------------------------- |
| Binary cache corruption            | Delete cached download directory and re-run.                     |
| Memory pressure in large test data | Use smaller datasets or container-based Mongo for higher limits. |
| Need transactions/change streams   | Switch to `MongoMemoryReplSetHook` or container replica set.     |
| Port already in use (explicit)     | Remove explicit port to let system choose free port.             |

## See Also

-   [MongoMemoryReplSetHook](./MongoMemoryReplSetHook.md) — Transactions & change streams.
-   [MongoContainerHook](./MongoContainerHook.md) — Real Mongo via Docker.
-   [RepositoryHook](./RepositoryHook.md) — Persistence layer access.

## Additional Usage Examples

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoMemoryServerHook - Insert & Find", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({instance: {dbName: "quick-test"}});
    });

    it("inserts a document", async () => {
        const {mongoUri} = useMongoMemoryServer();
        const {MongoClient} = await import("mongodb");
        const client = new MongoClient(mongoUri);
        await client.connect();
        const col = client.db().collection("users");
        await col.insertOne({email: "a@example.com"});
        const found = await col.findOne({email: "a@example.com"});
        assert.ok(found);
        await client.close();
    });
});
```
