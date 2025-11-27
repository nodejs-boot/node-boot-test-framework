# MongoMemoryReplSetHook

The `MongoMemoryReplSetHook` provides an in-memory MongoDB Replica Set for testing using `mongodb-memory-server`. This enables testing of replica set features like transactions, change streams, and replication without requiring Docker.

## Important Note

**The hook only runs when explicitly configured** by calling `useMongoMemoryReplSet()` in the setup phase. If you don't call this function, the hook is inactive and won't affect your test lifecycle. This allows the hook to be registered globally while only activating when needed.

## Features

-   **No Docker Required**: Runs MongoDB Replica Set in-memory without containers
-   **Fast Startup**: Significantly faster than container-based solutions
-   **Multi-Node Support**: Configure multiple replica set members
-   **Transaction Support**: Test MongoDB transactions with proper replica set configuration
-   **Change Streams**: Test change stream functionality
-   **Automatic Configuration**: Integrates with NodeBoot's persistence layer
-   **Clean Isolation**: Each test suite gets a fresh replica set instance
-   **Opt-in Activation**: Only runs when explicitly configured

## Installation

```bash
pnpm add -D mongodb-memory-server
```

## Basic Usage

### Hook Activation

The hook **must** be explicitly activated by calling `useMongoMemoryReplSet()` in the setup phase:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoDB Replica Set Test", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet(); // This activates and configures the hook
    });

    it("should have MongoDB Replica Set running", async () => {
        const {mongoUri, servers} = useMongoMemoryReplSet();
        console.log(`MongoDB Replica Set at: ${mongoUri}`);
        console.log(`Number of members: ${servers.length}`);

        assert.ok(mongoUri);
        assert.ok(servers.length >= 1);
    });
});
```

### Hook Remains Inactive

If you don't call `useMongoMemoryReplSet()` in setup, the hook remains inactive:

```typescript
describe("MongoDB Test Without Replica Set", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, () => {
        // NOT calling useMongoMemoryReplSet()
    });

    it("should throw error when hook not configured", () => {
        // Attempting to use will throw an error
        assert.throws(() => useMongoMemoryReplSet());
    });
});
```

## Configuration Options

### Custom Replica Set Name

```typescript
describe("Custom Replica Set Name", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                name: "my-replset",
            },
        });
    });
});
```

### Multiple Replica Set Members

```typescript
describe("Three-Member Replica Set", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                count: 3, // Total of 3 members
                dbName: "testdb",
            },
        });
    });

    it("should have 3 members", () => {
        const {servers} = useMongoMemoryReplSet();
        assert.ok(servers.length >= 3);
    });
});
```

### Custom Database Name

```typescript
describe("Custom Database", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "my-test-db",
            },
        });
    });
});
```

### MongoDB Version

```typescript
describe("Specific MongoDB Version", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            binary: {
                version: "6.0.0",
            },
            replSet: {
                dbName: "testdb",
            },
        });
    });
});
```

### Storage Engine

```typescript
describe("WiredTiger Storage", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                storageEngine: "wiredTiger",
            },
        });
    });
});
```

### Instance-Specific Configuration

```typescript
describe("Custom Instance Configuration", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            instanceOpts: [
                {
                    port: 27017,
                    storageEngine: "wiredTiger",
                },
                {
                    port: 27018,
                    storageEngine: "wiredTiger",
                },
                {
                    port: 27019,
                    storageEngine: "wiredTiger",
                },
            ],
            replSet: {
                dbName: "testdb",
            },
        });
    });
});
```

### Replica Set Configuration Settings

```typescript
describe("Replica Set Config Settings", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                configSettings: {
                    chainingAllowed: true,
                    heartbeatTimeoutSecs: 30,
                    heartbeatIntervalMillis: 2000,
                    electionTimeoutMillis: 10000,
                    catchUpTimeoutMillis: 60000,
                },
            },
        });
    });
});
```

### Authentication

```typescript
describe("Replica Set with Auth", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "secure-db",
                auth: {
                    enable: true,
                    customRootName: "admin",
                    customRootPwd: "password123",
                },
            },
        });
    });
});
```

### Advanced Configuration

```typescript
describe("Advanced Replica Set", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            binary: {
                version: "6.0.0",
                downloadDir: "./mongodb-binaries",
            },
            replSet: {
                name: "production-replset",
                dbName: "testdb",
                count: 5,
                ip: "127.0.0.1",
                storageEngine: "wiredTiger",
                configSettings: {
                    chainingAllowed: true,
                    heartbeatTimeoutSecs: 30,
                    electionTimeoutMillis: 10000,
                },
                auth: {
                    enable: true,
                    customRootName: "admin",
                    customRootPwd: "password123",
                },
            },
        });
    });
});
```

## Testing Transactions

Replica sets are required for MongoDB transactions:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {MyApp} from "../src/app";

describe("Transaction Test", () => {
    const {useMongoMemoryReplSet, useRepository} = useNodeBoot(MyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                count: 3, // Multiple members for better transaction support
                dbName: "transaction-test",
            },
        });
    });

    it("should support transactions", async () => {
        const {mongoUri} = useMongoMemoryReplSet();
        const userRepository = useRepository("UserRepository");

        // Start a transaction
        const session = await userRepository.manager.connection.startSession();
        session.startTransaction();

        try {
            await userRepository.save({name: "User 1"}, {session});
            await userRepository.save({name: "User 2"}, {session});

            await session.commitTransaction();
            assert.ok(true, "Transaction committed successfully");
        } catch (error) {
            await session.abortTransaction();
            assert.fail("Transaction should not fail");
        } finally {
            session.endSession();
        }
    });
});
```

## Accessing Replica Set Information

```typescript
describe("Replica Set Info", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                count: 3,
            },
        });
    });

    it("should access replica set details", async () => {
        const {mongoUri, replSet, servers} = useMongoMemoryReplSet();

        console.log(`Connection URI: ${mongoUri}`);
        console.log(`Number of servers: ${servers.length}`);

        // Access individual server info
        for (let i = 0; i < servers.length; i++) {
            const instanceInfo = await servers[i].getInstanceInfo();
            console.log(`Server ${i}: ${instanceInfo.ip}:${instanceInfo.port}`);
        }
    });
});
```

## Environment Variables

The hook automatically sets the `MONGODB_URI` environment variable:

```typescript
describe("Environment Variables", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet();
    });

    it("should set MONGODB_URI env var", () => {
        console.log(process.env.MONGODB_URI);
        // mongodb://127.0.0.1:xxxxx,127.0.0.1:xxxxx/?replicaSet=testset

        assert.ok(process.env.MONGODB_URI);
        assert.ok(process.env.MONGODB_URI.includes("replicaSet="));
    });
});
```

## When to Use

### Use MongoMemoryReplSetHook when:

-   Testing MongoDB transactions
-   Testing change streams
-   Testing replica set failover scenarios
-   Testing read preferences and write concerns
-   Integration tests requiring replica set features
-   No Docker available in test environment

### Use MongoContainerHook when:

-   Testing exact production MongoDB configuration
-   Need persistent data between test runs
-   Testing MongoDB features not available in memory server
-   Testing network partitioning or specific container scenarios

## Lifecycle

**Important: The hook only activates when `useMongoMemoryReplSet()` is called in the setup phase.**

```
Setup Phase (if useMongoMemoryReplSet() is called):
  └─ Hook state set to enabled

beforeAll (if enabled):
  ├─ Download MongoDB binary (first time only, cached)
  ├─ Start multiple MongoDB instances
  ├─ Initialize replica set configuration
  ├─ Wait for replica set to be ready
  ├─ Configure persistence layer
  └─ Set environment variables

Test Execution:
  └─ Replica Set available via useMongoMemoryReplSet()

afterAll (if enabled):
  └─ Stop all replica set instances and cleanup

If useMongoMemoryReplSet() is NOT called:
  └─ Hook remains inactive, no lifecycle events triggered
```

## TypeScript Types

```typescript
export type MongoMemoryReplSetOpts = {
    binary?: {
        version?: string;
        downloadDir?: string;
        platform?: string;
        arch?: string;
        checkMD5?: boolean;
        systemBinary?: string;
    };
    instanceOpts?: Array<{
        args?: string[];
        port?: number;
        dbPath?: string;
        storageEngine?: string;
    }>;
    replSet?: {
        name?: string;
        auth?: boolean | AutomaticAuth;
        args?: string[];
        count?: number;
        dbName?: string;
        ip?: string;
        spawn?: Record<string, any>;
        storageEngine?: string;
        configSettings?: {
            chainingAllowed?: boolean;
            heartbeatTimeoutSecs?: number;
            heartbeatIntervalMillis?: number;
            electionTimeoutMillis?: number;
            catchUpTimeoutMillis?: number;
        };
    };
};
```

## Return Type

```typescript
// Replica set hook return shape (illustrative)
interface MongoMemoryReplSetHookReturn {
    mongoUri: string; // Connection string with replica set
    replSet: MongoMemoryReplSet; // Replica Set instance
    servers: MongoMemoryServer[]; // Array of individual server instances
}
```

## Best Practices

1. **Member Count**: Use at least 3 members for production-like testing:

```typescript
useMongoMemoryReplSet({
    replSet: {
        count: 3,
    },
});
```

2. **Binary Caching**: Set custom download directory in CI:

```typescript
useMongoMemoryReplSet({
    binary: {
        downloadDir: "./mongodb-binaries",
    },
});
```

3. **Version Pinning**: Pin MongoDB version for consistent behavior:

```typescript
useMongoMemoryReplSet({
    binary: {
        version: "6.0.0",
    },
});
```

4. **Cleanup**: The hook automatically stops all instances after tests.

5. **Startup Time**: Replica sets take longer to start than single instances. Plan test timeouts accordingly.

## Troubleshooting

### Slow Startup

Replica sets require initialization time. This is normal:

```typescript
// Expect 3-10 seconds for replica set initialization
```

### Port Conflicts

Let the system assign random ports (default behavior):

```typescript
useMongoMemoryReplSet({
    // Don't specify ports - let system choose
    replSet: {
        count: 3,
    },
});
```

### Transaction Errors

Ensure you have multiple members:

```typescript
useMongoMemoryReplSet({
    replSet: {
        count: 3, // Minimum recommended for transactions
    },
});
```

## Extended Purpose

Enable testing of advanced MongoDB semantics (multi-document transactions, change streams, leader election behavior, write concerns) without Docker by emulating a multi-member replica set entirely in memory.

## Additional Usage Examples

### Change Stream Test

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoMemoryReplSetHook - Change Stream", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({replSet: {count: 3, dbName: "cs-test"}});
    });

    it("captures inserted document via change stream", async () => {
        const {mongoUri} = useMongoMemoryReplSet();
        const {MongoClient} = await import("mongodb");
        const client = new MongoClient(mongoUri);
        await client.connect();
        const col = client.db().collection("items");

        const changes: any[] = [];
        const stream = col.watch();
        stream.on("change", ev => changes.push(ev));

        await col.insertOne({name: "alpha"});
        await new Promise(r => setTimeout(r, 50));
        assert.ok(changes.length >= 1);
        stream.close();
        await client.close();
    });
});
```

### Transaction Rollback Example

```typescript
it("rolls back on error", async () => {
    const {mongoUri} = useMongoMemoryReplSet();
    const {MongoClient} = await import("mongodb");
    const client = new MongoClient(mongoUri);
    await client.connect();
    const session = client.startSession();
    const col = client.db().collection("tx");
    session.startTransaction();
    try {
        await col.insertOne({k: 1}, {session});
        throw new Error("abort");
    } catch {
        await session.abortTransaction();
    } finally {
        await session.endSession();
    }
    const count = await col.countDocuments();
    assert.strictEqual(count, 0);
    await client.close();
});
```

## Advanced Usage

-   **Failover Simulation**: Manually stop one server (`servers[i].stop()`) then issue operations to observe election delay.
-   **Custom Member Configuration**: Use `instanceOpts` to assign ports/storage engines per member.
-   **Election Timing**: Adjust `configSettings.electionTimeoutMillis` to test resilience of your retry logic.

## Integration Patterns

| Need                | Pattern                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| Transaction tests   | Use 3+ members; start session + transactions on repositories.                  |
| Change streams      | Start stream before writes; small delay for event emission.                    |
| Failover handling   | Stop a member during operation; observe re-election & retry.                   |
| Performance metrics | Combine with `PerformanceBudgetHook` labeling startup & transaction durations. |

## Edge Cases

| Scenario              | Consideration                                        |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Slow election         | High `electionTimeoutMillis` or insufficient members | Reduce timeout or increase `count`.                   |
| Port conflicts        | Explicit port collisions in `instanceOpts`           | Remove explicit ports to auto-assign.                 |
| Auth misconfiguration | Partial `auth` object                                | Provide full `auth` or disable.                       |
| Change stream empty   | Insert too early / stream not ready                  | Add slight delay or ensure stream open before writes. |

## Troubleshooting Enhancements

| Symptom                   | Cause                              | Fix                                                  |
| ------------------------- | ---------------------------------- | ---------------------------------------------------- |
| Transactions failing      | Not enough members                 | Set `count >= 3`.                                    |
| Replica set start timeout | Binary download or slow host       | Pin version & use cached `downloadDir`.              |
| Change stream never fires | Stream closed or replica not ready | Wait for readiness (~few seconds) before operations. |
| OOM / memory spikes       | Large dataset inserted             | Use MongoContainerHook for heavy persistence.        |

## Performance Tips

-   Keep member count minimal (3) unless testing larger topologies.
-   Pin MongoDB versions for deterministic behavior.
-   Reuse binary downloads across CI jobs with shared `downloadDir`.

## Comparison Summary

| MongoMemoryServerHook | MongoMemoryReplSetHook           | MongoContainerHook        |
| --------------------- | -------------------------------- | ------------------------- |
| Single node           | Multi-node in-memory             | Real engine via Docker    |
| Fast CRUD             | Transactions & streams           | Full production features  |
| No replica semantics  | Election, replication simulation | Real persistence & config |

## Summary

MongoMemoryReplSetHook enables advanced MongoDB feature testing with minimal overhead; use container-based setup for production fidelity or heavy data, and single memory server for basic CRUD speed.

## See Also

-   [MongoMemoryServerHook](./MongoMemoryServerHook.md) - Single MongoDB instance for simple tests
-   [MongoContainerHook](./MongoContainerHook.md) - Docker-based MongoDB for integration tests
-   [RepositoryHook](./RepositoryHook.md) - TypeORM repository access
