# AppContextHook

The `AppContextHook` exposes the full `NodeBootAppView` (minus raw server) to tests for advanced introspection or custom instrumentation. This provides low-level access to the application context for scenarios not covered by higher-level hooks.

## Purpose

While most testing needs are covered by dedicated hooks (`useConfig`, `useService`, etc.), sometimes you need direct access to the application context for advanced scenarios like custom instrumentation, configuration inspection, or IoC container manipulation.

## Features

-   **Full Context Access**: Exposes complete `NodeBootAppView` object
-   **Consumer Pattern**: Allows registration of callbacks that receive the context
-   **Early Initialization**: Invokes consumers before tests begin
-   **Advanced Introspection**: Access to logger, configuration, IoC container, and more

## Basic Usage

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Basic Usage", () => {
    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            console.log("App started with port", ctx.appOptions.port);
        });
    });

    it("should have app context available", () => {
        // Context consumers are invoked before tests run
        assert.ok(true);
    });
});
```

## Inspecting Application Configuration

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Configuration Inspection", () => {
    let resolvedConfig: any;

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext, useConfig}) => {
        useConfig({app: {port: 4500}});

        useAppContext(ctx => {
            resolvedConfig = ctx.appOptions;
        });
    });

    it("should access resolved configuration", () => {
        assert.ok(resolvedConfig);
        assert.strictEqual(resolvedConfig.port, 4500);
    });
});
```

## Accessing Logger Instance

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Logger Access", () => {
    let logger: any;

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            logger = ctx.logger;
            logger.info("Custom test logger initialized");
        });
    });

    it("should have logger instance", () => {
        assert.ok(logger);
        assert.ok(typeof logger.info === "function");
        assert.ok(typeof logger.error === "function");
    });
});
```

## Inspecting IoC Container

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - IoC Container", () => {
    let containerInfo: any;

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            // Inspect registered services
            containerInfo = {
                hasContainer: !!ctx.container,
            };
        });
    });

    it("should access IoC container", () => {
        assert.ok(containerInfo.hasContainer);
    });
});
```

## Custom Instrumentation

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Custom Instrumentation", () => {
    const metrics = {
        startTime: 0,
        appName: "",
    };

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            metrics.startTime = Date.now();
            metrics.appName = ctx.appOptions.name || "NodeBoot App";

            // Custom instrumentation setup
            ctx.logger.info("Test instrumentation initialized");
        });
    });

    it("should have instrumentation data", () => {
        assert.ok(metrics.startTime > 0);
        assert.ok(metrics.appName);
    });
});
```

## Multiple Consumers

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Multiple Consumers", () => {
    const data = {
        logger: null as any,
        config: null as any,
    };

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            data.logger = ctx.logger;
        });

        useAppContext(ctx => {
            data.config = ctx.appOptions;
        });
    });

    it("should invoke all consumers", () => {
        assert.ok(data.logger);
        assert.ok(data.config);
    });
});
```

## Application Metadata

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - App Metadata", () => {
    let metadata: any;

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext, useConfig}) => {
        useConfig({
            app: {
                name: "Test Application",
                version: "1.0.0",
                environment: "test",
            },
        });

        useAppContext(ctx => {
            metadata = {
                name: ctx.appOptions.name,
                version: ctx.appOptions.version,
                env: ctx.appOptions.environment,
            };
        });
    });

    it("should access application metadata", () => {
        assert.strictEqual(metadata.name, "Test Application");
        assert.strictEqual(metadata.version, "1.0.0");
        assert.strictEqual(metadata.env, "test");
    });
});
```

## Advanced Use Case: Custom Test Reporter

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("AppContextHook - Custom Reporter", () => {
    class TestReporter {
        private logger: any;

        constructor(logger: any) {
            this.logger = logger;
        }

        report(event: string, data: any) {
            this.logger.info(`[TEST] ${event}`, data);
        }
    }

    let reporter: TestReporter;

    const {useAppContext} = useNodeBoot(EmptyApp, ({useAppContext}) => {
        useAppContext(ctx => {
            reporter = new TestReporter(ctx.logger);
            reporter.report("suite-started", {suite: "AppContextHook"});
        });
    });

    it("should use custom reporter", () => {
        reporter.report("test-started", {test: "custom reporter"});
        assert.ok(reporter);
    });
});
```

## Lifecycle

-   **afterStart**: Stores the application context
-   **beforeTests**: Runs all registered consumer callbacks with the context

## API

### `useAppContext(consumer: (context: Omit<NodeBootAppView, 'server'>) => void): void`

Registers a consumer function that will be called with the application context before tests run.

**Parameters:**

-   `consumer`: A callback function that receives the application context (minus the raw server)

**Context Object Properties:**

-   `logger`: Logger instance
-   `appOptions`: Resolved application configuration/options
-   `container`: IoC container reference
-   Other application-specific properties

## When to Use

Use `AppContextHook` for:

-   Reading configuration resolved at boot time
-   Accessing logger instance for custom log routing
-   Inspecting IoC container contents
-   Custom instrumentation and monitoring setup
-   Advanced testing scenarios not covered by other hooks

## Best Practices

-   **Prefer Dedicated Hooks**: Use `useConfig`, `useService`, etc. for common scenarios
-   **Use Sparingly**: Only access context for advanced/custom scenarios
-   **Avoid Mutation**: Don't mutate the context; read only
-   **Capture Early**: Use consumers to capture references before tests run
-   **Type Safety**: Store typed references to specific parts of context

## Troubleshooting

**Context not available:**

-   Ensure `useAppContext` is called in setup phase
-   Verify the application started successfully
-   Check that consumer is registered before tests run

**Properties undefined:**

-   Some context properties may be optional based on app configuration
-   Check application initialization code
-   Verify the property exists in the actual context

**Server reference not available:**

-   The raw server is intentionally excluded from the context
-   Use `SupertestHook` or `HttpClientHook` for HTTP testing instead
