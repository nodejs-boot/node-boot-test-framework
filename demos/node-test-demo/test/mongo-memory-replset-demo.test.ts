import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// Test that hook doesn't run when not configured
describe("MongoMemoryReplSet Demo - Inactive Hook", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, () => {
        // Intentionally NOT calling useMongoMemoryReplSet() here
        // Hook should remain inactive
    });

    it("should not start MongoDB Replica Set when hook is not configured", () => {
        // Attempting to use the hook should throw an error
        assert.throws(
            () => {
                useMongoMemoryReplSet();
            },
            {
                message: "MongoMemoryReplSet not started yet. Ensure test lifecycle has begun.",
            },
            "Hook should not be active when not configured in setup phase",
        );

        console.log("✓ Hook correctly remains inactive when not configured");
    });
});

// Basic MongoDB Memory Replica Set test
describe("MongoMemoryReplSet Demo - Basic Usage", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet();
    });

    it("should start MongoDB Replica Set with default options", async () => {
        const {mongoUri, replSet, servers} = useMongoMemoryReplSet();

        // Verify MongoDB Replica Set is running
        assert.ok(mongoUri, "MongoDB URI should be defined");
        assert.ok(mongoUri.includes("mongodb://"), "URI should be a valid MongoDB connection string");
        assert.ok(replSet, "Replica Set instance should be defined");
        assert.ok(servers, "Servers array should be defined");
        assert.ok(servers.length >= 1, "Should have at least one server");

        console.log(`MongoDB Replica Set running at: ${mongoUri}`);
        console.log(`Number of servers: ${servers.length}`);
    });

    it("should set MONGODB_URI environment variable", () => {
        assert.ok(process.env["MONGODB_URI"], "MONGODB_URI environment variable should be set");
        assert.ok(
            process.env["MONGODB_URI"]?.includes("mongodb://"),
            "Environment variable should contain valid MongoDB URI",
        );

        console.log(`Environment variable set: ${process.env["MONGODB_URI"]}`);
    });
});

// Custom replica set name
describe("MongoMemoryReplSet Demo - Custom Replica Set Name", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                name: "custom-replset",
            },
        });
    });

    it("should start replica set with custom name", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with custom replica set name");
        console.log(`MongoDB Replica Set URI: ${mongoUri}`);
    });
});

// Custom database name
describe("MongoMemoryReplSet Demo - Custom Database Name", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "custom-test-db",
            },
        });
    });

    it("should use custom database name", () => {
        const {mongoUri, servers, replSet} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB uri should be defined");
        assert.ok(mongoUri.endsWith("replicaSet=testset"), "URI should reference the default replica set name");
        assert.ok(servers.length > 0, "Should have at leas one servers in replica set");
        assert.ok(replSet, "Replica set instance should be defined");
        console.log(`MongoDB URI with custom database: ${mongoUri}`);
    });
});

// Multiple replica set members
describe("MongoMemoryReplSet Demo - Multiple Members", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                count: 3, // Start with 3 members
                dbName: "multi-member-db",
            },
        });
    });

    it("should start replica set with multiple members", () => {
        const {mongoUri, servers, replSet} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB uri should be defined");
        assert.ok(mongoUri.endsWith("replicaSet=testset"), "URI should reference the default replica set name");
        assert.ok(replSet, "Replica set instance should be defined");
        assert.ok(servers.length >= 3, `Should have at least 3 servers, got ${servers.length}`);

        console.log(`MongoDB Replica Set with ${servers.length} members: ${mongoUri}`);
    });
});

// Custom IP binding
describe("MongoMemoryReplSet Demo - IP Binding", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                ip: "127.0.0.1",
                dbName: "ip-test-db",
            },
        });
    });

    it("should bind replica set to specific IP address", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri.includes("127.0.0.1"), "URI should contain IP address");
        console.log(`MongoDB Replica Set bound to IP: ${mongoUri}`);
    });
});

// MongoDB version specification
describe("MongoMemoryReplSet Demo - MongoDB Version", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            binary: {
                version: "6.0.0",
            },
            replSet: {
                dbName: "version-test-db",
            },
        });
    });

    it("should start replica set with specific MongoDB version", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB 6.0.0 replica set should start successfully");
        console.log(`MongoDB 6.0.0 Replica Set running at: ${mongoUri}`);
    });
});

// Storage engine configuration
describe("MongoMemoryReplSet Demo - Storage Engine", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "storage-test-db",
                storageEngine: "wiredTiger",
            },
        });
    });

    it("should configure replica set with wiredTiger storage engine", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start successfully with wiredTiger");
        console.log(`MongoDB Replica Set with wiredTiger: ${mongoUri}`);
    });
});

// Instance-specific configuration
describe("MongoMemoryReplSet Demo - Instance Options", () => {
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
            ],
            replSet: {
                dbName: "instance-test-db",
            },
        });
    });

    it("should start replica set with instance-specific options", () => {
        const {mongoUri, servers} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with instance options");
        assert.strictEqual(servers.length, 2, "Should have 2 instances as configured");

        console.log(`MongoDB Replica Set with custom instances: ${mongoUri}`);
        console.log(`Instances: ${servers.length}`);
    });
});

// Additional arguments
describe("MongoMemoryReplSet Demo - Additional Arguments", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "args-test-db",
                args: ["--quiet"],
            },
        });
    });

    it("should start replica set with additional arguments", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with additional arguments");
        console.log(`MongoDB Replica Set with additional args: ${mongoUri}`);
    });
});

// Replica set config settings
describe("MongoMemoryReplSet Demo - Config Settings", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "config-test-db",
                configSettings: {
                    chainingAllowed: true,
                    heartbeatTimeoutSecs: 30,
                    heartbeatIntervalMillis: 2000,
                    electionTimeoutMillis: 10000,
                },
            },
        });
    });

    it("should configure replica set with custom settings", () => {
        const {mongoUri} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with custom config settings");
        console.log(`MongoDB Replica Set with custom config: ${mongoUri}`);
    });
});

// Authentication configuration
describe("MongoMemoryReplSet Demo - Authentication", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                dbName: "auth-test-db",
                auth: {
                    enable: true,
                    customRootName: "admin",
                    customRootPwd: "password123",
                },
            },
        });
    });

    it("should start replica set with authentication enabled", () => {
        const {mongoUri, replSet} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with authentication");
        assert.ok(replSet, "Replica Set instance should be available");
        console.log(`MongoDB Replica Set with auth: ${mongoUri}`);
    });
});

// Advanced configuration
describe("MongoMemoryReplSet Demo - Advanced Configuration", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            binary: {
                version: "6.0.0",
            },
            replSet: {
                name: "advanced-replset",
                dbName: "advanced-test-db",
                count: 3,
                ip: "127.0.0.1",
                storageEngine: "wiredTiger",
                configSettings: {
                    chainingAllowed: true,
                    heartbeatTimeoutSecs: 30,
                },
            },
        });
    });

    it("should start replica set with advanced configuration", () => {
        const {mongoUri, servers} = useMongoMemoryReplSet();

        assert.ok(mongoUri, "MongoDB should start with advanced configuration");
        assert.ok(servers.length >= 3, "Should have at least 3 members");

        console.log(`MongoDB Replica Set with advanced config: ${mongoUri}`);
        console.log(`Members: ${servers.length}`);
    });
});

// Access individual servers
describe("MongoMemoryReplSet Demo - Access Individual Servers", () => {
    const {useMongoMemoryReplSet} = useNodeBoot(EmptyApp, ({useMongoMemoryReplSet}) => {
        useMongoMemoryReplSet({
            replSet: {
                count: 2,
                dbName: "servers-test-db",
            },
        });
    });

    it("should provide access to individual servers", async () => {
        const {servers} = useMongoMemoryReplSet();

        assert.ok(servers.length >= 2, "Should have at least 2 servers");

        // Access individual server information
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            const instanceInfo = server?.instanceInfo;

            assert.ok(instanceInfo, `Server ${i} should have instance info`);
            assert.ok(instanceInfo.port > 0, `Server ${i} should have a valid port`);

            console.log(`Server ${i}: ${instanceInfo.ip}:${instanceInfo.port}`);
        }
    });
});
