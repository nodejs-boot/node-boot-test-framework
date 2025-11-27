# SpyHook

The `SpyHook` attaches a spy to a method of an IoC-managed service instance, recording calls, results, errors, and supporting async method tracking. This enables behavioral verification without changing the actual implementation.

## Purpose

Integration tests need to verify that services interact correctly without mocking their implementations. `SpyHook` provides non-invasive observation of method calls, allowing you to assert that methods were called with expected arguments while preserving real behavior.

## Features

-   **Non-Invasive**: Observes calls without changing behavior
-   **Call Recording**: Tracks all invocations with arguments
-   **Result Tracking**: Records return values (resolved values for promises)
-   **Error Capture**: Captures thrown/rejected errors
-   **Async Support**: Properly handles promises and async methods
-   **Automatic Restoration**: Spies automatically restored after tests

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Basic Usage", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should spy on service method calls", async () => {
        const userService = useService(UserService);
        const findSpy = useSpy(UserService, "findAllUsers");

        await userService.findAllUsers();

        assert.strictEqual(findSpy.callCount, 1);
        assert.deepStrictEqual(findSpy.calls[0], []);
    });

    it("should record method arguments", async () => {
        const userService = useService(UserService);
        const findByIdSpy = useSpy(UserService, "findById");

        await userService.findById(123);

        assert.strictEqual(findByIdSpy.callCount, 1);
        assert.deepStrictEqual(findByIdSpy.calls[0], [123]);
    });
});
```

## Call Tracking

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Call Tracking", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should track multiple calls", async () => {
        const userService = useService(UserService);
        const createSpy = useSpy(UserService, "createUser");

        await userService.createUser({name: "Alice", email: "alice@example.com"});
        await userService.createUser({name: "Bob", email: "bob@example.com"});
        await userService.createUser({name: "Charlie", email: "charlie@example.com"});

        assert.strictEqual(createSpy.callCount, 3);
        assert.strictEqual(createSpy.calls[0][0].name, "Alice");
        assert.strictEqual(createSpy.calls[1][0].name, "Bob");
        assert.strictEqual(createSpy.calls[2][0].name, "Charlie");
    });

    it("should track calls with multiple arguments", async () => {
        const userService = useService(UserService);
        const updateSpy = useSpy(UserService, "updateUser");

        await userService.updateUser(1, {name: "Updated Name"});
        await userService.updateUser(2, {email: "new@example.com"});

        assert.strictEqual(updateSpy.callCount, 2);
        assert.deepStrictEqual(updateSpy.calls[0], [1, {name: "Updated Name"}]);
        assert.deepStrictEqual(updateSpy.calls[1], [2, {email: "new@example.com"}]);
    });
});
```

## Result Tracking

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Result Tracking", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should capture return values", async () => {
        const userService = useService(UserService);
        const findSpy = useSpy(UserService, "findById");

        const result1 = await userService.findById(1);
        const result2 = await userService.findById(2);

        assert.strictEqual(findSpy.results.length, 2);
        assert.deepStrictEqual(findSpy.results[0], result1);
        assert.deepStrictEqual(findSpy.results[1], result2);
    });

    it("should handle async method results", async () => {
        const userService = useService(UserService);
        const createSpy = useSpy(UserService, "createUser");

        const user = await userService.createUser({
            name: "Diana",
            email: "diana@example.com",
        });

        assert.strictEqual(createSpy.results.length, 1);
        assert.ok(createSpy.results[0].id);
        assert.strictEqual(createSpy.results[0].name, "Diana");
    });
});
```

## Error Tracking

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Error Tracking", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should capture thrown errors", async () => {
        const userService = useService(UserService);
        const validateSpy = useSpy(UserService, "validateUser");

        try {
            await userService.validateUser({invalid: "data"});
        } catch (error) {
            // Error expected
        }

        assert.strictEqual(validateSpy.callCount, 1);
        assert.strictEqual(validateSpy.errors.length, 1);
        assert.ok(validateSpy.errors[0] instanceof Error);
    });

    it("should track both successes and failures", async () => {
        const userService = useService(UserService);
        const processSpy = useSpy(UserService, "processUser");

        // Successful call
        await userService.processUser({valid: "data"});

        // Failed call
        try {
            await userService.processUser({invalid: "data"});
        } catch (error) {
            // Expected
        }

        assert.strictEqual(processSpy.callCount, 2);
        assert.strictEqual(processSpy.results.length, 1); // One success
        assert.strictEqual(processSpy.errors.length, 1); // One failure
    });
});
```

## Cross-Service Verification

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";
import {EmailService} from "../src/services/EmailService";

describe("SpyHook - Cross-Service Verification", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should verify service collaboration", async () => {
        const userService = useService(UserService);
        const emailSpy = useSpy(EmailService, "sendWelcomeEmail");

        // UserService internally calls EmailService.sendWelcomeEmail
        await userService.createUser({
            name: "Eve",
            email: "eve@example.com",
        });

        assert.strictEqual(emailSpy.callCount, 1);
        assert.strictEqual(emailSpy.calls[0][0], "eve@example.com");
    });
});
```

## Multiple Spies

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Multiple Spies", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should track multiple methods independently", async () => {
        const userService = useService(UserService);
        const createSpy = useSpy(UserService, "createUser");
        const updateSpy = useSpy(UserService, "updateUser");
        const deleteSpy = useSpy(UserService, "deleteUser");

        await userService.createUser({name: "Frank", email: "frank@example.com"});
        await userService.updateUser(1, {name: "Franklin"});
        await userService.deleteUser(1);

        assert.strictEqual(createSpy.callCount, 1);
        assert.strictEqual(updateSpy.callCount, 1);
        assert.strictEqual(deleteSpy.callCount, 1);
    });
});
```

## Manual Restoration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Manual Restoration", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should manually restore spy", async () => {
        const userService = useService(UserService);
        const findSpy = useSpy(UserService, "findById");

        await userService.findById(1);
        assert.strictEqual(findSpy.callCount, 1);

        // Manually restore early
        findSpy.restore();

        await userService.findById(2);
        // Spy not tracking anymore after restore
        assert.strictEqual(findSpy.callCount, 1);
    });
});
```

## Accessing Original Function

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserService} from "../src/services/UserService";

describe("SpyHook - Original Function", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should provide access to original function", async () => {
        const userService = useService(UserService);
        const findSpy = useSpy(UserService, "findById");

        assert.ok(findSpy.original);
        assert.strictEqual(typeof findSpy.original, "function");

        // Can call original directly if needed
        const result = await findSpy.original.call(userService, 1);
        assert.ok(result);
    });
});
```

## Integration Testing Pattern

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {OrderService} from "../src/services/OrderService";
import {InventoryService} from "../src/services/InventoryService";
import {PaymentService} from "../src/services/PaymentService";

describe("SpyHook - Integration Pattern", () => {
    const {useSpy, useService} = useNodeBoot(EmptyApp, () => {});

    it("should verify complete order flow", async () => {
        const orderService = useService(OrderService);
        const inventorySpy = useSpy(InventoryService, "reserveItems");
        const paymentSpy = useSpy(PaymentService, "processPayment");

        await orderService.placeOrder({
            userId: 1,
            items: [{productId: 1, quantity: 2}],
            paymentMethod: "credit_card",
        });

        // Verify service interactions happened in order
        assert.strictEqual(inventorySpy.callCount, 1);
        assert.strictEqual(paymentSpy.callCount, 1);

        // Verify inventory was reserved before payment
        assert.ok(inventorySpy.calls[0]);
        assert.ok(paymentSpy.calls[0]);
    });
});
```

## Lifecycle

-   **No Setup Required**: Spies are created on-demand when `useSpy` is called
-   **afterTests**: All active spies automatically restored

## API

### `useSpy<T, K extends keyof T>(ServiceClass: Class<T>, methodName: K): Spy`

Creates a spy on a service method.

**Parameters:**

-   `ServiceClass`: The service class containing the method
-   `methodName`: The name of the method to spy on

**Returns:** Spy object with:

-   `callCount`: Number of times the method was called
-   `calls`: Array of argument arrays for each call
-   `results`: Array of return values (resolved for promises)
-   `errors`: Array of captured errors
-   `restore()`: Manually restore original implementation
-   `original`: Reference to the original function

## Best Practices

-   **Behavioral Verification**: Use spies to assert method calls without changing behavior
-   **Integration Tests**: Perfect for verifying service collaborations in integration tests
-   **Avoid Hot Paths**: Don't spy on frequently-called methods unless needed (can add overhead)
-   **Check Call Count**: Always verify `callCount` to ensure methods were called expected times
-   **Inspect Arguments**: Use `calls` array to verify methods were called with correct arguments
-   **Combine with Real Behavior**: Spies preserve real implementation - perfect for integration testing

## Troubleshooting

**Error: "method is not a function"**

-   Ensure method name is spelled correctly (case-sensitive)
-   Verify the method exists on the service class
-   Check that you're spying on a method, not a property

**Spy not recording calls:**

-   Ensure the method is actually being called
-   Verify you're testing the right service instance from IoC container
-   Check that spy was created before the method was called

**Call count wrong:**

-   Remember that spies track all calls during the test lifecycle
-   Verify no other tests or setup code is calling the method
-   Consider test isolation and cleanup

**Error: "Service not decorated"**

-   Ensure service class has `@Service()` decorator
-   Verify `reflect-metadata` is imported
-   Check that service is registered in IoC container
