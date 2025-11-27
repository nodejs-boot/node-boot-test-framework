# HttpClientHook

The `HttpClientHook` provides cached Axios HTTP clients bound to the NodeBoot server address or custom base URLs. This enables making HTTP requests to your application during tests with automatic client management and connection pooling.

## Purpose

Integration tests often need to make HTTP requests to the application under test. `HttpClientHook` provides pre-configured Axios instances with automatic base URL management, connection pooling, and cleanup.

## Features

-   **Auto-Configured Client**: Automatically creates client for application URL
-   **Custom Base URLs**: Support for multiple clients with different base URLs
-   **Connection Pooling**: Reuses client instances for efficiency
-   **Automatic Cleanup**: Clears client cache after tests
-   **Axios Instance**: Full Axios API with interceptors, config, etc.

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Basic Usage", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, ({useHttpClient}) => {
        useHttpClient(); // Optional: pre-initialize client for app
    });

    it("should make GET request to application", async () => {
        const http = useHttpClient();
        const res = await http.get("/health");

        assert.strictEqual(res.status, 200);
        assert.ok(res.data);
    });

    it("should make POST request", async () => {
        const http = useHttpClient();
        const res = await http.post("/api/users", {
            name: "Alice",
            email: "alice@example.com",
        });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.name, "Alice");
    });
});
```

## HTTP Methods

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - HTTP Methods", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should support GET requests", async () => {
        const http = useHttpClient();
        const res = await http.get("/api/users");
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    it("should support POST requests", async () => {
        const http = useHttpClient();
        const res = await http.post("/api/users", {
            name: "Bob",
            email: "bob@example.com",
        });
        assert.strictEqual(res.status, 201);
    });

    it("should support PUT requests", async () => {
        const http = useHttpClient();
        const res = await http.put("/api/users/1", {
            name: "Updated Name",
        });
        assert.strictEqual(res.status, 200);
    });

    it("should support PATCH requests", async () => {
        const http = useHttpClient();
        const res = await http.patch("/api/users/1", {
            email: "new@example.com",
        });
        assert.strictEqual(res.status, 200);
    });

    it("should support DELETE requests", async () => {
        const http = useHttpClient();
        const res = await http.delete("/api/users/1");
        assert.strictEqual(res.status, 204);
    });
});
```

## Request Configuration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Request Config", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should send custom headers", async () => {
        const http = useHttpClient();
        const res = await http.get("/api/users", {
            headers: {
                "X-Custom-Header": "test-value",
                Authorization: "Bearer token123",
            },
        });
        assert.strictEqual(res.status, 200);
    });

    it("should send query parameters", async () => {
        const http = useHttpClient();
        const res = await http.get("/api/users", {
            params: {
                page: 1,
                limit: 10,
                sort: "name",
            },
        });
        assert.strictEqual(res.status, 200);
    });

    it("should set timeout", async () => {
        const http = useHttpClient();
        await assert.rejects(
            async () => {
                await http.get("/api/slow-endpoint", {timeout: 100});
            },
            {message: /timeout/i},
        );
    });
});
```

## Custom Base URL

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Custom Base URL", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should create client for external API", async () => {
        const externalApi = useHttpClient("https://api.example.com");
        // Makes request to https://api.example.com/users
        const res = await externalApi.get("/users");
        assert.ok(res.status);
    });

    it("should maintain separate clients", async () => {
        const appClient = useHttpClient(); // Application client
        const externalClient = useHttpClient("https://external.com"); // External client

        // Each client has its own base URL
        const appRes = await appClient.get("/health");
        const extRes = await externalClient.get("/status");

        assert.ok(appRes.data);
        assert.ok(extRes.data);
    });
});
```

## Interceptors

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Interceptors", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should add request interceptor", async () => {
        const http = useHttpClient();

        // Add request interceptor
        http.interceptors.request.use(config => {
            config.headers["X-Request-Time"] = Date.now().toString();
            return config;
        });

        const res = await http.get("/api/users");
        assert.strictEqual(res.status, 200);
    });

    it("should add response interceptor", async () => {
        const http = useHttpClient();

        const responses: number[] = [];
        http.interceptors.response.use(response => {
            responses.push(response.status);
            return response;
        });

        await http.get("/api/users");
        await http.get("/api/products");

        assert.strictEqual(responses.length, 2);
        assert.ok(responses.every(s => s === 200));
    });
});
```

## Error Handling

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Error Handling", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should handle 404 errors", async () => {
        const http = useHttpClient();

        await assert.rejects(
            async () => {
                await http.get("/api/nonexistent");
            },
            (error: any) => {
                assert.strictEqual(error.response?.status, 404);
                return true;
            },
        );
    });

    it("should handle validation errors", async () => {
        const http = useHttpClient();

        await assert.rejects(
            async () => {
                await http.post("/api/users", {invalid: "data"});
            },
            (error: any) => {
                assert.strictEqual(error.response?.status, 400);
                return true;
            },
        );
    });

    it("should handle network errors gracefully", async () => {
        const http = useHttpClient("http://localhost:99999");

        await assert.rejects(async () => {
            await http.get("/");
        });
    });
});
```

## Response Inspection

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HttpClientHook - Response Inspection", () => {
    const {useHttpClient} = useNodeBoot(EmptyApp, () => {});

    it("should inspect response data", async () => {
        const http = useHttpClient();
        const res = await http.get("/api/users");

        assert.ok(res.data);
        assert.ok(Array.isArray(res.data));
    });

    it("should inspect response headers", async () => {
        const http = useHttpClient();
        const res = await http.get("/api/users");

        assert.ok(res.headers);
        assert.ok(res.headers["content-type"]);
    });

    it("should inspect response status", async () => {
        const http = useHttpClient();
        const res = await http.post("/api/users", {
            name: "Charlie",
            email: "charlie@example.com",
        });

        assert.strictEqual(res.status, 201);
        assert.ok(res.statusText);
    });
});
```

## Lifecycle

-   **afterStart**: Creates default client for app address and caches it
-   **afterTests**: Clears client cache

## API

### `useHttpClient(baseURL?: string): AxiosInstance`

Creates or retrieves a cached Axios HTTP client.

**Parameters:**

-   `baseURL` (optional): Custom base URL for the client. If omitted, uses application URL.

**Returns:** Axios instance configured with the specified base URL

**Default Client Configuration:**

-   `timeout: 15000` (15 seconds)
-   `Content-Type: application/json`
-   Automatic base URL resolution

## Best Practices

-   **Reuse Clients**: Use the same client instance for connection pooling
-   **Custom Clients**: Create separate clients for different base URLs
-   **Interceptors**: Add interceptors in setup phase for consistent behavior
-   **Error Handling**: Always handle potential HTTP errors in tests
-   **Prefer Higher-Level Hooks**: Consider `SupertestHook` or `PactumHook` for more testing-focused APIs

## Troubleshooting

**Error: "No HTTP client instance available"**

-   Server hasn't started yet; ensure you're calling `useHttpClient` inside a test
-   No custom base URL provided and app not running

**Connection refused:**

-   Verify the application started successfully
-   Check the port configuration
-   Ensure no firewall blocking localhost connections

**Timeout errors:**

-   Increase timeout in request config
-   Check if the endpoint is genuinely slow
-   Verify the server is responding

**Unexpected base URL:**

-   Check which client instance you're using
-   Verify base URL passed to `useHttpClient`
-   Remember that different base URLs create different cached instances
