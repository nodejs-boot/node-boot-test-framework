# NodeBoot Integration Test Framework

A comprehensive, extensible testing framework for NodeBoot applications that provides a plugin-based architecture for dependency injection testing, service mocking, and lifecycle management.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Hook Types: Setup vs Return Hooks](#hook-types-setup-vs-return-hooks)
4. [Available Hooks](#available-hooks)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Migration Guide](#migration-guide)
8. [Hook Reference](#hook-reference)
9. [Extending](#extending-the-framework)

## Quick Start

### Installation

```bash
npm install @nodeboot/node-test
# or
pnpm add @nodeboot/node-test
```

### Basic Usage

```typescript
import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
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
            sendEmail: () => Promise.resolve(),
        });
    });

    test("should handle API requests", async () => {
        const {get} = useHttp();

        const response = await get("/api/users");
        assert.equal(response.status, 200);
    });

    test("should access services", () => {
        const userService = useService(UserService);
        assert.ok(userService, "UserService should be defined");
    });
});
```

### Advanced Usage

For comprehensive integration test examples using the NodeBoot Test Framework with Node.js test runner, refer to the [Node.js Test Demo](demos/node-test-demo) project.

> Feel free to explore it, run it, and modify it to get a hands-on understanding of how to leverage the NodeBoot Test Framework effectively.

You can also check the demo projects:

-   [Node.js Test Demo](demos/node-test-demo) - Integration tests using Node.js built-in test runner.

## Architecture Overview

The NodeBoot Test Framework follows a layered, plugin-based architecture designed for maximum extensibility and composability:

```
┌─────────────────────────────────────────────────────────┐
│                Test Runner Integration                  │
│            (node:test, Mocha, Vitest, etc.)             │
├─────────────────────────────────────────────────────────┤
│              Custom Hook Libraries                      │
│             (MochaHooksLibrary, etc.)                   │
├─────────────────────────────────────────────────────────┤
│                 Core Framework                          │
│    (NodeBootTestFramework, HookManager, HooksLibrary)   │
├─────────────────────────────────────────────────────────┤
│                   Hook System                           │
│        (Hook base class, lifecycle phases)              │
├─────────────────────────────────────────────────────────┤
│               NodeBoot Application                      │
│         (IoC Container, Services, Config)               │
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
    useMock(EmailService, {sendEmail: () => Promise.resolve()});
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
-   `useSpy()` - Create spies on service methods

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
    useNodeBoot(AppUnderTest, ({useConfig, useMock}) => {
        useConfig({port: 3001});
        useMock(EmailService, mockImpl);
    });
    ```

2. **Use Return Hooks for Testing:**

    ```typescript
    // ✅ Good - Test the running application
    const {useService, useHttp} = useNodeBoot(AppUnderTest, setup);

    it("should work", () => {
        const service = useService(MyService);
        expect(service.doSomething()).toBeTruthy();
    });
    ```

3. **Don't Mix Hook Types:**

    ```typescript
    // ❌ Bad - Can't use return hooks in setup
    useNodeBoot(AppUnderTest, ({useConfig, useService}) => {
        // useService not available here
        useConfig({port: 3001});
        const service = useService(MyService); // This will fail!
    });
    ```

4. **Understand Timing:**

    ```typescript
    // ✅ Good - Right timing for each hook type
    const hooks = useNodeBoot(AppUnderTest, ({useConfig}) => {
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
// Mock with plain function implementations
useMock(EmailService, {
    sendEmail: () => Promise.resolve(),
    validateEmail: () => true,
});

// Mock with more complex implementations
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
useNodeBoot(AppUnderTest, ({useAppContext}) => {
    useAppContext(context => {
        // Configure based on application context
        console.log("AppUnderTest started with config:", context.config);
    });
});

// Return usage - access during test execution
const {useAppContext} = useNodeBoot(AppUnderTest, setup);

it("should access app context", () => {
    useAppContext(context => {
        expect(context.logger).toBeDefined();
        expect(context.config).toBeDefined();
    });
});
```

## Best Practices

### 1. Test Organization

```typescript
import {describe, test} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";

describe("User Management", () => {
    const hooks = useNodeBoot(AppUnderTest, commonSetup);

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
useMock(EmailService, {sendEmail: () => Promise.resolve()}); // External
useMock(PaymentGateway, {charge: () => Promise.resolve()}); // External
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
    const repository = useRepository(UserRepository);
    await repository.find({});
});
```

### 5. Async Testing

### 5. Async Testing

```typescript
import {test} from "node:test";
import assert from "node:assert/strict";

test("should handle async operations", async () => {
    const service = useService(AsyncService);

    // Use proper async/await
    const result = await service.processAsync("data");
    assert.ok(result, "Result should be defined");

    // Verify async side effects
    const spy = useSpy(EmailService, "sendEmail");
    assert.equal(spy.callCount, 1, "sendEmail should have been called");
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
    console.log("Mock calls:", spy.calls);
    console.log("Call count:", spy.callCount);
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

## Hook Reference

| Hook                    | Category         | Description                                                   | Docs                                                                       |
| ----------------------- | ---------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| useAddress              | Setup            | Access server listening address after startup                 | [AddressHook](packages/core/docs/AddressHook.md)                           |
| useAppContext           | Setup/Test       | Access application context for advanced setup or during tests | [AppContextHook](packages/core/docs/AppContextHook.md)                     |
| useConfig               | Setup/Test       | Override and read configuration for tests                     | [ConfigHook](packages/core/docs/ConfigHook.md)                             |
| useEnv                  | Setup            | Set environment variables for the test session                | [EnvHook](packages/core/docs/EnvHook.md)                                   |
| useMock                 | Setup/Test       | Mock service methods with cleanup/restore                     | [MockHook](packages/core/docs/MockHook.md)                                 |
| useCleanup              | Setup            | Register cleanup functions for automatic execution            | [LifecycleHook](packages/core/docs/LifecycleHook.md)                       |
| usePactum               | Setup            | Enable Pactum.js integration for HTTP testing                 | [PactumHook](packages/core/docs/PactumHook.md)                             |
| useHttp                 | Test             | HTTP client for calling app endpoints                         | [HttpClientHook](packages/core/docs/HttpClientHook.md)                     |
| useService              | Test             | Access services from IoC container                            | [ServiceHook](packages/core/docs/ServiceHook.md)                           |
| useRepository           | Test             | Access repositories for persistence tests                     | [RepositoryHook](packages/core/docs/RepositoryHook.md)                     |
| useSupertest            | Test             | Supertest agent for HTTP assertions                           | [SupertestHook](packages/core/docs/SupertestHook.md)                       |
| useSpy                  | Test (node-test) | Create spies on service methods                               | [SpyHook](packages/core/docs/SpyHook.md)                                   |
| useTimer                | Test (node-test) | Control fake timers and track execution time                  | [TimerHook](packages/core/docs/TimerHook.md)                               |
| useMetrics              | Test             | Record metrics and timers; retrieve summaries                 | [MetricsHook](packages/core/docs/MetricsHook.md)                           |
| usePerformanceBudget    | Setup/Test       | Enforce per-label performance budgets                         | [PerformanceBudgetHook](packages/core/docs/PerformanceBudgetHook.md)       |
| useFileSystemSandbox    | Setup/Test       | Per-test real filesystem sandbox                              | [FileSystemSandboxHook](packages/core/docs/FileSystemSandboxHook.md)       |
| useMemoryFileSystem     | Setup/Test       | In-memory filesystem replacement (memfs)                      | [MemoryFileSystemHook](packages/core/docs/MemoryFileSystemHook.md)         |
| useLogCapture           | Setup/Test       | Capture logs for assertion and diagnostics                    | [LogCaptureHook](packages/core/docs/LogCaptureHook.md)                     |
| useLogMatch             | Setup/Test       | Declarative log pattern expectations/forbids                  | [LogMatchHook](packages/core/docs/LogMatchHook.md)                         |
| useLoggerHook           | Test             | Access the shared Winston logger in tests                     | [LoggerHook](packages/core/docs/LoggerHook.md)                             |
| useLifecycle            | Setup            | Unified lifecycle management (before/after)                   | [LifecycleHook](packages/core/docs/LifecycleHook.md)                       |
| useMongoContainer       | Setup/Test       | Real MongoDB via Docker                                       | [MongoContainerHook](packages/core/docs/MongoContainerHook.md)             |
| useMongoMemoryServer    | Setup/Test       | In-memory single MongoDB instance                             | [MongoMemoryServerHook](packages/core/docs/MongoMemoryServerHook.md)       |
| useMongoMemoryReplSet   | Setup/Test       | In-memory MongoDB replica set (transactions/change streams)   | [MongoMemoryReplSetHook](packages/core/docs/MongoMemoryReplSetHook.md)     |
| useGenericContainer     | Setup/Test       | Declarative Docker containers via Testcontainers              | [GenericContainerHook](packages/core/docs/GenericContainerHook.md)         |
| useGenericContainerRaw  | Setup/Test       | Raw factory-based Testcontainers control                      | [GenericContainerRawHook](packages/core/docs/GenericContainerRawHook.md)   |
| useToxiproxy            | Setup/Test       | Network toxicity simulation                                   | [ToxiproxyHook](packages/core/docs/ToxiproxyHook.md)                       |
| useSnapshotState        | Setup/Test       | Detect unintended shared state mutations                      | [SnapshotStateHook](packages/core/docs/SnapshotStateHook.md)               |
| useResourceLeakDetector | Setup/Test       | Detect lingering resources/handles across tests               | [ResourceLeakDetectorHook](packages/core/docs/ResourceLeakDetectorHook.md) |
| useHttpClient           | Test             | HTTP client (alias where applicable)                          | [HttpClientHook](packages/core/docs/HttpClientHook.md)                     |

### Hook Scope Legend

-   **Setup**: Hooks called during the setup callback passed to `useNodeBoot()`. These configure the test environment before the application starts.
-   **Test**: Hooks returned from `useNodeBoot()` and used during test execution to interact with the running application.

### Usage Pattern

```typescript
// Setup hooks are used in the configuration callback
const hooks = useNodeBoot(MyApp, ({useConfig, useMock, useEnv}) => {
    useConfig({database: {url: "test.db"}}); // Setup Hook
    useMock(EmailService, {sendEmail: () => Promise.resolve()}); // Setup Hook
    useEnv({NODE_ENV: "test"}); // Setup Hook
});

// Return/Test hooks are used during test execution
const {useService, useHttp, useSpy} = hooks;

test("should work", () => {
    const service = useService(UserService); // Return Hook
    const {get} = useHttp(); // Return Hook
    const spy = useSpy(EmailService, "sendEmail"); // Return Hook
});
```

## Extending the Framework

-   To implement custom hooks or extend the framework, refer to the [Creating Custom Hooks](packages/core/README.md#advanced-usage) documentation.
-   For a concrete example of extension, refer to the [node:test extension](packages/node-test/README.md) documentation.

## License

MIT License - see LICENSE file for details.
