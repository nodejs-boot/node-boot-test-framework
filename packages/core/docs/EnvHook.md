# EnvHook

The `EnvHook` sets environment variables for the duration of the test suite and automatically restores the original values afterward. This enables safe, isolated testing with custom environment configurations.

## Purpose

Tests often need specific environment variables (feature flags, API URLs, credentials) without permanently modifying the process environment. `EnvHook` provides automatic environment variable management with cleanup, ensuring tests don't interfere with each other or the development environment.

## Features

-   **Automatic Restoration**: Original environment variables are restored after tests complete
-   **Merge Support**: Multiple calls merge together; later values override earlier ones
-   **Suite-Wide Scope**: Environment variables apply to all tests in the suite
-   **Safe Isolation**: No risk of polluting global environment

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Basic Usage", () => {
    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({
            NODE_ENV: "test",
            API_URL: "http://test.example.com",
        });
    });

    it("should have environment variables set", () => {
        assert.strictEqual(process.env.NODE_ENV, "test");
        assert.strictEqual(process.env.API_URL, "http://test.example.com");
    });

    it("should persist across tests in same suite", () => {
        assert.strictEqual(process.env.NODE_ENV, "test");
        assert.strictEqual(process.env.API_URL, "http://test.example.com");
    });
});
```

## Feature Flags via Environment

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Feature Flags", () => {
    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({
            FEATURE_FLAG: "true",
            ENABLE_BETA: "true",
            ENABLE_ANALYTICS: "false",
        });
    });

    it("should enable/disable features via env vars", () => {
        assert.strictEqual(process.env.FEATURE_FLAG, "true");
        assert.strictEqual(process.env.ENABLE_BETA, "true");
        assert.strictEqual(process.env.ENABLE_ANALYTICS, "false");
    });
});
```

## Multiple Environment Merges

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Multiple Merges", () => {
    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({NODE_ENV: "test"});
        useEnv({API_URL: "http://api.test"}); // Merges with previous
        useEnv({LOG_LEVEL: "debug"}); // Merges with previous
    });

    it("should merge all environment variable calls", () => {
        assert.strictEqual(process.env.NODE_ENV, "test");
        assert.strictEqual(process.env.API_URL, "http://api.test");
        assert.strictEqual(process.env.LOG_LEVEL, "debug");
    });
});
```

## External Service Configuration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - External Services", () => {
    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({
            DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
            REDIS_URL: "redis://localhost:6379",
            AWS_REGION: "us-east-1",
            AWS_ACCESS_KEY_ID: "test-key",
            AWS_SECRET_ACCESS_KEY: "test-secret",
        });
    });

    it("should configure external service connections", () => {
        assert.ok(process.env.DATABASE_URL?.includes("testdb"));
        assert.ok(process.env.REDIS_URL?.includes("6379"));
        assert.strictEqual(process.env.AWS_REGION, "us-east-1");
    });
});
```

## Override Existing Variables

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Override Existing", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({
            NODE_ENV: "test-override",
            PATH: "/test/path", // Override even system variables
        });
    });

    it("should override existing environment variables", () => {
        assert.strictEqual(process.env.NODE_ENV, "test-override");
        assert.strictEqual(process.env.PATH, "/test/path");
    });

    // After suite completes, original values are restored automatically
});
```

## Test Credentials

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Test Credentials", () => {
    const {useEnv} = useNodeBoot(EmptyApp, ({useEnv}) => {
        useEnv({
            API_KEY: "test-api-key-12345",
            JWT_SECRET: "test-jwt-secret",
            ENCRYPTION_KEY: "test-encryption-key",
        });
    });

    it("should use test credentials", () => {
        assert.strictEqual(process.env.API_KEY, "test-api-key-12345");
        assert.strictEqual(process.env.JWT_SECRET, "test-jwt-secret");
        assert.ok(process.env.ENCRYPTION_KEY);
    });
});
```

## Combined with Config Hook

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("EnvHook - Combined with Config", () => {
    const {useEnv, useConfig} = useNodeBoot(EmptyApp, ({useEnv, useConfig}) => {
        useEnv({
            NODE_ENV: "test",
            DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
        });

        useConfig({
            app: {port: 3500},
            logging: {level: "debug"},
        });
    });

    it("should have both env vars and config set", () => {
        assert.strictEqual(process.env.NODE_ENV, "test");
        assert.ok(process.env.DATABASE_URL);

        const config = useConfig();
        assert.strictEqual(config.app.port, 3500);
    });
});
```

## Lifecycle

-   **afterStart**: Snapshots the original `process.env` state
-   **beforeTests**: Applies all accumulated environment variables
-   **afterTests**: Restores the original environment object

## API

### `useEnv(variables: Record<string, string>): void`

Sets environment variables for the test suite duration.

**Parameters:**

-   `variables`: An object containing environment variable key-value pairs

**Notes:**

-   Can be called multiple times; values merge together
-   Later calls override earlier values for the same keys
-   Changes apply suite-wide, not per-test
-   Original values automatically restored after tests

## Best Practices

-   **Minimal Variables**: Only set environment variables required for tests
-   **Avoid Global Pollution**: Don't set sensitive system variables unless necessary
-   **Test Isolation**: Each test suite should set its own environment needs
-   **Per-Test Changes**: For per-test environment changes, manage manually in the test rather than using the hook (this hook is suite-wide)
-   **String Values**: Environment variables are always strings; convert as needed in application code

## Troubleshooting

**Variable not restored after tests:**

-   Ensure no test directly mutates `process.env` object references
-   Use assignment: `process.env.KEY = value` rather than object replacement
-   Verify tests complete successfully without crashing

**Variable not available in tests:**

-   Confirm `useEnv` is called in the setup phase (second argument to `useNodeBoot`)
-   Check that the describe block executes before tests run
-   Verify the variable name spelling

**Conflicts with application code:**

-   Application code reading env vars during module load may miss test values
-   Ensure application reads env vars after `beforeTests` lifecycle phase
-   Consider using `ConfigHook` for application-level configuration instead
