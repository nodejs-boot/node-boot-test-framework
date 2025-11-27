# AddressHook

The `AddressHook` provides the application base URL (e.g., `http://localhost:<port>`) once the NodeBoot app has started and invokes registered consumers prior to tests. This is useful when external tools or custom integrations need the server address early in the test lifecycle.

## Purpose

Some hooks/tools (HTTP clients, Pactum, custom integrations) need the server address before tests run. `AddressHook` supplies it without making test code query internal app objects, enabling early initialization of third-party testing tools.

## Features

-   **Automatic Address Resolution**: Computes the base URL after the application starts
-   **Consumer Pattern**: Allows registration of callbacks that receive the address
-   **Early Initialization**: Invokes consumers before tests begin
-   **Multiple Consumers**: Support for multiple address consumers

## Basic Usage

No setup required - the hook is always available. Register consumers in the setup phase:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AddressHook Test", () => {
    const {useAddress} = useNodeBoot(EmptyApp, ({useAddress}) => {
        useAddress(addr => console.log("Server listening at", addr));
    });

    it("should have server running at address", async () => {
        // Address consumers are invoked before tests run
        // The server is already started and accessible
        console.log("✓ Server address was logged during setup");
        assert.ok(true);
    });
});
```

## Capturing Address for Tests

Capture the address in an outer scope variable to use it within tests:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AddressHook - Capture Address", () => {
    let baseUrl: string;

    const {useAddress} = useNodeBoot(EmptyApp, ({useAddress}) => {
        useAddress(addr => {
            baseUrl = addr;
        });
    });

    it("should reach health endpoint using captured address", async () => {
        assert.ok(baseUrl, "Base URL should be set");
        assert.ok(baseUrl.includes("http://localhost:"), "Should be a valid localhost URL");

        const res = await fetch(`${baseUrl}/health`);
        assert.ok(res.ok, "Health endpoint should respond");
    });

    it("should use address for custom HTTP calls", async () => {
        const res = await fetch(`${baseUrl}/api/status`);
        assert.strictEqual(res.status, 200);
    });
});
```

## Multiple Consumers

Register multiple address consumers - all will be invoked in registration order:

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AddressHook - Multiple Consumers", () => {
    const addresses: string[] = [];

    const {useAddress} = useNodeBoot(EmptyApp, ({useAddress}) => {
        useAddress(addr => {
            console.log("First consumer:", addr);
            addresses.push(addr);
        });

        useAddress(addr => {
            console.log("Second consumer:", addr);
            addresses.push(addr);
        });
    });

    it("should invoke all registered consumers", () => {
        assert.strictEqual(addresses.length, 2);
        assert.strictEqual(addresses[0], addresses[1]);
    });
});
```

## Integration with Third-Party Tools

Use `useAddress` to initialize external testing tools:

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {SomeExternalClient} from "external-lib";

describe("AddressHook - External Tool Integration", () => {
    let externalClient: SomeExternalClient;

    const {useAddress} = useNodeBoot(EmptyApp, ({useAddress}) => {
        useAddress(addr => {
            externalClient = new SomeExternalClient({baseURL: addr});
        });
    });

    it("should use external client configured with server address", async () => {
        const result = await externalClient.callApi();
        assert.ok(result);
    });
});
```

## Lifecycle

-   **afterStart**: Builds `http://localhost:<port>` from the running server and stores it
-   **beforeTests**: Invokes all registered consumers with the computed address

## API

### `useAddress(consumer: (address: string) => void)`

Registers a consumer function that will be called with the server address before tests run.

**Parameters:**

-   `consumer`: A callback function that receives the server base URL

**Returns:** `void`

**Notes:**

-   Multiple consumers can be registered
-   Consumers are invoked in registration order
-   All consumers receive the same address value

## Best Practices

-   Use `useAddress` when third-party tools need early server URL initialization
-   Prefer `HttpClientHook` or `SupertestHook` for standard HTTP testing (they use `AddressHook` internally)
-   Capture the address in an outer scope variable if needed across multiple tests
-   Keep consumer logic minimal - complex setup should be done elsewhere

## Troubleshooting

**Address not available in tests:**

-   Ensure you're accessing the captured variable after the setup phase completes
-   Verify the server started successfully

**Consumer not invoked:**

-   Confirm `useAddress` is called in the setup phase (second argument to `useNodeBoot`)
-   Check that the describe block is actually executed
