# MongoMemoryServerHook

The `MongoMemoryServerHook` provides an in-memory MongoDB instance for testing using `mongodb-memory-server`. This is a lightweight alternative to `MongoContainerHook` that doesn't require Docker, making it ideal for unit tests and CI environments.

## Important Note

**The hook only runs when explicitly configured** by calling `useMongoMemoryServer()` in the setup phase. If you don't call this function, the hook is inactive and won't affect your test lifecycle. This allows the hook to be registered globally while only activating when needed.

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

## Troubleshooting

### Binary Download Issues

If you encounter download issues, specify a mirror:

```typescript
process.env.MONGOMS_DOWNLOAD_MIRROR = "https://fastdl.mongodb.org";
```

### Port Conflicts

If you get port conflicts, let the system assign a random port (default behavior):

```typescript
const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
    useMongoMemoryServer({
        // Don't specify port - let system choose
        instance: {
            dbName: "testdb",
        },
    });
});
```

### Memory Issues

For resource-constrained environments, ensure proper cleanup:

```typescript
// The hook handles this automatically in afterTests()
```

## See Also

-   [MongoContainerHook](./MongoContainerHook.md) - Docker-based MongoDB for integration tests
-   [RepositoryHook](./RepositoryHook.md) - TypeORM repository access
-   [GenericContainerHook](./GenericContainerHook.md) - Generic container management
