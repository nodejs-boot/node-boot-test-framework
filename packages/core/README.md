# NodeBoot Integration Test Framework

A comprehensive, extensible testing framework for NodeBoot applications that provides a plugin-based architecture for dependency injection testing, service mocking, and lifecycle management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Hook Types: Setup vs Return Hooks](#hook-types-setup-vs-return-hooks)
4. [Available Hooks](#available-hooks)
5. [Advanced Usage](#advanced-usage)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Migration Guide](#migration-guide)

## Architecture Overview

The NodeBoot Test Framework follows a layered, plugin-based architecture designed for maximum extensibility and composability:

```
┌─────────────────────────────────────────────────────────┐
│                Test Runner Integration                   │
│            (Jest, Mocha, Vitest, etc.)                 │
├─────────────────────────────────────────────────────────┤
│              Custom Hook Libraries                      │
│       (JestHooksLibrary, MochaHooksLibrary, etc.)      │
├─────────────────────────────────────────────────────────┤
│                 Core Framework                          │
│    (NodeBootTestFramework, HookManager, HooksLibrary)  │
├─────────────────────────────────────────────────────────┤
│                   Hook System                           │
│        (Hook base class, lifecycle phases)             │
├─────────────────────────────────────────────────────────┤
│               NodeBoot Application                      │
│         (IoC Container, Services, Config)              │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Plugin Architecture**: Everything is a hook that can be added, removed, or customized
2. **Lifecycle-Driven**: Clear, predictable execution phases
3. **Priority-Based**: Hooks execute in controlled order based on priority
4. **State Management**: Hooks can store and share state across lifecycle phases
5. **Test Runner Agnostic**: Core framework works with any test runner
6. **Composable**: Hook libraries can extend and combine functionality

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

## Hook Types: Setup vs Return Hooks

The NodeBoot Test Framework provides two distinct types of hooks that serve different purposes in your test lifecycle:

### Setup Hooks (Configuration Phase)

Setup hooks are **called during test configuration** and are used to prepare your test environment before the application starts. These hooks configure how your application will run during tests.

**Key Characteristics:**

-   Execute during the setup callback function passed to `useNodeBoot()`
-   Run **before** the application starts
-   Used for configuration, mocking, and environment setup
-   Cannot access running application services or HTTP endpoints
-   Changes take effect when the application starts

**Usage Pattern:**

```typescript
const hooks = useNodeBoot(MyApp, ({useConfig, useMock, useEnv}) => {
    // These are Setup Hooks - they configure the test environment
    useConfig({database: {url: "sqlite::memory:"}});
    useMock(EmailService, {sendEmail: jest.fn()});
    useEnv({NODE_ENV: "test"});
});
```

**Common Setup Hooks:**

-   `useConfig()` - Override application configuration
-   `useMock()` - Mock service implementations
-   `useEnv()` - Set environment variables
-   `usePactum()` - Enable HTTP testing tools
-   `useCleanup()` - Register cleanup functions
-   `useAddress()` - Get server address after startup

### Return Hooks (Runtime Phase)

Return hooks are **returned from `useNodeBoot()`** and are used during test execution to interact with your running application. These hooks provide access to services, repositories, and HTTP clients.

**Key Characteristics:**

-   Available after `useNodeBoot()` returns
-   Execute during test runtime when called
-   Used for interacting with the running application
-   Can access services, make HTTP requests, and query data
-   Provide the actual testing capabilities

**Usage Pattern:**

```typescript
const {useService, useHttp, useRepository} = useNodeBoot(MyApp, setupCallback);

it("should work with services", () => {
    // These are Return Hooks - they interact with the running app
    const userService = useService(UserService);
    const {get, post} = useHttp();
    const userRepo = useRepository(UserRepository);
});
```

**Common Return Hooks:**

-   `useService()` - Access IoC container services
-   `useRepository()` - Access data repositories
-   `useHttp()` - HTTP client for API testing
-   `useSupertest()` - Supertest instance for HTTP testing
-   `useConfig()` - Access current configuration (read-only)
-   `useSpy()` - Create Jest spies on services

### Execution Timeline

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Setup Phase   │    │  Application     │    │  Test Execution │
│                 │    │  Startup         │    │                 │
│  Setup Hooks    │───▶│                  │───▶│  Return Hooks   │
│  - useConfig()  │    │  - Load config   │    │  - useService() │
│  - useMock()    │    │  - Start server  │    │  - useHttp()    │
│  - useEnv()     │    │  - Initialize    │    │  - useRepo()    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Best Practices

1. **Use Setup Hooks for Configuration:**

    ```typescript
    // ✅ Good - Configure before app starts
    useNodeBoot(App, ({useConfig, useMock}) => {
        useConfig({port: 3001});
        useMock(EmailService, mockImpl);
    });
    ```

2. **Use Return Hooks for Testing:**

    ```typescript
    // ✅ Good - Test the running application
    const {useService, useHttp} = useNodeBoot(App, setup);

    it("should work", () => {
        const service = useService(MyService);
        expect(service.doSomething()).toBeTruthy();
    });
    ```

3. **Don't Mix Hook Types:**

    ```typescript
    // ❌ Bad - Can't use return hooks in setup
    useNodeBoot(App, ({useConfig, useService}) => {
        // useService not available here
        useConfig({port: 3001});
        const service = useService(MyService); // This will fail!
    });
    ```

4. **Understand Timing:**

    ```typescript
    // ✅ Good - Right timing for each hook type
    const hooks = useNodeBoot(App, ({useConfig}) => {
        useConfig({database: {url: "test.db"}}); // Setup: before app starts
    });

    it("should access database", () => {
        const repo = hooks.useRepository(UserRepo); // Runtime: after app started
    });
    ```

## Available Hooks

### Setup Hooks (Configuration Phase)

These hooks are called during the setup callback passed to `useNodeBoot()` and configure your test environment before the application starts.

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

Access the server's listening address after startup.

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

#### `usePactum(baseUrl?: string)`

Enable Pactum.js integration for HTTP testing.

```typescript
usePactum(); // Uses default server address
// or
usePactum("http://localhost:3001"); // Custom base URL

// Now you can use spec() from pactum directly in tests
```

#### `useCleanup(hooks: { afterAll?: () => void, afterEach?: () => void })`

Register cleanup functions that will be called automatically.

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

Get repository instances for data layer testing.

```typescript
const userRepo = useRepository(UserRepository);
await userRepo.create({name: "Test User"});
const users = await userRepo.findAll();
```

#### `useHttp(baseURL?: string)`

Get HTTP client for API testing.

```typescript
const {get, post, put, delete: del} = useHttp();

// GET request
const users = await get("/api/users");

// POST request with data
const newUser = await post("/api/users", {
    name: "John Doe",
    email: "john@example.com",
});

// With headers
const response = await get("/api/protected", {
    headers: {Authorization: "Bearer token"},
});

// Custom base URL
const externalApi = useHttp("https://api.external.com");
const data = await externalApi.get("/data");
```

#### `useSupertest()`

Get Supertest instance for HTTP testing with built-in assertions.

```typescript
const request = useSupertest();

await request
    .get("/api/users")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(res => {
        expect(res.body).toHaveLength(1);
    });
```

#### `useConfig()`

Access the current configuration (read-only during test execution).

```typescript
const config = useConfig();
const port = config.getNumber("app.port");
const dbUrl = config.getString("database.url");
const isProduction = config.getBoolean("app.production", false);
```

### Dual-Purpose Hooks

Some hooks can be used both during setup and test execution phases.

#### `useAppContext()` (Setup & Return)

Can be used as both a setup hook (with callback) and return hook (direct access).

```typescript
// Setup usage - configure during setup phase
useNodeBoot(App, ({useAppContext}) => {
    useAppContext(context => {
        // Configure based on application context
        console.log("App started with config:", context.config);
    });
});

// Return usage - access during test execution
const {useAppContext} = useNodeBoot(App, setup);
it("should access app context", () => {
    useAppContext(context => {
        expect(context.logger).toBeDefined();
        expect(context.config).toBeDefined();
    });
});
```

## Advanced Usage

### Creating Custom Hooks

```typescript
import {Hook} from "@nodeboot/test";
import {NodeBootAppView} from "@nodeboot/core";

export class CustomDatabaseHook extends Hook {
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

    // Setup hook touse the database connection
    use() {
        return {
            getConnection: () => this.getState("connection"),
            seedData: (data: any) => this.seedTestData(data),
        };
    }

    // Setup hook to configure database connection
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

### Custom Hook Libraries

Create custom hook libraries for specific testing needs:

```typescript
import {HooksLibrary} from "@nodeboot/test";
// Import Jest-specific Hooks library if using Jest
import {JestHooksLibrary} from "@nodeboot/jest";
import {CustomHook} from "./CustomHook";

export class MyCustomHooksLibrary extends JestHooksLibrary {
    customHook = new CustomDatabaseHook();

    override registerHooks(hookManager: HookManager) {
        super.registerHooks(hookManager);
        hookManager.addHook(this.customHook);
    }

    override getSetupHooks(): JestSetUpHooks {
        // Make sure to include base setup hooks
        const baseHooks = super.getSetupHooks();
        return {
            ...baseHooks,
            useCustom: this.customHook.call.bind(this.customHook),
        };
    }

    override getReturnHooks() {
        // Make sure to include base return hooks
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
useNodeBoot(AppUnderTest, ({useConfig}) => {
    useConfig({
        app: {
            port: 20000,
        },
        database: {url: process.env.TEST_DB_URL || "sqlite::memory:"},
        redis: {host: "localhost", port: 6380}, // Test Redis instance
        external: {
            apiKey: "test-key",
            baseUrl: "http://localhost:8080", // Mock server
        },
    });
});
```

### 4. Data Management

```typescript
const {useRepository} = useNodeBoot(AppUnderTest);

// Clean slate for each test
beforeEach(async () => {
    const db = useRepository(DatabaseRepository);
    await db.truncateAll();
    await db.seedTestData();
});
```

### 5. Async Testing

```typescript
const {useService} = useNodeBoot(AppUnderTest);

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

> See [Jest Custom Hooks](../jest/README.md) for a concrete example.

## License

MIT License - see LICENSE file for details.
