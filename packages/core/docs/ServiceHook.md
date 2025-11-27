# ServiceHook

The `ServiceHook` retrieves IoC-managed service instances decorated with `@Service`. This enables direct interaction with application services during integration testing, allowing you to verify service behavior, call methods, and inspect state.

## Purpose

Integration tests need to interact with services running inside the bootstrapped application. `ServiceHook` provides type-safe access to service instances from the IoC container, enabling you to test service logic, verify interactions, and validate business rules.

## Features

-   **Type-Safe Access**: Get fully-typed service instances from the IoC container
-   **IoC Integration**: Works with the application's dependency injection container
-   **Decorator Validation**: Ensures classes are properly decorated with `@Service`
-   **Real Dependencies**: Services use their actual dependencies, not mocks (unless explicitly mocked)

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("ServiceHook - Basic Usage", () => {
    const {useService} = useNodeBoot(EmptyApp, () => {
        // No setup required for basic service access
    });

    it("should retrieve service instance", () => {
        const userService = useService(UserService);
        assert.ok(userService);
        assert.ok(typeof userService.createUser === "function");
    });

    it("should call service methods", async () => {
        const userService = useService(UserService);
        const user = await userService.createUser({
            name: "Alice",
            email: "alice@example.com",
        });

        assert.ok(user);
        assert.strictEqual(user.name, "Alice");
        assert.strictEqual(user.email, "alice@example.com");
    });
});
```

## Service Method Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("ServiceHook - Method Testing", () => {
    const {useService} = useNodeBoot(EmptyApp, () => {});

    it("should test CRUD operations", async () => {
        const userService = useService(UserService);

        // Create
        const created = await userService.createUser({
            name: "Bob",
            email: "bob@example.com",
        });
        assert.ok(created.id);

        // Read
        const retrieved = await userService.findById(created.id);
        assert.strictEqual(retrieved?.name, "Bob");

        // Update
        const updated = await userService.updateUser(created.id, {name: "Robert"});
        assert.strictEqual(updated?.name, "Robert");

        // Delete
        await userService.deleteUser(created.id);
        const deleted = await userService.findById(created.id);
        assert.strictEqual(deleted, null);
    });

    it("should test validation logic", async () => {
        const userService = useService(UserService);

        await assert.rejects(
            async () => {
                await userService.createUser({
                    name: "",
                    email: "invalid-email",
                });
            },
            {message: /validation failed/i},
        );
    });
});
```

## Combined with Spy Hook

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("ServiceHook - With Spy", () => {
    const {useService, useSpy} = useNodeBoot(EmptyApp, () => {});

    it("should verify service interactions with spy", async () => {
        const userService = useService(UserService);
        const createSpy = useSpy(UserService, "createUser");

        const userData = {name: "Charlie", email: "charlie@example.com"};
        await userService.createUser(userData);

        assert.strictEqual(createSpy.callCount, 1);
        assert.deepStrictEqual(createSpy.calls[0], [userData]);
        assert.ok(createSpy.results[0]);
    });

    it("should track multiple calls", async () => {
        const userService = useService(UserService);
        const findSpy = useSpy(UserService, "findById");

        await userService.findById(1);
        await userService.findById(2);
        await userService.findById(3);

        assert.strictEqual(findSpy.callCount, 3);
        assert.deepStrictEqual(findSpy.calls[0], [1]);
        assert.deepStrictEqual(findSpy.calls[1], [2]);
        assert.deepStrictEqual(findSpy.calls[2], [3]);
    });
});
```

## Combined with Mock Hook

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";
import {EmailService} from "../src/services/EmailService";

describe("ServiceHook - With Mock", () => {
    const {useService, useMock} = useNodeBoot(EmptyApp, ({useMock}) => {
        // Mock external EmailService dependency
        useMock(EmailService, {
            sendWelcomeEmail: () => Promise.resolve({sent: true}),
        });
    });

    it("should use service with mocked dependencies", async () => {
        const userService = useService(UserService);

        // UserService internally calls EmailService.sendWelcomeEmail
        const user = await userService.createUser({
            name: "Diana",
            email: "diana@example.com",
        });

        assert.ok(user);
        assert.strictEqual(user.name, "Diana");
        // Email was "sent" via mocked EmailService
    });
});
```

## Multiple Services

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";
import {OrderService} from "../src/services/OrderService";

describe("ServiceHook - Multiple Services", () => {
    const {useService} = useNodeBoot(EmptyApp, () => {});

    it("should access multiple services", async () => {
        const userService = useService(UserService);
        const orderService = useService(OrderService);

        const user = await userService.createUser({
            name: "Eve",
            email: "eve@example.com",
        });

        const order = await orderService.createOrder({
            userId: user.id,
            items: [{productId: 1, quantity: 2}],
        });

        assert.strictEqual(order.userId, user.id);
        assert.strictEqual(order.items.length, 1);
    });
});
```

## Service Collaboration Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";
import {AuthService} from "../src/services/AuthService";

describe("ServiceHook - Service Collaboration", () => {
    const {useService, useSpy} = useNodeBoot(EmptyApp, () => {});

    it("should verify cross-service interactions", async () => {
        const authService = useService(AuthService);
        const userService = useService(UserService);
        const findByEmailSpy = useSpy(UserService, "findByEmail");

        // AuthService internally calls UserService.findByEmail
        const result = await authService.login({
            email: "test@example.com",
            password: "password123",
        });

        assert.strictEqual(findByEmailSpy.callCount, 1);
        assert.deepStrictEqual(findByEmailSpy.calls[0], ["test@example.com"]);
    });
});
```

## Validation

The hook validates that the target class is properly decorated with `@Service`:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {NotAService} from "../src/utils/NotAService";

describe("ServiceHook - Validation", () => {
    const {useService} = useNodeBoot(EmptyApp, () => {});

    it("should throw for non-service classes", () => {
        assert.throws(
            () => {
                useService(NotAService);
            },
            {message: /not decorated with @Service/i},
        );
    });
});
```

## API

### `useService<T>(ServiceClass: Class<T>): T`

Retrieves a service instance from the IoC container.

**Parameters:**

-   `ServiceClass`: The service class decorated with `@Service`

**Returns:** The service instance with all dependencies injected

**Throws:**

-   Error if the class is not decorated with `@Service`
-   Error if the service is not found in the IoC container

## Best Practices

-   **Domain Logic Testing**: Use services to test business logic and domain rules
-   **Integration Over Unit**: Favor service-level integration tests over isolated unit tests
-   **Real Dependencies**: Keep dependencies real; only mock external boundaries (APIs, third-party services)
-   **Combine with Spy**: Use `useSpy` for behavioral verification without changing functionality
-   **Selective Mocking**: Use `useMock` only for external dependencies, not internal services
-   **Type Safety**: Leverage TypeScript types for compile-time safety

## Troubleshooting

**Error: "not decorated with @Service"**

-   Ensure the class has the `@Service()` decorator
-   Verify `reflect-metadata` is imported at the top of your test file
-   Check that the decorator import is correct: `import {Service} from "@nodeboot/core"`
-   Ensure the build step preserved TypeScript metadata (`emitDecoratorMetadata: true`)

**Service instance not found:**

-   Verify the service is registered in the application module
-   Ensure the application has fully bootstrapped before calling `useService`
-   Check that `useService` is called inside a test, not during setup

**Wrong instance returned:**

-   The IoC container might have multiple instances; verify your DI configuration
-   Check service scope settings (singleton vs transient)

**Dependencies not injected:**

-   Ensure all service dependencies are also decorated with `@Service` or appropriate decorators
-   Verify the IoC container configuration is correct
