import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MongoMemoryServer Demo - Inactive Hook", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, () => {
        // Intentionally NOT calling useMongoMemoryServer() here
        // Hook should remain inactive
    });

    it("should not start MongoDB when hook is not configured", () => {
        // Attempting to use the hook should throw an error
        assert.throws(
            () => useMongoMemoryServer(),
            {
                message: "MongoMemoryServer not started yet. Ensure test lifecycle has begun.",
            },
            "Hook should not be active when not configured in setup phase",
        );

        // Environment variable should not be set
        assert.strictEqual(
            process.env["MONGODB_URI"],
            undefined,
            "MONGODB_URI should not be set when hook is not configured",
        );

        console.log("✓ Hook correctly remains inactive when not configured");
    });
});

// Basic MongoDB Memory Server test
describe("MongoMemoryServer Demo - Basic Usage", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer();
    });

    it("should start MongoDB Memory Server with default options", async () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.ok(server !== undefined, "MongoMemoryServer instance should be defined");
        // Verify MongoDB is running
        assert.ok(mongoUri, "MongoDB URI should be defined");
        assert.ok(mongoUri.includes("mongodb://"), "URI should be a valid MongoDB connection string");
        assert.ok(server, "Server instance should be defined");

        console.log(`MongoDB Memory Server running at: ${mongoUri}`);

        // Verify instance info
        assert.ok(server.instanceInfo, "Instance info should be defined");
        assert.ok(server.instanceInfo.port > 0, "Port should be greater than 0");
    });

    it("should set MONGODB_URI environment variable", () => {
        assert.ok(process.env["MONGODB_URI"], "MONGODB_URI environment variable should be set");
        assert.ok(
            process.env["MONGODB_URI"].includes("mongodb://"),
            "Environment variable should contain valid MongoDB URI",
        );

        console.log(`Environment variable set: ${process.env["MONGODB_URI"]}`);
    });
});

// Custom database name
describe("MongoMemoryServer Demo - Custom Database Name", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "custom-test-db",
            },
        });
    });

    it("should start MongoDB Memory Server with custom database name", () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.ok(mongoUri !== undefined, "Database URI should be defined");
        assert.strictEqual(server?.instanceInfo?.dbName, "custom-test-db", "Database name should be 'custom-test-db'");
    });
});

// Custom port
describe("MongoMemoryServer Demo - Custom Port", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                port: 27017,
                dbName: "port-test-db",
            },
        });
    });

    it("should start MongoDB Memory Server on custom port", async () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.strictEqual(server?.instanceInfo?.port, 27017, "Server should be running on port 27017");
        assert.ok(mongoUri.includes("27017"), "URI should contain custom port");

        console.log(`MongoDB running on custom port: ${mongoUri}`);
    });
});

// Storage engine configuration
describe("MongoMemoryServer Demo - Storage Engine", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "storage-test-db",
                storageEngine: "wiredTiger",
            },
        });
    });

    it("should configure MongoDB with wiredTiger storage engine", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start successfully with wiredTiger");
        console.log(`MongoDB with wiredTiger: ${mongoUri}`);
    });
});

// IP binding
describe("MongoMemoryServer Demo - IP Binding", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                ip: "127.0.0.1",
                dbName: "ip-test-db",
            },
        });
    });

    it("should bind MongoDB to specific IP address", async () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.strictEqual(server?.instanceInfo?.ip, "127.0.0.1", "Server should bind to 127.0.0.1");
        assert.ok(mongoUri.includes("127.0.0.1"), "URI should contain IP address");

        console.log(`MongoDB bound to IP: ${mongoUri}`);
    });
});

// MongoDB version specification
describe("MongoMemoryServer Demo - MongoDB Version", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "version-test-db",
            },
            binary: {
                version: "6.0.0",
            },
        });
    });

    it("should start MongoDB with specific version", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB 6.0.0 should start successfully");
        console.log(`MongoDB 6.0.0 running at: ${mongoUri}`);
    });
});

// Replica set configuration
describe("MongoMemoryServer Demo - Replica Set", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "replset-test-db",
                replSet: "rs0",
            },
        });
    });

    it("should start MongoDB as replica set", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB replica set should start successfully");
        console.log(`MongoDB replica set running at: ${mongoUri}`);
    });
});

// Additional MongoDB arguments
describe("MongoMemoryServer Demo - Additional Arguments", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "args-test-db",
                args: ["--quiet"],
            },
        });
    });

    it("should start MongoDB with additional arguments", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start with additional arguments");
        console.log(`MongoDB with additional args: ${mongoUri}`);
    });
});

// Authentication configuration
describe("MongoMemoryServer Demo - Authentication", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "auth-test-db",
            },
            auth: {
                enable: true,
                customRootName: "admin",
                customRootPwd: "password123",
            },
        });
    });

    it("should start MongoDB with authentication enabled", () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start with authentication");
        assert.ok(server, "Server instance should be available");
        console.log(`MongoDB with auth: ${mongoUri}`);
    });
});

// Extra users configuration
describe("MongoMemoryServer Demo - Extra Users", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "users-test-db",
            },
            auth: {
                enable: true,
                extraUsers: [
                    {
                        createUser: "testuser",
                        pwd: "testpass",
                        roles: [{role: "readWrite", db: "users-test-db"}],
                        database: "users-test-db",
                    },
                ],
            },
        });
    });

    it("should start MongoDB with extra users", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start with extra users");
        console.log(`MongoDB with extra users: ${mongoUri}`);
    });
});

// Custom download directory
describe("MongoMemoryServer Demo - Binary Download Directory", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "download-test-db",
            },
            binary: {
                downloadDir: "./mongodb-binaries",
            },
        });
    });

    it("should use custom download directory for MongoDB binary", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start with custom download directory");
        console.log(`MongoDB with custom binary dir: ${mongoUri}`);
    });
});

// Advanced configuration combining multiple options
describe("MongoMemoryServer Demo - Advanced Configuration", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "advanced-test-db",
                ip: "127.0.0.1",
                storageEngine: "wiredTiger",
                args: ["--quiet"],
            },
            binary: {
                version: "6.0.0",
            },
        });
    });

    it("should start MongoDB with advanced configuration", async () => {
        const {mongoUri, server} = useMongoMemoryServer();

        assert.ok(mongoUri.includes("advanced-test-db"), "URI should contain database name");
        assert.ok(mongoUri.includes("127.0.0.1"), "URI should contain IP address");

        assert.strictEqual(server?.instanceInfo?.ip, "127.0.0.1", "IP should be configured correctly");

        console.log(`MongoDB with advanced config: ${mongoUri}`);
    });
});

// Database path specification
describe("MongoMemoryServer Demo - Custom Database Path", () => {
    const {useMongoMemoryServer} = useNodeBoot(EmptyApp, ({useMongoMemoryServer}) => {
        useMongoMemoryServer({
            instance: {
                dbName: "path-test-db",
                dbPath: "/tmp/mongodb-test-data",
            },
        });
    });

    it("should use custom database path", () => {
        const {mongoUri} = useMongoMemoryServer();

        assert.ok(mongoUri, "MongoDB should start with custom database path");
        console.log(`MongoDB with custom db path: ${mongoUri}`);
    });
});
