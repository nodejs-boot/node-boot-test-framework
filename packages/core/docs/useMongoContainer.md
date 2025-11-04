# useMongoContainer Hook

The `useMongoContainer` hook provides a seamless way to spin up a MongoDB container using Testcontainers for your integration tests. It's specifically designed to integrate with NodeBoot's persistence layer and automatically handles container lifecycle management.

## Features

-   **MongoDB Container**: Automatically starts a MongoDB container using Testcontainers
-   **NodeBoot Integration**: Seamlessly integrates with NodeBoot's persistence configuration
-   **Container Runtime Detection**: Automatically detects and configures Docker/Podman
-   **Lifecycle Management**: Automatic container startup before tests and cleanup after tests
-   **Flexible Configuration**: Support for custom images, databases, authentication, and environment variables
-   **Connection String**: Automatically generates and provides MongoDB connection URI

## Basic Usage

### Simple MongoDB Container

```typescript
import {useNodeBoot} from "@nodeboot/test";

const {useRepository, useService} = useNodeBoot(MyApp, ({useMongoContainer}) => {
    useMongoContainer();
});

test("should work with MongoDB", async () => {
    const {mongoUri} = useMongoContainer();
    // MongoDB is automatically configured in NodeBoot's persistence layer
    // Use repositories and services as normal
});
```

### Custom Configuration

```typescript
const {useRepository} = useNodeBoot(MyApp, ({useMongoContainer}) => {
    useMongoContainer({
        dbName: "myapp-test",
        image: "mongo:7",
        username: "testuser",
        password: "testpass",
        port: 27017,
        env: {
            MONGO_INITDB_DATABASE: "myapp-test",
        },
    });
});

test("should connect to custom MongoDB setup", async () => {
    const {mongoUri, container} = useMongoContainer();
    console.log("MongoDB URI:", mongoUri);
    // mongoUri: mongodb://testuser:testpass@localhost:54321/myapp-test?authSource=admin
});
```

## Configuration Options

### MongoContainerOptions

```typescript
type MongoContainerOptions = {
    image?: string; // Default: 'mongo:6'
    dbName?: string; // Default: 'testdb'
    port?: number; // Default: 27017
    username?: string; // Optional: MongoDB username
    password?: string; // Optional: MongoDB password
    env?: Record<string, string>; // Optional: Additional environment variables
};
```

### Option Details

-   **image**: MongoDB Docker image to use (e.g., `'mongo:7'`, `'mongo:6-alpine'`)
-   **dbName**: Name of the database to create and connect to
-   **port**: MongoDB port inside the container (usually 27017)
-   **username**: Root username for authentication (requires password)
-   **password**: Root password for authentication (requires username)
-   **env**: Additional environment variables to set in the container

## Advanced Examples

### MongoDB with Authentication

```typescript
useMongoContainer({
    image: "mongo:7",
    dbName: "secure-app-db",
    username: "admin",
    password: "supersecure123",
    env: {
        MONGO_INITDB_DATABASE: "secure-app-db",
    },
});

test("should authenticate with MongoDB", async () => {
    const {mongoUri} = useMongoContainer();
    // URI will include authentication: mongodb://admin:supersecure123@localhost:port/secure-app-db?authSource=admin
});
```

### Using Specific MongoDB Version

```typescript
useMongoContainer({
    image: "mongo:8.0-jammy",
    dbName: "modern-app",
    env: {
        MONGO_INITDB_DATABASE: "modern-app",
    },
});
```

### Development vs Production Image

```typescript
useMongoContainer({
    image: process.env.CI ? "mongo:7-alpine" : "mongo:7",
    dbName: "app-test-db",
});
```

## API Reference

### useMongoContainer(options?: MongoContainerOptions)

Configures a MongoDB container with the specified options. Call this in the setup function passed to `useNodeBoot`.

### useMongoContainer()

Returns container information and connection details. Call this within test functions.

```typescript
type MongoContainerInfo = {
    mongoUri: string; // MongoDB connection URI
    container?: StartedTestContainer; // Testcontainers instance
};
```

### Return Object Properties

#### mongoUri

The complete MongoDB connection string ready to use:

```typescript
const {mongoUri} = useMongoContainer();
// Example: "mongodb://localhost:54321/testdb"
// With auth: "mongodb://user:pass@localhost:54321/testdb?authSource=admin"
```

#### container

The Testcontainers instance for advanced operations:

```typescript
const {container} = useMongoContainer();
if (container) {
    const logs = await container.logs();
    const mappedPort = container.getMappedPort(27017);
}
```

## Integration with NodeBoot Persistence

The `useMongoContainer` hook automatically configures NodeBoot's persistence layer:

```typescript
// This configuration is automatically applied:
{
    persistence: {
        type: "mongodb",
        cache: false,
        mongodb: {
            database: dbName,
            url: mongoUri,
            useUnifiedTopology: true
        }
    }
}
```

### Using with Repositories

```typescript
import {DataRepository, PagingAndSortingRepository} from "@nodeboot/starter-persistence";

// Repository methods work automatically with the containerized MongoDB
@DataRepository(User)
export class PagingUserRepository extends PagingAndSortingRepository<User> {}

test("should work with repositories", async () => {
    const userRepo = useRepository(UserRepository);

    const user = await userRepo.save({
        name: "John Doe",
        email: "john@example.com",
    });

    const users = await userRepo.find({});
    expect(users).toContain(user);
});
```

### Using with Services

```typescript
import {Service} from "@nodeboot/core";

@Service()
class UserService {
    constructor(private userRepo: UserRepository) {}

    async createUser(userData: any) {
        return this.userRepo.save(userData);
    }
}

test("should work with services", async () => {
    const userService = useService(UserService);

    await userService.createUser({
        name: "Jane Doe",
        email: "jane@example.com",
    });

    // Data persists in the MongoDB container
});
```

## Complete Example

```typescript
import {useNodeBoot} from "@nodeboot/test";
import {describe, test, expect} from "node:test";

describe("User Management with MongoDB", () => {
    const {useRepository, useService} = useNodeBoot(MyApp, ({useConfig, useMongoContainer}) => {
        useConfig({
            app: {port: 3000},
        });

        useMongoContainer({
            image: "mongo:7",
            dbName: "user-management-test",
            username: "testuser",
            password: "testpass",
        });
    });

    test("should create and retrieve users", async () => {
        const {mongoUri} = useMongoContainer();
        console.log("Connected to:", mongoUri);

        const userService = useService(UserService);

        // Create user
        const newUser = await userService.createUser({
            name: "Test User",
            email: "test@example.com",
            age: 30,
        });

        expect(newUser.id).toBeDefined();

        // Retrieve users
        const users = await userService.findAllUsers();
        expect(users.length).toBeGreaterThan(0);
        expect(users.some(u => u.email === "test@example.com")).toBe(true);
    });

    test("should handle database operations", async () => {
        const userRepo = useRepository(UserRepository);

        // Direct repository usage
        const user = await userRepo.save({
            name: "Direct User",
            email: "direct@example.com",
        });

        const foundUser = await userRepo.findOne({email: "direct@example.com"});
        expect(foundUser).toEqual(user);
    });
});
```

## Environment Variables

The hook automatically sets the `MONGODB_URI` environment variable:

```typescript
test("should have MongoDB URI in environment", () => {
    const {mongoUri} = useMongoContainer();
    expect(process.env.MONGODB_URI).toBe(mongoUri);
});
```

## Best Practices

### 1. Use Specific MongoDB Versions

```typescript
// ✅ Good - specific version
useMongoContainer({image: "mongo:7.0"});

// ❌ Avoid - may break in future
useMongoContainer({image: "mongo:latest"});
```

### 2. Use Meaningful Database Names

```typescript
// ✅ Good - descriptive database name
useMongoContainer({dbName: "user-service-test"});

// ❌ Avoid - generic names
useMongoContainer({dbName: "test"});
```

### 3. Secure Authentication for Sensitive Tests

```typescript
useMongoContainer({
    dbName: "secure-test-db",
    username: "testadmin",
    password: "secure-test-password-123",
});
```

### 4. Environment-Specific Configuration

```typescript
useMongoContainer({
    image: process.env.NODE_ENV === "ci" ? "mongo:7-alpine" : "mongo:7",
    dbName: `myapp-test-${Date.now()}`, // Unique DB names for parallel tests
});
```

## Troubleshooting

### Container Runtime Issues

The hook automatically detects Docker/Podman:

```bash
# Check logs for container runtime detection
[MongoContainerHook] Using container runtime: docker
```

### Connection Issues

```typescript
test("debug MongoDB connection", async () => {
    const {mongoUri, container} = useMongoContainer();

    console.log("MongoDB URI:", mongoUri);
    if (container) {
        console.log("Container ID:", container.getId());
        console.log("Mapped port:", container.getMappedPort(27017));

        // Check container logs
        const logs = await container.logs();
        logs.on("data", line => console.log("MongoDB log:", line));
    }
});
```

### Port Conflicts

Testcontainers automatically maps to available ports:

```typescript
const {container} = useMongoContainer();
const actualPort = container?.getMappedPort(27017); // Use mapped port, not 27017
```

### Database Initialization

For complex initialization needs:

```typescript
useMongoContainer({
    image: "mongo:7",
    dbName: "complex-test-db",
    env: {
        MONGO_INITDB_DATABASE: "complex-test-db",
        // Add any additional MongoDB configuration
    },
});
```

## Performance Tips

### 1. Container Reuse

The container is automatically managed per test suite. For better performance across multiple test files, consider using a global setup.

### 2. Database Cleanup

Each test suite gets a fresh container, ensuring test isolation:

```typescript
// No manual cleanup needed - container is automatically stopped after tests
```

### 3. Lightweight Images

Use Alpine-based images for faster startup:

```typescript
useMongoContainer({
    image: "mongo:7-alpine", // Smaller, faster startup
});
```

The `useMongoContainer` hook provides a powerful and convenient way to integrate MongoDB into your Node Boot tests, with automatic configuration, lifecycle management, and seamless integration with NodeBoot's persistence layer.
