# SupertestHook

The `SupertestHook` provides a Supertest agent bound to the NodeBoot HTTP server for endpoint testing. Supertest is a popular HTTP assertion library that offers precise expectations for status codes, headers, and response bodies.

## Purpose

Supertest provides a proven, reliable API for testing HTTP endpoints with built-in assertions. `SupertestHook` integrates it seamlessly with NodeBoot by binding it directly to your application's HTTP server.

## Features

-   **Direct Server Binding**: Binds Supertest directly to NodeBoot's HTTP server
-   **Built-in Assertions**: Rich assertion API for status, headers, and body
-   **Chainable API**: Fluent interface for readable tests
-   **No Network Overhead**: Tests run without actual network calls
-   **Automatic Cleanup**: Resources released after tests

## Installation

Supertest is typically included with the testing framework, but you can explicitly install it:

```bash
pnpm add -D supertest @types/supertest
```

## Basic Usage

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Basic Usage", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest(); // Activate the hook
    });

    it("should make GET request", async () => {
        const request = useSupertest();
        await request.get("/health").expect(200);
    });

    it("should make POST request", async () => {
        const request = useSupertest();
        await request
            .post("/api/users")
            .send({
                name: "Alice",
                email: "alice@example.com",
            })
            .expect(201)
            .expect("Content-Type", /json/);
    });
});
```

## HTTP Methods

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - HTTP Methods", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should support GET", async () => {
        const request = useSupertest();
        await request.get("/api/users").expect(200);
    });

    it("should support POST", async () => {
        const request = useSupertest();
        await request.post("/api/users").send({name: "Bob"}).expect(201);
    });

    it("should support PUT", async () => {
        const request = useSupertest();
        await request.put("/api/users/1").send({name: "Updated"}).expect(200);
    });

    it("should support PATCH", async () => {
        const request = useSupertest();
        await request.patch("/api/users/1").send({email: "new@example.com"}).expect(200);
    });

    it("should support DELETE", async () => {
        const request = useSupertest();
        await request.delete("/api/users/1").expect(204);
    });
});
```

## Status Code Assertions

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Status Assertions", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should assert 200 OK", async () => {
        const request = useSupertest();
        await request.get("/api/users").expect(200);
    });

    it("should assert 201 Created", async () => {
        const request = useSupertest();
        await request.post("/api/users").send({name: "Charlie"}).expect(201);
    });

    it("should assert 400 Bad Request", async () => {
        const request = useSupertest();
        await request.post("/api/users").send({invalid: "data"}).expect(400);
    });

    it("should assert 404 Not Found", async () => {
        const request = useSupertest();
        await request.get("/api/users/999").expect(404);
    });
});
```

## Header Assertions

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Header Assertions", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should assert content-type header", async () => {
        const request = useSupertest();
        await request.get("/api/users").expect("Content-Type", /json/).expect(200);
    });

    it("should assert custom headers", async () => {
        const request = useSupertest();
        await request.get("/api/users").expect("X-API-Version", "1.0").expect(200);
    });

    it("should send custom headers", async () => {
        const request = useSupertest();
        await request
            .get("/api/users")
            .set("Authorization", "Bearer token123")
            .set("X-Custom-Header", "value")
            .expect(200);
    });
});
```

## Body Assertions

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Body Assertions", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should assert exact body", async () => {
        const request = useSupertest();
        await request.get("/api/users/1").expect(200).expect({
            id: 1,
            name: "Alice",
            email: "alice@example.com",
        });
    });

    it("should assert partial body with function", async () => {
        const request = useSupertest();
        await request
            .get("/api/users/1")
            .expect(200)
            .expect(res => {
                assert.strictEqual(res.body.name, "Alice");
                assert.ok(res.body.id);
            });
    });

    it("should assert body contains field", async () => {
        const request = useSupertest();
        await request
            .get("/api/users/1")
            .expect(200)
            .expect(res => {
                assert.ok(res.body.hasOwnProperty("email"));
            });
    });
});
```

## Query Parameters

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Query Parameters", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should send query parameters", async () => {
        const request = useSupertest();
        await request.get("/api/users").query({page: 1, limit: 10, sort: "name"}).expect(200);
    });

    it("should send multiple query params", async () => {
        const request = useSupertest();
        await request.get("/api/search").query({q: "test", category: "users", active: true}).expect(200);
    });
});
```

## Sending Different Content Types

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Content Types", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should send JSON", async () => {
        const request = useSupertest();
        await request
            .post("/api/users")
            .send({name: "Diana", email: "diana@example.com"})
            .set("Content-Type", "application/json")
            .expect(201);
    });

    it("should send form data", async () => {
        const request = useSupertest();
        await request.post("/api/login").type("form").send({username: "alice", password: "secret"}).expect(200);
    });

    it("should send plain text", async () => {
        const request = useSupertest();
        await request.post("/api/notes").type("text").send("This is a plain text note").expect(201);
    });
});
```

## Chaining Multiple Assertions

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Chaining Assertions", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should chain multiple expectations", async () => {
        const request = useSupertest();
        await request
            .post("/api/users")
            .send({name: "Eve", email: "eve@example.com"})
            .expect(201)
            .expect("Content-Type", /json/)
            .expect(res => {
                assert.ok(res.body.id);
                assert.strictEqual(res.body.name, "Eve");
            });
    });
});
```

## Testing File Uploads

```typescript
import {describe, it} from "node:test";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import * as path from "path";

describe("SupertestHook - File Upload", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should upload file", async () => {
        const request = useSupertest();
        await request
            .post("/api/upload")
            .attach("file", path.join(__dirname, "../fixtures/test-file.txt"))
            .field("description", "Test file upload")
            .expect(200);
    });
});
```

## Complete Workflow Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Workflow", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should test complete user CRUD flow", async () => {
        const request = useSupertest();

        // Create
        const createRes = await request
            .post("/api/users")
            .send({name: "Frank", email: "frank@example.com"})
            .expect(201);

        const userId = createRes.body.id;
        assert.ok(userId);

        // Read
        await request.get(`/api/users/${userId}`).expect(200).expect({
            id: userId,
            name: "Frank",
            email: "frank@example.com",
        });

        // Update
        await request.put(`/api/users/${userId}`).send({name: "Franklin"}).expect(200);

        // Verify Update
        const getRes = await request.get(`/api/users/${userId}`).expect(200);
        assert.strictEqual(getRes.body.name, "Franklin");

        // Delete
        await request.delete(`/api/users/${userId}`).expect(204);

        // Verify Deletion
        await request.get(`/api/users/${userId}`).expect(404);
    });
});
```

## Error Response Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("SupertestHook - Error Testing", () => {
    const {useSupertest} = useNodeBoot(EmptyApp, ({useSupertest}) => {
        useSupertest();
    });

    it("should handle validation errors", async () => {
        const request = useSupertest();
        await request
            .post("/api/users")
            .send({invalid: "data"})
            .expect(400)
            .expect(res => {
                assert.ok(res.body.error);
                assert.ok(res.body.message.includes("validation"));
            });
    });

    it("should handle not found errors", async () => {
        const request = useSupertest();
        await request.get("/api/users/999999").expect(404);
    });
});
```

## Lifecycle

-   **afterStart**: Stores `NodeBootAppView` and its HTTP server
-   **afterTests**: Resets reference to release resources

## API

### `useSupertest(): TestAgent`

Returns a Supertest TestAgent bound to the NodeBoot HTTP server.

**Returns:** Supertest `TestAgent` instance

**Throws:** Error if server is not available (app not started)

## Best Practices

-   **Precise Assertions**: Supertest is ideal for precise HTTP assertions (status, headers, body)
-   **Chain Expectations**: Chain multiple `.expect()` calls for comprehensive validation
-   **Function Assertions**: Use `.expect((res) => {...})` for complex assertions
-   **Workflow Tests**: Test complete request/response flows in a single test
-   **Error Testing**: Test both successful and error responses
-   **Direct Server Access**: No network overhead - tests run fast

## Troubleshooting

**Error: "Server not available"**

-   Ensure hook is registered in setup phase (second argument to `useNodeBoot`)
-   Verify the application started successfully
-   Check that `useSupertest()` is called inside a test, not during setup

**Assertions failing:**

-   Use `.expect((res) => console.log(res.body))` to debug responses
-   Check exact vs partial match requirements
-   Verify response structure matches expectations

**Timeout errors:**

-   Supertest has built-in timeouts
-   Check if endpoint is actually slow or hanging
-   Verify application is processing requests

**Headers not matching:**

-   Remember header matching can use strings or regex
-   Case sensitivity matters for header names
-   Use `.expect((res) => console.log(res.headers))` to debug
