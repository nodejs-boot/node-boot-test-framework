# MockHook

The `MockHook` temporarily overrides methods or properties of IoC-managed service instances for tests. This enables selective mocking of external dependencies while keeping internal services real, supporting the integration-first testing approach.

## Purpose

Integration tests should test real application wiring, but external dependencies (third-party APIs, payment gateways, email services) need to be mocked. `MockHook` provides clean, temporary method replacement with automatic restoration and call tracking.

## Features

-   **Selective Mocking**: Override specific methods while keeping others real
-   **Automatic Restoration**: Original implementations restored after tests
-   **Call Tracking**: Built-in call count and argument tracking
-   **Type-Safe**: Works with TypeScript service classes
-   **IoC Integration**: Mocks services from the dependency injection container

## Important: External Dependencies Only

**Best Practice:** Only mock **external boundaries** (third-party APIs, payment SDKs, email services). Never mock internal services or repositories in integration tests.

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {EmailService} from "../src/services/EmailService";
import {UserService} from "../src/services/UserService";

describe("MockHook - Basic Usage", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        // Mock external EmailService
        useMock(EmailService, {
            sendEmail: () => Promise.resolve({sent: true, messageId: "mock-123"}),
        });
    });

    it("should use mocked email service", async () => {
        const userService = useService(UserService);

        // UserService internally calls EmailService.sendEmail
        const user = await userService.createUser({
            name: "Alice",
            email: "alice@example.com",
        });

        assert.ok(user);
        assert.strictEqual(user.name, "Alice");
        // Email was "sent" via mocked EmailService
    });
});
```

## Mocking External APIs

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {PaymentGatewayClient} from "../src/external/PaymentGatewayClient";
import {OrderService} from "../src/services/OrderService";

describe("MockHook - External API", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        useMock(PaymentGatewayClient, {
            processPayment: () =>
                Promise.resolve({
                    transactionId: "txn-mock-123",
                    status: "approved",
                    amount: 100,
                }),
        });
    });

    it("should process order with mocked payment gateway", async () => {
        const orderService = useService(OrderService);

        const order = await orderService.createOrder({
            userId: 1,
            items: [{productId: 1, quantity: 2, price: 50}],
            paymentMethod: "credit_card",
        });

        assert.ok(order);
        assert.strictEqual(order.status, "completed");
        assert.strictEqual(order.paymentStatus, "approved");
    });
});
```

## Call Tracking with Introspection

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {NotificationService} from "../src/services/NotificationService";
import {UserService} from "../src/services/UserService";

describe("MockHook - Call Tracking", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        const mockHandle = useMock(NotificationService, {
            sendNotification: (userId: number, message: string) => {
                return Promise.resolve({delivered: true});
            },
        });

        // Store mockHandle for later inspection if needed
    });

    it("should track mock method calls", async () => {
        const userService = useService(UserService);
        const notificationService = useService(NotificationService);

        await userService.notifyUser(123, "Welcome!");
        await userService.notifyUser(456, "Hello!");

        // Can use getMethodMeta to inspect calls (if mockHandle stored)
        // const meta = mockHandle.getMethodMeta('sendNotification');
        // assert.strictEqual(meta.callCount, 2);
    });
});
```

## Multiple Method Mocking

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {ExternalApiClient} from "../src/external/ExternalApiClient";

describe("MockHook - Multiple Methods", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        useMock(ExternalApiClient, {
            fetchUserData: (userId: number) =>
                Promise.resolve({
                    id: userId,
                    name: "Mock User",
                    premium: true,
                }),
            updateUserPreferences: (userId: number, prefs: any) => Promise.resolve({success: true}),
            deleteUser: (userId: number) => Promise.resolve({deleted: true}),
        });
    });

    it("should mock multiple methods on same service", async () => {
        const apiClient = useService(ExternalApiClient);

        const userData = await apiClient.fetchUserData(1);
        assert.strictEqual(userData.name, "Mock User");

        const updateResult = await apiClient.updateUserPreferences(1, {theme: "dark"});
        assert.strictEqual(updateResult.success, true);

        const deleteResult = await apiClient.deleteUser(1);
        assert.strictEqual(deleteResult.deleted, true);
    });
});
```

## Conditional Mock Responses

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {PaymentService} from "../src/external/PaymentService";

describe("MockHook - Conditional Responses", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        useMock(PaymentService, {
            charge: (amount: number) => {
                // Conditional mock logic
                if (amount > 1000) {
                    return Promise.reject(new Error("Amount too large"));
                }
                return Promise.resolve({
                    charged: true,
                    amount,
                    transactionId: `txn-${amount}`,
                });
            },
        });
    });

    it("should approve small payments", async () => {
        const paymentService = useService(PaymentService);
        const result = await paymentService.charge(100);

        assert.strictEqual(result.charged, true);
        assert.strictEqual(result.amount, 100);
    });

    it("should reject large payments", async () => {
        const paymentService = useService(PaymentService);

        await assert.rejects(
            async () => {
                await paymentService.charge(1500);
            },
            {message: "Amount too large"},
        );
    });
});
```

## Simulating Failures

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {EmailService} from "../src/services/EmailService";
import {UserService} from "../src/services/UserService";

describe("MockHook - Failure Simulation", () => {
    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        useMock(EmailService, {
            sendEmail: () => {
                throw new Error("Email service unavailable");
            },
        });
    });

    it("should handle email service failures gracefully", async () => {
        const userService = useService(UserService);

        // UserService should handle email failure
        const user = await userService.createUser({
            name: "Bob",
            email: "bob@example.com",
        });

        // User created despite email failure
        assert.ok(user);
        assert.ok(user.emailFailed); // Flag indicating email wasn't sent
    });
});
```

## Mock with Introspection API

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {SmsService} from "../src/services/SmsService";

describe("MockHook - Introspection", () => {
    let mockHandle: any;

    const {useMock, useService} = useNodeBoot(EmptyApp, ({useMock}) => {
        mockHandle = useMock(SmsService, {
            sendSms: (phone: string, message: string) => {
                return Promise.resolve({sent: true});
            },
        });
    });

    it("should track method invocations", async () => {
        const smsService = useService(SmsService);

        await smsService.sendSms("+1234567890", "Test message");
        await smsService.sendSms("+0987654321", "Another message");

        const meta = mockHandle.getMethodMeta("sendSms");
        assert.strictEqual(meta.callCount, 2);
        assert.strictEqual(meta.calls[0][0], "+1234567890");
        assert.strictEqual(meta.calls[1][0], "+0987654321");
    });
});
```

## Lifecycle

-   **beforeTests**: Applies all mock overrides to service instances
-   **afterTests**: Restores original implementations automatically

## API

### `useMock<T>(ServiceClass: Class<T>, mocks: Partial<T>): MockHandle`

Mocks methods on an IoC-managed service instance.

**Parameters:**

-   `ServiceClass`: The service class to mock
-   `mocks`: Object containing method names and their mock implementations

**Returns:** MockHandle with:

-   `restore()`: Manually restore original implementations early
-   `getMethodMeta(name)`: Get tracking data `{callCount, calls}` for a method
-   `allMeta`: Map of all mocked methods and their metadata

## Best Practices

-   **External Only**: Only mock external boundaries (APIs, third-party SDKs)
-   **Never Mock Internal**: Don't mock internal services or repositories in integration tests
-   **Minimal Mocking**: Only mock what the test needs; avoid broad replacement
-   **Realistic Behavior**: Make mocks behave like the real service (including errors)
-   **Use Metadata**: Leverage returned metadata for call assertions instead of separate spies
-   **Pure Functions**: Keep mock functions pure and deterministic for test repeatability

## Troubleshooting

**Error: "Service instance ... not found"**

-   Service not registered in IoC container
-   Server hasn't started yet
-   Service class name mismatch

**Mock not applying:**

-   Verify `useMock` is called in setup phase (second argument to `useNodeBoot`)
-   Check that method name matches exactly (case-sensitive)
-   Ensure service is retrieved from IoC container, not instantiated directly

**Original method still executing:**

-   Mock might be applied too late; ensure setup phase completes before tests
-   Service might be caching method references before mock applies

**Mock persisting across suites:**

-   Each suite should have its own `useNodeBoot` call with separate mocks
-   Verify test isolation and cleanup
