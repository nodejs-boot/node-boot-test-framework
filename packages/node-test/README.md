# NodeBoot Jest Integration

Jest-specific integration for the NodeBoot Test Framework, providing seamless integration with Jest test runner and additional Jest-specific testing utilities.

## Overview

The `@nodeboot/jest` package extends the core NodeBoot Test Framework with Jest-specific features:

-   **Automatic Jest Lifecycle Integration**: Seamless integration with Jest's beforeAll, afterAll, beforeEach, afterEach hooks
-   **Jest Spies**: Built-in Jest spy functionality for service methods
-   **Timer Control**: Mock and control JavaScript timers using Jest's timer mocks
-   **Enhanced Type Safety**: Full TypeScript support with Jest types

## Installation

```bash
npm install @nodeboot/jest @nodeboot/test
# or
pnpm add @nodeboot/jest @nodeboot/test
```

## Basic Usage

### Simple Test Setup

```typescript
import {useNodeBoot} from "@nodeboot/jest";
import {MyApp} from "./MyApp";

describe("My App Tests", () => {
    const {useHttp, useService} = useNodeBoot(MyApp);

    it("should start the application", async () => {
        const {get} = useHttp();
        const response = await get("/health");
        expect(response.status).toBe(200);
    });
});
```

### With Configuration

```typescript
import {useNodeBoot} from "@nodeboot/jest";
import {MyApp, EmailService} from "./MyApp";

describe("My App with Config", () => {
    const {useHttp, useService, useSpy} = useNodeBoot(MyApp, ({useConfig, useMock, useEnv}) => {
        // Test-specific configuration
        useConfig({
            app: {port: 3001},
            database: {url: "sqlite::memory:"},
        });

        // Mock external services
        useMock(EmailService, {
            sendEmail: jest.fn(() => Promise.resolve({messageId: "test-123"})),
        });

        // Set environment variables
        useEnv({NODE_ENV: "test"});
    });

    it("should send email and track calls", async () => {
        const emailSpy = useSpy(EmailService, "sendEmail");

        const {post} = useHttp();
        await post("/api/send-notification", {
            email: "test@example.com",
            message: "Hello World",
        });

        expect(emailSpy).toHaveBeenCalledWith({
            to: "test@example.com",
            subject: expect.any(String),
            body: "Hello World",
        });
    });
});
```

## Jest-Specific Hooks

### `useSpy(ServiceClass, methodName)`

Create Jest spies on service methods to verify calls and behavior.

```typescript
describe("Service Interaction Tests", () => {
    const {useService, useSpy} = useNodeBoot(MyApp);

    it("should track service method calls", () => {
        const userService = useService(UserService);
        const findUserSpy = useSpy(UserService, "findUser");

        // Call the service method
        const user = userService.findUser("123");

        // Verify the spy was called
        expect(findUserSpy).toHaveBeenCalledWith("123");
        expect(findUserSpy).toHaveBeenCalledTimes(1);
        expect(findUserSpy).toReturnWith(user);
    });

    it("should spy on async methods", async () => {
        const userService = useService(UserService);
        const createUserSpy = useSpy(UserService, "createUser");

        const userData = {name: "John", email: "john@example.com"};
        const result = await userService.createUser(userData);

        expect(createUserSpy).toHaveBeenCalledWith(userData);
        expect(createUserSpy).toHaveResolvedWith(result);
    });

    it("should spy on mocked services", () => {
        // First mock the service
        const {useMock} = useNodeBoot(MyApp, ({useMock}) => {
            useMock(EmailService, {
                sendEmail: jest.fn(() => Promise.resolve({messageId: "mock-123"})),
            });
        });

        // Then spy on the mocked method
        const emailSpy = useSpy(EmailService, "sendEmail");

        const emailService = useService(EmailService);
        emailService.sendEmail({to: "test@example.com"});

        expect(emailSpy).toHaveBeenCalled();
    });
});
```

### `useTimer()`

Control JavaScript timers in your tests using Jest's timer mocks.

```typescript
describe("Timer Control Tests", () => {
    const {useTimer} = useNodeBoot(MyApp);

    it("should advance timers manually", () => {
        const {control} = useTimer();

        let callbackExecuted = false;
        setTimeout(() => {
            callbackExecuted = true;
        }, 1000);

        expect(callbackExecuted).toBe(false);

        // Advance time by 1 second
        control().advanceTimeBy(1000);
        expect(callbackExecuted).toBe(true);
    });

    it("should fast-forward all timers", () => {
        const {control} = useTimer();

        const callback1 = jest.fn();
        const callback2 = jest.fn();

        setTimeout(callback1, 100);
        setTimeout(callback2, 500);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();

        // Run all pending timers
        control().runAllTimers();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
    });

    it("should advance timers step by step", () => {
        const {control} = useTimer();

        const callback = jest.fn();
        setInterval(callback, 100);

        // Run only the next timer
        control().runOnlyPendingTimers();
        expect(callback).toHaveBeenCalledTimes(1);

        // Advance by specific time
        control().advanceTimeBy(250);
        expect(callback).toHaveBeenCalledTimes(3); // 1 + 2 more calls
    });

    it("should work with async operations", async () => {
        const {control, useService} = useTimer();

        const delayedService = useService(DelayedService);

        const promise = delayedService.processWithDelay(1000);

        // Advance time to complete the delay
        control().advanceTimeBy(1000);

        const result = await promise;
        expect(result).toBeDefined();
    });
});
```

## Advanced Jest Integration

### Custom Jest Matchers

Use Jest's custom matchers with NodeBoot services:

```typescript
// Custom matcher for testing service results
expect.extend({
    toBeValidUser(received) {
        const pass = received && received.id && received.email;
        return {
            message: () => `expected ${received} to be a valid user`,
            pass,
        };
    },
});

describe("User Service Tests", () => {
    const {useService} = useNodeBoot(MyApp);

    it("should return valid user", () => {
        const userService = useService(UserService);
        const user = userService.findUser("123");

        expect(user).toBeValidUser();
    });
});
```

### Parameterized Tests

Use Jest's test.each with NodeBoot:

```typescript
describe("API Endpoint Tests", () => {
    const {useHttp} = useNodeBoot(MyApp);

    test.each([
        ["/api/users", 200],
        ["/api/products", 200],
        ["/api/orders", 200],
        ["/api/nonexistent", 404],
    ])("GET %s should return status %i", async (endpoint, expectedStatus) => {
        const {get} = useHttp();
        const response = await get(endpoint);
        expect(response.status).toBe(expectedStatus);
    });
});
```

### Snapshot Testing

Use Jest snapshots with API responses:

```typescript
describe("API Response Snapshots", () => {
    const {useHttp} = useNodeBoot(MyApp, ({useConfig}) => {
        useConfig({app: {version: "1.0.0-test"}});
    });

    it("should match API info snapshot", async () => {
        const {get} = useHttp();
        const response = await get("/api/info");

        expect(response.data).toMatchSnapshot();
    });

    it("should match user list structure", async () => {
        const {get} = useHttp();
        const response = await get("/api/users");

        expect(response.data).toMatchSnapshot({
            users: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    createdAt: expect.any(String),
                }),
            ]),
        });
    });
});
```

### Error Testing

Test error scenarios with Jest:

```typescript
describe("Error Handling Tests", () => {
    const {useService, useHttp} = useNodeBoot(MyApp, ({useMock}) => {
        useMock(DatabaseService, {
            findUser: jest.fn(() => {
                throw new Error("Database connection failed");
            }),
        });
    });

    it("should handle service errors", () => {
        const userService = useService(UserService);

        expect(() => {
            userService.getUser("123");
        }).toThrow("Database connection failed");
    });

    it("should return error responses", async () => {
        const {get} = useHttp();

        const response = await get("/api/users/123");
        expect(response.status).toBe(500);
        expect(response.data.error).toContain("Database connection failed");
    });
});
```

## Testing Patterns

### Setup and Teardown

```typescript
describe("User Management", () => {
    const {useService, useRepository} = useNodeBoot(MyApp);

    let userRepo: UserRepository;
    let testUsers: User[];

    beforeAll(() => {
        userRepo = useRepository(UserRepository);
    });

    beforeEach(async () => {
        // Clear and seed test data
        await userRepo.deleteAll();
        testUsers = await userRepo.createMany([
            {name: "John", email: "john@example.com"},
            {name: "Jane", email: "jane@example.com"},
        ]);
    });

    it("should find existing users", async () => {
        const userService = useService(UserService);
        const users = await userService.findAll();

        expect(users).toHaveLength(2);
        expect(users[0].name).toBe("John");
    });

    afterEach(async () => {
        // Optional: additional cleanup
        await userRepo.deleteAll();
    });
});
```

### Mock Strategies

```typescript
describe("Payment Processing", () => {
    describe("with successful payment gateway", () => {
        const {useService, useSpy} = useNodeBoot(MyApp, ({useMock}) => {
            useMock(PaymentGateway, {
                charge: jest.fn(() =>
                    Promise.resolve({
                        transactionId: "txn_123",
                        status: "success",
                    }),
                ),
            });
        });

        it("should process payment successfully", async () => {
            const paymentService = useService(PaymentService);
            const chargeSpy = useSpy(PaymentGateway, "charge");

            const result = await paymentService.processPayment({
                amount: 100,
                currency: "USD",
            });

            expect(result.success).toBe(true);
            expect(chargeSpy).toHaveBeenCalledWith({
                amount: 100,
                currency: "USD",
            });
        });
    });

    describe("with failing payment gateway", () => {
        const {useService} = useNodeBoot(MyApp, ({useMock}) => {
            useMock(PaymentGateway, {
                charge: jest.fn(() => Promise.reject(new Error("Payment failed"))),
            });
        });

        it("should handle payment failures", async () => {
            const paymentService = useService(PaymentService);

            await expect(paymentService.processPayment({amount: 100, currency: "USD"})).rejects.toThrow(
                "Payment failed",
            );
        });
    });
});
```

### Integration with Pactum

```typescript
import {spec} from "pactum";

describe("API Contract Tests", () => {
    const {useSpy} = useNodeBoot(MyApp, ({usePactum, useMock}) => {
        usePactum();

        useMock(EmailService, {
            sendEmail: jest.fn(() => Promise.resolve({messageId: "test-123"})),
        });
    });

    it("should create user and send welcome email", async () => {
        const emailSpy = useSpy(EmailService, "sendEmail");

        const response = await spec()
            .post("/api/users")
            .withJson({
                name: "John Doe",
                email: "john@example.com",
            })
            .expectStatus(201)
            .expectJsonLike({
                id: /^\w+$/,
                name: "John Doe",
                email: "john@example.com",
                createdAt: /^\d{4}-\d{2}-\d{2}T/,
            })
            .returns("res.body");

        expect(emailSpy).toHaveBeenCalledWith({
            to: "john@example.com",
            subject: "Welcome!",
            template: "welcome",
        });

        expect(response.id).toBeDefined();
    });
});
```

## Configuration

### Jest Setup File

Create a Jest setup file for global configuration:

```typescript
// jest.setup.js
import {jest} from "@jest/globals";

// Global test timeout
jest.setTimeout(30000);

// Mock console methods if needed
global.console = {
    ...console,
    // Suppress console.log in tests
    log: jest.fn(),
    // Keep error and warn for debugging
    error: console.error,
    warn: console.warn,
};

// Global test utilities
global.testUtils = {
    createMockUser: () => ({
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
    }),
};
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
    collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
    coverageReporters: ["text", "lcov", "html"],
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
};
```

## Best Practices for Jest Integration

### 1. Test Isolation

```typescript
// Ensure each test is isolated
describe("Isolated Tests", () => {
    // Each describe block gets its own app instance
    const {useService} = useNodeBoot(MyApp);

    it("test 1", () => {
        // This test won't affect others
    });
});
```

### 2. Mock Management

```typescript
// Use beforeEach for consistent mock setup
describe("Service Tests", () => {
    const {useService, useSpy} = useNodeBoot(MyApp);

    let emailSpy: jest.SpyInstance;

    beforeEach(() => {
        emailSpy = useSpy(EmailService, "sendEmail");
    });

    afterEach(() => {
        // Spies are automatically restored by the framework
        expect(emailSpy).toHaveBeenCalledTimes(expect.any(Number));
    });
});
```

### 3. Async Testing

```typescript
// Always use async/await for async operations
it("should handle async operations", async () => {
    const service = useService(AsyncService);

    // Wait for async operations to complete
    const result = await service.performAsyncOperation();
    expect(result).toBeDefined();

    // Wait for side effects
    await new Promise(resolve => setTimeout(resolve, 100));
});
```

### 4. Error Testing

```typescript
// Test both success and failure scenarios
describe("Error Scenarios", () => {
    it("should handle errors gracefully", async () => {
        const {useHttp} = useNodeBoot(MyApp, ({useMock}) => {
            useMock(ServiceClass, {
                method: jest.fn(() => {
                    throw new Error("Test error");
                }),
            });
        });

        const {get} = useHttp();
        const response = await get("/api/endpoint");

        expect(response.status).toBe(500);
    });
});
```

## Migration from Other Test Frameworks

### From Manual Jest Setup

```typescript
// Before (manual Jest setup)
describe("Manual Setup", () => {
    let app: Application;
    let server: any;

    beforeAll(async () => {
        app = new MyApp();
        server = await app.start();
    });

    afterAll(async () => {
        await server.close();
    });

    it("should work", async () => {
        // Manual HTTP requests
        const response = await fetch("http://localhost:3000/api/test");
        expect(response.status).toBe(200);
    });
});

// After (NodeBoot Jest)
describe("NodeBoot Setup", () => {
    const {useHttp} = useNodeBoot(MyApp);

    it("should work", async () => {
        const {get} = useHttp();
        const response = await get("/api/test");
        expect(response.status).toBe(200);
    });
});
```

## Troubleshooting Jest Integration

### Common Jest Issues

1. **Tests hanging or not exiting**

    ```typescript
    // Ensure proper cleanup
    const {useCleanup} = useNodeBoot(MyApp, ({useCleanup}) => {
        useCleanup({
            afterAll: () => {
                // Close all connections
            },
        });
    });
    ```

2. **Timer issues**

    ```typescript
    // Use real timers for integration tests
    beforeAll(() => {
        jest.useRealTimers();
    });
    ```

3. **Memory leaks**
    ```typescript
    // Monitor for open handles
    afterAll(() => {
        // Ensure all resources are closed
    });
    ```

## License

MIT License - see LICENSE file for details.
