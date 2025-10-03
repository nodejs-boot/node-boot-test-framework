# NodeBoot Integration Test Framework

A comprehensive testing framework for NodeBoot applications that provides dependency injection testing, service mocking, and lifecycle management with support for Jest and other test runners.

## Overview

The NodeBoot Test Framework enables developers to write integration tests for NodeBoot applications with minimal setup while providing powerful features like:

-   **Service Injection**: Access real or mocked services from your IoC container
-   **HTTP Testing**: Built-in HTTP client and Supertest integration
-   **Mock Management**: Easy service mocking with automatic cleanup
-   **Configuration Override**: Test-specific configuration and environment variables
-   **Lifecycle Hooks**: Comprehensive test lifecycle management
-   **Timer Control**: Mock and control JavaScript timers in tests

## Architecture

The framework consists of three main components:

### 1. Core Framework (`@nodeboot/test`)

-   `NodeBootTestFramework`: Main orchestrator that manages the test lifecycle
-   `HookManager`: Manages hook execution order and lifecycle phases
-   `HooksLibrary`: Collection of built-in testing utilities
-   `Hook`: Base class for creating custom testing hooks

### 2. Jest Integration (`@nodeboot/jest`)

-   `useNodeBoot()`: Jest-specific integration function
-   `JestHooksLibrary`: Extended hooks with Jest-specific features (spies, timers)
-   Automatic Jest lifecycle integration (beforeAll, afterAll, etc.)

### 3. Hook System

The framework uses a priority-based hook system that executes in phases:

-   **beforeStart**: Setup before application starts
-   **afterStart**: Configuration after application starts
-   **beforeTests**: Setup before test suite runs
-   **afterTests**: Cleanup after test suite completes
-   **beforeEachTest**: Setup before each individual test
-   **afterEachTest**: Cleanup after each individual test

## Quick Start

### Installation

```bash
npm install @nodeboot/test @nodeboot/jest
# or
pnpm add @nodeboot/test @nodeboot/jest
```

### Basic Usage

```typescript
import {useNodeBoot} from "@nodeboot/jest";
import {MyApp} from "./MyApp";

describe("My App Integration Tests", () => {
    const {useHttp, useService, useConfig} = useNodeBoot(MyApp, ({useConfig, useMock, useEnv, usePactum}) => {
        // Test configuration
        useConfig({
            app: {port: 3001},
            database: {url: "sqlite::memory:"},
        });

        // Environment variables
        useEnv({NODE_ENV: "test"});

        // Enable Pactum for HTTP testing
        usePactum();

        // Mock a service
        useMock(EmailService, {
            sendEmail: jest.fn(() => Promise.resolve()),
        });
    });

    it("should handle API requests", async () => {
        const {get} = useHttp();

        const response = await get("/api/users");
        expect(response.status).toBe(200);
    });

    it("should access services", () => {
        const userService = useService(UserService);
        expect(userService).toBeDefined();
    });
});
```

## Available Hooks

### Setup Hooks (Configuration Phase)

#### `useConfig(config: object)`

Override application configuration for tests.

```typescript
useConfig({
    app: {port: 3001},
    database: {url: "test.db"},
    redis: {host: "localhost", port: 6380},
});
```

#### `useEnv(variables: Record<string, string>)`

Set environment variables for the test session.

```typescript
useEnv({
    NODE_ENV: "test",
    API_KEY: "test-key",
    DEBUG: "true",
});
```

#### `useMock(ServiceClass, mockImplementation)`

Mock service methods with automatic cleanup.

```typescript
// Mock with Jest functions
useMock(EmailService, {
    sendEmail: jest.fn(() => Promise.resolve()),
    validateEmail: jest.fn(() => true),
});

// Mock with plain implementations
useMock(PaymentService, {
    processPayment: () => ({success: true, transactionId: "test-123"}),
});
```

#### `useAddress(callback: (address: string) => void)`

Access the server's listening address.

```typescript
useAddress(address => {
    console.log("Server running at:", address);
    // Set up external test dependencies
});
```

#### `useAppContext(callback: (context: ApplicationContext) => void)`

Access the application context for advanced setup.

```typescript
useAppContext(context => {
    expect(context.config).toBeDefined();
    expect(context.logger).toBeDefined();
    // Additional context validation or setup
});
```

#### `usePactum()`

Enable Pactum.js integration for HTTP testing.

```typescript
usePactum();
// Now you can use spec() from pactum directly in tests
```

#### `useCleanup(hooks: { afterAll?: () => void, afterEach?: () => void })`

Register cleanup functions.

```typescript
useCleanup({
    afterAll: () => {
        // Clean up test data, close connections, etc.
    },
    afterEach: () => {
        // Reset state between tests
    },
});
```

### Runtime Hooks (Test Execution Phase)

#### `useService(ServiceClass)`

Get service instances from the IoC container.

```typescript
const userService = useService(UserService);
const result = userService.findUser("123");
```

#### `useRepository(RepositoryClass)`

Get repository instances (for data layer testing).

```typescript
const userRepo = useRepository(UserRepository);
await userRepo.create({name: "Test User"});
```

#### `useHttp()`

Get HTTP client for API testing.

```typescript
const {get, post, put, delete: del} = useHttp();

// GET request
const users = await get("/api/users");

// POST request
const newUser = await post("/api/users", {
    name: "John Doe",
    email: "john@example.com",
});

// With headers
const response = await get("/api/protected", {
    headers: {Authorization: "Bearer token"},
});
```

#### `useSupertest()`

Get Supertest instance for HTTP testing.

```typescript
const request = useSupertest();

await request.get("/api/users").expect(200).expect("Content-Type", /json/);
```

#### `useConfig()`

Access the current configuration.

```typescript
const config = useConfig();
const port = config.getNumber("app.port");
const dbUrl = config.getString("database.url");
```

### Jest-Specific Hooks

#### `useSpy(ServiceClass, methodName)`

Create Jest spies on service methods.

```typescript
const spy = useSpy(UserService, "findUser");

// Use the service normally
const user = useService(UserService).findUser("123");

// Verify spy calls
expect(spy).toHaveBeenCalledWith("123");
expect(spy).toHaveBeenCalledTimes(1);
```

#### `useTimer()`

Control JavaScript timers in tests.

```typescript
const {control} = useTimer();

let callbackCalled = false;
setTimeout(() => (callbackCalled = true), 1000);

expect(callbackCalled).toBe(false);

// Advance time by 1 second
control().advanceTimeBy(1000);
expect(callbackCalled).toBe(true);

// Or run all pending timers
control().runAllTimers();
```

## Advanced Usage

### Custom Hook Libraries

Create custom hook libraries for specific testing needs:

```typescript
import {HooksLibrary} from "@nodeboot/test";
import {CustomHook} from "./CustomHook";

export class MyCustomHooksLibrary extends HooksLibrary {
    customHook = new CustomHook();

    override registerHooks(hookManager: HookManager) {
        super.registerHooks(hookManager);
        hookManager.addHook(this.customHook);
    }

    override getReturnHooks() {
        const baseHooks = super.getReturnHooks();
        return {
            ...baseHooks,
            useCustom: this.customHook.use.bind(this.customHook),
        };
    }
}

// Use custom library
const hooks = useNodeBoot(MyApp, setup, new MyCustomHooksLibrary());
```

### Creating Custom Hooks

```typescript
import {Hook} from "@nodeboot/test";
import {NodeBootAppView} from "@nodeboot/core";

export class DatabaseHook extends Hook {
    constructor() {
        super(1); // Priority (lower numbers run first)
    }

    override async beforeStart() {
        // Set up test database
        await this.setupTestDatabase();
    }

    override async afterTests() {
        // Clean up test database
        await this.cleanupTestDatabase();
    }

    override async beforeEachTest() {
        // Reset database state
        await this.resetDatabase();
    }

    use() {
        return {
            getConnection: () => this.getState("connection"),
            seedData: (data: any) => this.seedTestData(data),
        };
    }

    call(config: DatabaseConfig) {
        this.setState("config", config);
    }

    private async setupTestDatabase() {
        // Implementation
    }

    private async cleanupTestDatabase() {
        // Implementation
    }

    private async resetDatabase() {
        // Implementation
    }
}
```

### Multi-Server Testing

Test applications with multiple servers or services:

```typescript
describe("Multi-Service Integration", () => {
    const api = useNodeBoot(ApiApp, ({useConfig}) => {
        useConfig({app: {port: 3001}});
    });

    const auth = useNodeBoot(AuthApp, ({useConfig}) => {
        useConfig({app: {port: 3002}});
    });

    it("should communicate between services", async () => {
        const apiHttp = api.useHttp();
        const authHttp = auth.useHttp();

        // Test inter-service communication
        const token = await authHttp.post("/login", credentials);
        const data = await apiHttp.get("/protected", {
            headers: {Authorization: `Bearer ${token.data.token}`},
        });

        expect(data.status).toBe(200);
    });
});
```

### Database Testing with Persistence

```typescript
import {useNodeBoot} from "@nodeboot/jest";
import {spec} from "pactum";

describe("User API with Persistence", () => {
    const {useHttp, useRepository, useMock} = useNodeBoot(AppWithDatabase, ({useConfig, usePactum}) => {
        useConfig({
            database: {url: "sqlite::memory:"},
        });
        usePactum();
    });

    beforeEach(async () => {
        // Seed test data
        const userRepo = useRepository(UserRepository);
        await userRepo.create({
            id: "1",
            name: "Test User",
            email: "test@example.com",
        });
    });

    it("should fetch users from database", async () => {
        const response = await spec().get("/api/users").expectStatus(200).returns("res.body");

        expect(response).toHaveLength(1);
        expect(response[0].name).toBe("Test User");
    });

    it("should create new users", async () => {
        const newUser = {
            name: "John Doe",
            email: "john@example.com",
        };

        const response = await spec().post("/api/users").withJson(newUser).expectStatus(201).returns("res.body");

        expect(response.id).toBeDefined();
        expect(response.name).toBe(newUser.name);
    });
});
```

## Best Practices

### 1. Test Organization

```typescript
describe("User Management", () => {
    const hooks = useNodeBoot(App, commonSetup);

    describe("Authentication", () => {
        // Auth-specific tests
    });

    describe("Profile Management", () => {
        // Profile-specific tests
    });
});
```

### 2. Mock Strategy

```typescript
// Mock external dependencies, keep internal services real
useMock(EmailService, {sendEmail: jest.fn()}); // External
useMock(PaymentGateway, {charge: jest.fn()}); // External
// Don't mock UserService, OrderService, etc. (internal business logic)
```

### 3. Configuration Management

```typescript
// Use environment-specific configs
const testConfig = {
    app: {port: 0}, // Use random port
    database: {url: process.env.TEST_DB_URL || "sqlite::memory:"},
    redis: {host: "localhost", port: 6380}, // Test Redis instance
    external: {
        apiKey: "test-key",
        baseUrl: "http://localhost:8080", // Mock server
    },
};
```

### 4. Data Management

```typescript
// Clean slate for each test
beforeEach(async () => {
    const db = useRepository(DatabaseRepository);
    await db.truncateAll();
    await db.seedTestData();
});
```

### 5. Async Testing

```typescript
it("should handle async operations", async () => {
    const service = useService(AsyncService);

    // Use proper async/await
    const result = await service.processAsync("data");
    expect(result).toBeDefined();

    // Verify async side effects
    const spy = useSpy(EmailService, "sendEmail");
    expect(spy).toHaveBeenCalled();
});
```

## Troubleshooting

### Common Issues

1. **Service Not Found Error**

    ```
    Error: The class MyService is not decorated with @Service
    ```

    Ensure your service classes are properly decorated with `@Service()`.

2. **IoC Container Not Found**

    ```
    Error: IOC Container is required for useService hook to work
    ```

    Make sure your app is properly initialized with dependency injection.

3. **Port Conflicts**
   Use random ports in tests:

    ```typescript
    useConfig({app: {port: 0}}); // Random available port
    ```

4. **Memory Leaks in Tests**
   Ensure proper cleanup:
    ```typescript
    useCleanup({
        afterAll: () => {
            // Close connections, clear caches, etc.
        },
    });
    ```

### Debugging Tips

1. **Enable Debug Logging**

    ```typescript
    useEnv({DEBUG: "nodeboot:*"});
    ```

2. **Inspect Hook Execution**
   The framework logs hook execution order and timing.

3. **Verify Mock Calls**
    ```typescript
    const spy = useSpy(Service, "method");
    console.log("Mock calls:", spy.mock.calls);
    ```

## Migration Guide

### From Manual Setup

```typescript
// Before (manual setup)
beforeAll(async () => {
    app = new MyApp();
    server = await app.start();
});

afterAll(async () => {
    await server.close();
});

// After (NodeBoot Test Framework)
const {useHttp} = useNodeBoot(MyApp);
```

### Adding New Hooks

When adding new testing capabilities, create hooks that follow the framework patterns and integrate with the lifecycle system.

## License

MIT License - see LICENSE file for details.
