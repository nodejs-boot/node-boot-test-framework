# ConfigHook

The `ConfigHook` allows you to augment and access application configuration before NodeBoot starts. It enables merging test-specific configuration overrides into your application's config, making it easy to customize behavior for different test scenarios.

## Purpose

Tests often need to override configuration values (ports, database URLs, feature flags) without modifying the application's default config files. `ConfigHook` provides a clean way to inject test-specific configuration that gets merged into the application's config before startup.

## Features

-   **Configuration Merging**: Shallow merge of test config into application config
-   **Multiple Overrides**: Register multiple config objects that merge together
-   **Type-Safe Access**: Retrieve merged config in tests via IoC container
-   **Pre-Boot Injection**: Config is available before application starts

## Basic Usage

### Setting Configuration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Basic Usage", () => {
    const {useConfig} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            app: {port: 3100},
            featureFlags: {beta: true},
        });
    });

    it("should override configuration for tests", () => {
        const config = useConfig();
        assert.strictEqual(config.app.port, 3100);
        assert.strictEqual(config.featureFlags.beta, true);
    });
});
```

### Merging Multiple Configurations

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Multiple Merges", () => {
    const {useConfig} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({app: {port: 3100}});
        useConfig({logging: {level: "debug"}}); // Merges with previous
        useConfig({featureFlags: {beta: true}}); // Merges with previous
    });

    it("should merge all configuration objects", () => {
        const config = useConfig();
        assert.strictEqual(config.app.port, 3100);
        assert.strictEqual(config.logging.level, "debug");
        assert.strictEqual(config.featureFlags.beta, true);
    });
});
```

## Test-Specific Configuration

### Database Configuration Override

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Database Config", () => {
    const {useConfig} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            database: {
                host: "localhost",
                port: 5432,
                name: "test_db",
                user: "test_user",
                password: "test_pass",
            },
        });
    });

    it("should use test database configuration", () => {
        const config = useConfig();
        assert.strictEqual(config.database.name, "test_db");
        assert.strictEqual(config.database.user, "test_user");
    });
});
```

### Feature Flags for Testing

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Feature Flags", () => {
    const {useConfig, useService} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            features: {
                newUI: true,
                advancedSearch: false,
                betaFeatures: true,
            },
        });
    });

    it("should enable specific features for testing", () => {
        const config = useConfig();
        assert.strictEqual(config.features.newUI, true);
        assert.strictEqual(config.features.advancedSearch, false);
        assert.strictEqual(config.features.betaFeatures, true);
    });
});
```

### Port Configuration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Port Override", () => {
    const {useConfig} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            app: {
                port: 4200,
                host: "0.0.0.0",
            },
        });
    });

    it("should use custom port for test server", () => {
        const config = useConfig();
        assert.strictEqual(config.app.port, 4200);
        assert.strictEqual(config.app.host, "0.0.0.0");
    });
});
```

## Accessing Config in Tests

### Direct Config Access

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("ConfigHook - Access in Tests", () => {
    const {useConfig} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            apiKeys: {
                external: "test-key-123",
            },
        });
    });

    it("should access config values in test", () => {
        const config = useConfig();
        assert.ok(config.apiKeys);
        assert.strictEqual(config.apiKeys.external, "test-key-123");
    });

    it("should access same config across tests", () => {
        const config = useConfig();
        assert.strictEqual(config.apiKeys.external, "test-key-123");
    });
});
```

## Lifecycle

-   **beforeStart**: Merges all queued configuration objects into the test config
-   **afterStart**: Config is available via IoC container's `ConfigService`
-   **use()**: Fetches `ConfigService` from IoC container (throws if app not bootstrapped)

## API

### Registration Mode

`useConfig(partial: JsonObject): void`

Registers a partial configuration object to be merged before application starts.

**Parameters:**

-   `partial`: A JSON object containing configuration overrides

**Notes:**

-   Can be called multiple times
-   Later calls merge with earlier ones (shallow merge)
-   Keys in later calls override same keys from earlier calls

### Access Mode

`useConfig(): Config`

Retrieves the merged configuration from the IoC container (only available after app starts).

**Returns:** The complete merged configuration object

**Throws:** Error if called before application bootstrap completes

## Best Practices

-   **Minimal Overrides**: Only override configuration needed for the specific test scenario
-   **Complete Objects**: Provide complete objects for keys you change rather than deep mutation
-   **Consistent Setup**: Use same config pattern across similar test suites
-   **Avoid Sensitive Data**: Don't hardcode real credentials; use test-specific placeholders
-   **Type Safety**: Use TypeScript interfaces for your config structure

## Troubleshooting

**Error: "No Config found in the IOC container"**

-   The server hasn't started yet or setup phase hasn't completed
-   Ensure `useConfig()` (access mode) is called inside a test, not during setup
-   Verify the application started successfully

**Configuration not applied:**

-   Check that `useConfig(partial)` is called in the setup phase (second argument to `useNodeBoot`)
-   Verify the configuration keys match your application's config structure
-   Ensure shallow merge isn't being overridden by deeper application logic

**Unexpected config values:**

-   Remember that config merging is shallow; nested objects replace rather than merge
-   Later `useConfig` calls override earlier ones for the same keys
-   Check application's default config files for conflicting values
