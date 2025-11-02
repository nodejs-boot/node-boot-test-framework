# @nodeboot/node-test

Node.js Test Runner integration for the NodeBoot Test Framework.

## Overview

The `@nodeboot/node-test` package extends the core NodeBoot Test Framework with Node.js test runner-specific features:

-   **Native Node.js Testing**: Uses the built-in `node:test` module
-   **Spy/Mock Integration**: Provides spy functionality for method tracking
-   **Timer Control**: Fake timer support for time-based testing
-   **Assert Integration**: Works seamlessly with `node:assert`

## Installation

```bash
npm install @nodeboot/node-test @nodeboot/core
# or
pnpm add @nodeboot/node-test @nodeboot/core
```

## Basic Usage

```typescript
import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {MyApp} from "./MyApp";

describe("My App Integration Tests", () => {
    const {useHttp, useService, useSpy} = useNodeBoot(MyApp, ({useConfig, useMock}) => {
        useConfig({
            app: {port: 3001},
            database: {url: "sqlite::memory:"},
        });

        useMock(EmailService, {
            sendEmail: () => Promise.resolve({messageId: "test-123"}),
        });
    });

    test("should handle API requests", async () => {
        const {get} = useHttp();
        const response = await get("/api/users");
        assert.equal(response.status, 200);
    });

    test("should spy on service methods", async () => {
        const userService = useService(UserService);
        const spy = useSpy(EmailService, "sendEmail");

        await userService.createUser({name: "Test", email: "test@example.com"});

        assert.equal(spy.callCount, 1);
        assert.deepEqual(spy.calls[0].arguments[0], {
            to: "test@example.com",
            subject: "Welcome",
        });
    });
});
```

## Example features

### Spy Functionality

The `useSpy` hook creates spies on service methods to track calls:

```typescript
const {useSpy} = useNodeBoot(MyApp, setup);

test("should track method calls", async () => {
    const spy = useSpy(EmailService, "sendEmail");

    // Perform operations that should trigger the method
    const service = useService(UserService);
    await service.notifyUser("123");

    // Verify the spy was called
    assert.equal(spy.callCount, 1);
    assert.ok(Array.isArray(spy.calls));

    // Clean up (automatic cleanup happens after each test)
    spy.restore();
});
```

### Timer Control

The `useTimer` hook provides fake timer control:

```typescript
const {useTimer} = useNodeBoot(MyApp, setup);

test("should control timers", () => {
    const {control, tracking} = useTimer();
    const tracker = tracking();

    let fired = false;
    setTimeout(() => {
        fired = true;
    }, 5000);

    // Advance time without waiting
    control().advanceTimeBy(5000);
    assert.equal(fired, true);

    // Track elapsed time
    tracker.stop();
    assert.ok(tracker.elapsed() >= 0);
});
```

### Mocking with Plain Functions

Unlike Jest, Node.js test runner uses plain functions for mocks:

```typescript
useMock(EmailService, {
    // Simple mock
    sendEmail: () => Promise.resolve({messageId: "mock-123"}),

    // Mock with state tracking
    validateEmail: (() => {
        let callCount = 0;
        return email => {
            callCount++;
            return email.includes("@");
        };
    })(),
});
```

## Available Hooks

All core hooks are available, plus Node.js test runner specific hooks.
Please refer to the [NodeBoot Test Framework documentation](../../README.md) for a complete list of hooks and their usage.

## Best Practices

### 1. Use Assert for Assertions

```typescript
import assert from "node:assert/strict";

test("should validate response", async () => {
    const response = await get("/api/users");
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.data));
});
```

### 2. Spy Management

```typescript
test("should track calls", () => {
    const spy = useSpy(Service, "method");

    // Use the service
    service.doSomething();

    // Verify
    assert.equal(spy.callCount, 1);

    // Cleanup is automatic, but you can restore manually
    spy.restore();
});
```

### 3. Timer Testing

```typescript
test("should handle delays", () => {
    const {control} = useTimer();

    let completed = false;
    setTimeout(() => {
        completed = true;
    }, 1000);

    // Fast-forward time
    control().advanceTimeBy(1000);
    assert.equal(completed, true);
});
```

### Common Gotchas

1. **Async/Await**: Node.js test runner requires explicit async/await handling
2. **Test Isolation**: Each test runs in isolation - shared state won't persist
3. **Error Messages**: Assert provides different error messages than expect
4. **Mock Cleanup**: Mocks are automatically cleaned up between tests

## License

MIT License - see LICENSE file for details.
