# RepositoryHook

The `RepositoryHook` retrieves IoC-managed data repository instances decorated with `@SDataRepository`. This enables direct interaction with data access layers during integration testing, allowing you to verify persistence logic, query operations, and database interactions.

## Purpose

Integration tests need to interact with repositories to verify data persistence, retrieval, and manipulation. `RepositoryHook` provides type-safe access to repository instances from the IoC container, enabling you to test data access patterns and database operations.

## Features

-   **Type-Safe Access**: Get fully-typed repository instances from the IoC container
-   **IoC Integration**: Works with the application's dependency injection container
-   **Decorator Validation**: Ensures classes are properly decorated with `@SDataRepository`
-   **Real Database**: Repositories use actual database connections (or test databases)

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserRepository} from "../src/repositories/UserRepository";

describe("RepositoryHook - Basic Usage", () => {
    const {useRepository} = useNodeBoot(EmptyApp, () => {
        // No setup required for basic repository access
    });

    it("should retrieve repository instance", () => {
        const userRepo = useRepository(UserRepository);
        assert.ok(userRepo);
        assert.ok(typeof userRepo.find === "function");
        assert.ok(typeof userRepo.save === "function");
    });

    it("should save and retrieve entity", async () => {
        const userRepo = useRepository(UserRepository);

        const saved = await userRepo.save({
            name: "Alice",
            email: "alice@example.com",
        });

        assert.ok(saved.id);
        assert.strictEqual(saved.name, "Alice");

        const found = await userRepo.findById(saved.id);
        assert.ok(found);
        assert.strictEqual(found.name, "Alice");
    });
});
```

## CRUD Operations

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserRepository} from "../src/repositories/UserRepository";

describe("RepositoryHook - CRUD Operations", () => {
    const {useRepository} = useNodeBoot(EmptyApp, () => {});

    it("should perform create operation", async () => {
        const userRepo = useRepository(UserRepository);

        const user = await userRepo.create({
            name: "Bob",
            email: "bob@example.com",
            age: 30,
        });

        assert.ok(user.id);
        assert.strictEqual(user.name, "Bob");
    });

    it("should perform read operations", async () => {
        const userRepo = useRepository(UserRepository);

        // Create test data
        await userRepo.save({name: "Charlie", email: "charlie@example.com"});
        await userRepo.save({name: "Diana", email: "diana@example.com"});

        // Find all
        const allUsers = await userRepo.find({});
        assert.ok(allUsers.length >= 2);

        // Find with filter
        const charlie = await userRepo.findOne({name: "Charlie"});
        assert.ok(charlie);
        assert.strictEqual(charlie.name, "Charlie");
    });

    it("should perform update operation", async () => {
        const userRepo = useRepository(UserRepository);

        const user = await userRepo.save({
            name: "Eve",
            email: "eve@example.com",
        });

        const updated = await userRepo.update(user.id, {name: "Evelyn"});
        assert.strictEqual(updated?.name, "Evelyn");
    });

    it("should perform delete operation", async () => {
        const userRepo = useRepository(UserRepository);

        const user = await userRepo.save({
            name: "Frank",
            email: "frank@example.com",
        });

        await userRepo.delete(user.id);
        const deleted = await userRepo.findById(user.id);
        assert.strictEqual(deleted, null);
    });
});
```

## Query Operations

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserRepository} from "../src/repositories/UserRepository";

describe("RepositoryHook - Query Operations", () => {
    const {useRepository} = useNodeBoot(EmptyApp, () => {});

    it("should filter by criteria", async () => {
        const userRepo = useRepository(UserRepository);

        await userRepo.save({name: "Alice", email: "alice@example.com", age: 25});
        await userRepo.save({name: "Bob", email: "bob@example.com", age: 30});
        await userRepo.save({name: "Charlie", email: "charlie@example.com", age: 25});

        const users25 = await userRepo.find({age: 25});
        assert.strictEqual(users25.length, 2);
    });

    it("should support pagination", async () => {
        const userRepo = useRepository(UserRepository);

        // Create test data
        for (let i = 1; i <= 10; i++) {
            await userRepo.save({name: `User${i}`, email: `user${i}@example.com`});
        }

        const page1 = await userRepo.find({}, {limit: 5, offset: 0});
        const page2 = await userRepo.find({}, {limit: 5, offset: 5});

        assert.strictEqual(page1.length, 5);
        assert.strictEqual(page2.length, 5);
    });

    it("should support sorting", async () => {
        const userRepo = useRepository(UserRepository);

        await userRepo.save({name: "Zara", email: "zara@example.com"});
        await userRepo.save({name: "Alice", email: "alice@example.com"});
        await userRepo.save({name: "Mike", email: "mike@example.com"});

        const sorted = await userRepo.find({}, {sort: {name: 1}});
        assert.strictEqual(sorted[0].name, "Alice");
        assert.strictEqual(sorted[sorted.length - 1].name, "Zara");
    });
});
```

## Combined with Service Hook

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserRepository} from "../src/repositories/UserRepository";
import {UserService} from "../src/services/UserService";

describe("RepositoryHook - With Service", () => {
    const {useRepository, useService} = useNodeBoot(EmptyApp, () => {});

    it("should verify service-repository interaction", async () => {
        const userService = useService(UserService);
        const userRepo = useRepository(UserRepository);

        // Service creates user (internally uses repository)
        const created = await userService.createUser({
            name: "Grace",
            email: "grace@example.com",
        });

        // Verify directly via repository
        const found = await userRepo.findById(created.id);
        assert.ok(found);
        assert.strictEqual(found.name, "Grace");
    });
});
```

## Transaction Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {UserRepository} from "../src/repositories/UserRepository";

describe("RepositoryHook - Transactions", () => {
    const {useRepository} = useNodeBoot(EmptyApp, () => {});

    it("should commit successful transaction", async () => {
        const userRepo = useRepository(UserRepository);

        await userRepo.transaction(async session => {
            await userRepo.save({name: "Harry", email: "harry@example.com"}, {session});
            await userRepo.save({name: "Iris", email: "iris@example.com"}, {session});
        });

        const users = await userRepo.find({});
        assert.ok(users.some(u => u.name === "Harry"));
        assert.ok(users.some(u => u.name === "Iris"));
    });

    it("should rollback failed transaction", async () => {
        const userRepo = useRepository(UserRepository);

        const initialCount = (await userRepo.find({})).length;

        await assert.rejects(async () => {
            await userRepo.transaction(async session => {
                await userRepo.save({name: "Jack", email: "jack@example.com"}, {session});
                throw new Error("Rollback!");
            });
        });

        const finalCount = (await userRepo.find({})).length;
        assert.strictEqual(finalCount, initialCount);
    });
});
```

## Validation

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {NotARepository} from "../src/utils/NotARepository";

describe("RepositoryHook - Validation", () => {
    const {useRepository} = useNodeBoot(EmptyApp, () => {});

    it("should throw for non-repository classes", () => {
        assert.throws(
            () => {
                useRepository(NotARepository);
            },
            {message: /not decorated with @SDataRepository/i},
        );
    });
});
```

## API

### `useRepository<T>(RepositoryClass: Class<T>): T`

Retrieves a repository instance from the IoC container.

**Parameters:**

-   `RepositoryClass`: The repository class decorated with `@SDataRepository`

**Returns:** The repository instance with all dependencies injected

**Throws:**

-   Error if the class is not decorated with `@SDataRepository`
-   Error if the repository is not found in the IoC container

## Best Practices

-   **Data-Focused Testing**: Use repositories for testing data access patterns and persistence logic
-   **Service Layer Preferred**: For domain logic tests, prefer testing through services
-   **Integration Tests**: Repository tests should always be integration tests with real (or in-memory) databases
-   **Cleanup**: Use cleanup hooks or transactions to ensure test isolation
-   **Direct Access Sparingly**: Access repositories directly only for focused data tests; otherwise test through services
-   **Type Safety**: Leverage TypeScript types for compile-time safety

## Troubleshooting

**Error: "not decorated with @SDataRepository"**

-   Ensure the class has the `@SDataRepository()` decorator
-   Verify `reflect-metadata` is imported at the top of your test file
-   Check that the decorator import is correct: `import {SDataRepository} from "@nodeboot/data"`
-   Ensure the build step preserved TypeScript metadata

**Repository instance not found:**

-   Verify the repository is registered in the application module
-   Ensure the application has fully bootstrapped before calling `useRepository`
-   Check that `useRepository` is called inside a test, not during setup

**Database connection errors:**

-   Verify database configuration in test setup
-   Check that test database is running and accessible
-   Use in-memory databases for faster, isolated tests

**Data persistence issues:**

-   Ensure transactions are committed properly
-   Verify database schema matches entity definitions
-   Check for database constraints and validation rules
