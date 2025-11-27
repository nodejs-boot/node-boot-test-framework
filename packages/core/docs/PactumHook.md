# PactumHook

The `PactumHook` integrates the Pactum HTTP testing library with NodeBoot, automatically setting the base URL and request timeout. Pactum provides a fluent, behavior-driven API for HTTP testing with powerful assertion capabilities.

## Purpose

Pactum is a popular REST API testing library with a clean, expressive syntax. `PactumHook` seamlessly integrates it with NodeBoot by auto-configuring the base URL and timeouts, making it easy to write readable HTTP tests.

## Features

-   **Automatic Base URL**: Auto-sets Pactum base URL to your application's address
-   **Custom URLs**: Support for testing external services
-   **Timeout Configuration**: Default 15-second timeout for requests
-   **Fluent API**: Chain assertions for readable tests
-   **Powerful Assertions**: Rich set of expectation methods
-   **Automatic Cleanup**: Base URL cleared after tests

## Installation

```bash
pnpm add -D pactum
```

## Basic Usage

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Basic Usage", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum(); // Auto-configures Pactum with app URL
    });

    it("should make GET request", async () => {
        await spec().get("/health").expectStatus(200);
    });

    it("should make POST request", async () => {
        await spec()
            .post("/api/users")
            .withJson({
                name: "Alice",
                email: "alice@example.com",
            })
            .expectStatus(201)
            .expectJsonLike({
                name: "Alice",
            });
    });
});
```

## HTTP Methods

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - HTTP Methods", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should support GET", async () => {
        await spec().get("/api/users").expectStatus(200);
    });

    it("should support POST", async () => {
        await spec().post("/api/users").withJson({name: "Bob"}).expectStatus(201);
    });

    it("should support PUT", async () => {
        await spec().put("/api/users/1").withJson({name: "Updated"}).expectStatus(200);
    });

    it("should support PATCH", async () => {
        await spec().patch("/api/users/1").withJson({email: "new@example.com"}).expectStatus(200);
    });

    it("should support DELETE", async () => {
        await spec().delete("/api/users/1").expectStatus(204);
    });
});
```

## Response Assertions

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Response Assertions", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should assert status code", async () => {
        await spec().get("/api/users").expectStatus(200);
    });

    it("should assert exact JSON", async () => {
        await spec().get("/api/users/1").expectJson({
            id: 1,
            name: "Alice",
            email: "alice@example.com",
        });
    });

    it("should assert partial JSON match", async () => {
        await spec().get("/api/users/1").expectJsonLike({
            name: "Alice", // Other fields ignored
        });
    });

    it("should assert JSON schema", async () => {
        await spec()
            .get("/api/users/1")
            .expectJsonSchema({
                type: "object",
                properties: {
                    id: {type: "number"},
                    name: {type: "string"},
                    email: {type: "string"},
                },
                required: ["id", "name", "email"],
            });
    });

    it("should assert headers", async () => {
        await spec().get("/api/users").expectHeader("content-type", "application/json");
    });

    it("should assert response time", async () => {
        await spec().get("/api/users").expectResponseTime(1000); // < 1 second
    });
});
```

## Request Configuration

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Request Config", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should send custom headers", async () => {
        await spec()
            .get("/api/users")
            .withHeaders({
                Authorization: "Bearer token123",
                "X-Custom-Header": "value",
            })
            .expectStatus(200);
    });

    it("should send query parameters", async () => {
        await spec()
            .get("/api/users")
            .withQueryParams({
                page: 1,
                limit: 10,
                sort: "name",
            })
            .expectStatus(200);
    });

    it("should send JSON body", async () => {
        await spec()
            .post("/api/users")
            .withJson({
                name: "Charlie",
                email: "charlie@example.com",
            })
            .expectStatus(201);
    });

    it("should send form data", async () => {
        await spec()
            .post("/api/upload")
            .withForm({
                username: "alice",
                password: "secret",
            })
            .expectStatus(200);
    });
});
```

## Extracting Response Data

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Extract Response", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should extract response body", async () => {
        const body = await spec().get("/api/users/1").expectStatus(200).returns("res.body");

        assert.ok(body);
        assert.strictEqual(body.id, 1);
    });

    it("should extract specific field", async () => {
        const userId = await spec().get("/api/users/1").expectStatus(200).returns("res.body.id");

        assert.strictEqual(userId, 1);
    });

    it("should use extracted data in next request", async () => {
        const user = await spec()
            .post("/api/users")
            .withJson({name: "Diana", email: "diana@example.com"})
            .expectStatus(201)
            .returns("res.body");

        await spec().get(`/api/users/${user.id}`).expectStatus(200).expectJsonLike({
            id: user.id,
            name: "Diana",
        });
    });
});
```

## Testing External Services

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - External Services", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum("https://api.external-service.com"); // Custom base URL
    });

    it("should test external API", async () => {
        await spec().get("/api/v1/status").expectStatus(200);
    });
});
```

## Error Handling

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Error Handling", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should handle 404 errors", async () => {
        await spec().get("/api/nonexistent").expectStatus(404);
    });

    it("should handle validation errors", async () => {
        await spec().post("/api/users").withJson({invalid: "data"}).expectStatus(400).expectJsonLike({
            error: "Validation failed",
        });
    });

    it("should handle server errors", async () => {
        await spec().get("/api/error").expectStatus(500);
    });
});
```

## Array Assertions

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Array Assertions", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should assert array length", async () => {
        await spec().get("/api/users").expectJsonLength(5); // Exactly 5 items
    });

    it("should assert array contains", async () => {
        await spec()
            .get("/api/users")
            .expectJsonLike([
                {name: "Alice"}, // Array must contain this object
            ]);
    });

    it("should assert all array items match pattern", async () => {
        await spec()
            .get("/api/users")
            .expectJsonMatch({
                $: [{id: /\d+/, name: /\w+/}],
            });
    });
});
```

## Workflow Testing

```typescript
import {describe, it} from "node:test";
import {spec} from "pactum";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("PactumHook - Workflow Testing", () => {
    const {} = useNodeBoot(EmptyApp, ({usePactum}) => {
        usePactum();
    });

    it("should test complete user workflow", async () => {
        // Create user
        const user = await spec()
            .post("/api/users")
            .withJson({name: "Eve", email: "eve@example.com"})
            .expectStatus(201)
            .returns("res.body");

        // Retrieve user
        await spec().get(`/api/users/${user.id}`).expectStatus(200).expectJsonLike({
            id: user.id,
            name: "Eve",
        });

        // Update user
        await spec().put(`/api/users/${user.id}`).withJson({name: "Evelyn"}).expectStatus(200).expectJsonLike({
            name: "Evelyn",
        });

        // Delete user
        await spec().delete(`/api/users/${user.id}`).expectStatus(204);

        // Verify deletion
        await spec().get(`/api/users/${user.id}`).expectStatus(404);
    });
});
```

## Lifecycle

-   **afterStart**: Sets Pactum base URL (custom or app address) and default timeout (15000ms)
-   **afterTests**: Clears base URL to avoid cross-suite contamination

## API

### `usePactum(baseUrl?: string): void`

Configures Pactum with the application or custom base URL.

**Parameters:**

-   `baseUrl` (optional): Custom base URL. If omitted, uses NodeBoot application URL.

**Default Configuration:**

-   Base URL: Application address or provided URL
-   Timeout: 15000ms (15 seconds)

## Best Practices

-   **Fluent Assertions**: Chain expectations for readable tests
-   **Extract and Reuse**: Use `.returns()` to extract data for subsequent requests
-   **Specific Expectations**: Use `expectJsonLike` for partial matches
-   **Schema Validation**: Use `expectJsonSchema` for contract testing
-   **Workflow Tests**: Test complete flows in a single test
-   **Error Cases**: Test both happy and error paths

## Troubleshooting

**Requests go to wrong address:**

-   Ensure only one `usePactum` call per test suite
-   Last `usePactum` call sets the base URL
-   Verify the base URL with a simple health check test

**Timeout errors:**

-   Default timeout is 15 seconds
-   Increase timeout with `.withRequestTimeout(ms)` on spec
-   Check if endpoint is actually slow or hanging

**Assertions failing:**

-   Use `.inspect()` to debug request/response
-   Check exact vs partial match expectations
-   Verify JSON structure matches expectations

**Base URL not reset:**

-   Framework automatically clears base URL after tests
-   Ensure tests complete successfully without errors
