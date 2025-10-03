# NodeBoot Test Framework - Developer Guide

A comprehensive, extensible testing framework for NodeBoot applications that provides a plugin-based architecture for dependency injection testing, service mocking, and lifecycle management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Hook System Architecture](#hook-system-architecture)
4. [Creating Custom Hooks](#creating-custom-hooks)
5. [Building Test Framework Plugins](#building-test-framework-plugins)
6. [Hook Libraries](#hook-libraries)
7. [Lifecycle Management](#lifecycle-management)
8. [Priority System](#priority-system)
9. [State Management](#state-management)
10. [Advanced Patterns](#advanced-patterns)
11. [Plugin Examples](#plugin-examples)
12. [Best Practices](#best-practices)

## Architecture Overview

The NodeBoot Test Framework follows a layered, plugin-based architecture designed for maximum extensibility and composability:

```
┌─────────────────────────────────────────────────────────┐
│                Test Runner Integration                   │
│            (Jest, Mocha, Vitest, etc.)                 │
├─────────────────────────────────────────────────────────┤
│              Custom Hook Libraries                      │
│       (JestHooksLibrary, MochaHooksLibrary, etc.)      │
├─────────────────────────────────────────────────────────┤
│                 Core Framework                          │
│    (NodeBootTestFramework, HookManager, HooksLibrary)  │
├─────────────────────────────────────────────────────────┤
│                   Hook System                           │
│        (Hook base class, lifecycle phases)             │
├─────────────────────────────────────────────────────────┤
│               NodeBoot Application                      │
│         (IoC Container, Services, Config)              │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Plugin Architecture**: Everything is a hook that can be added, removed, or customized
2. **Lifecycle-Driven**: Clear, predictable execution phases
3. **Priority-Based**: Hooks execute in controlled order based on priority
4. **State Management**: Hooks can store and share state across lifecycle phases
5. **Test Runner Agnostic**: Core framework works with any test runner
6. **Composable**: Hook libraries can extend and combine functionality

## Core Components

### 1. NodeBootTestFramework

The central orchestrator that manages the entire test lifecycle:

```typescript
export class NodeBootTestFramework<App extends NodeBootApp, CustomLibrary extends HooksLibrary = HooksLibrary> {
    private appInstance!: App;
    private bootAppView!: NodeBootAppView;
    private hookManager: HookManager;
    private hooksLibrary: CustomLibrary;

    constructor(private AppClass: new (...args: any[]) => App, hooksLibrary: CustomLibrary) {
        this.hookManager = new HookManager();
        this.hooksLibrary = hooksLibrary;
        this.hooksLibrary.registerHooks(this.hookManager);
    }
}
```

**Responsibilities:**

-   Instantiate and manage the NodeBoot application
-   Coordinate hook execution through the HookManager
-   Provide access to configured hooks via the HooksLibrary
-   Handle application startup and shutdown

### 2. HookManager

Manages hook registration, ordering, and execution:

```typescript
export class HookManager {
    private hooks: Hook[] = [];

    addHook(hook: Hook) {
        this.hooks.push(hook);
        // Automatically sort by priority (ascending)
        this.hooks.sort((a, b) => a.getPriority() - b.getPriority());
    }

    async runBeforeStart() {
        /* Execute all beforeStart hooks */
    }
    async runAfterStart(bootApp: NodeBootAppView) {
        /* Execute all afterStart hooks */
    }
    async runBeforeTests() {
        /* Execute all beforeTests hooks */
    }
    async runAfterTests() {
        /* Execute all afterTests hooks */
    }
    async runBeforeEachTest() {
        /* Execute all beforeEachTest hooks */
    }
    async runAfterEachTest() {
        /* Execute all afterEachTest hooks */
    }
}
```

**Features:**

-   Automatic priority-based sorting
-   Async/await support for all lifecycle phases
-   Comprehensive logging for debugging
-   Error handling and propagation

### 3. HooksLibrary

Base class for organizing and exposing hooks:

```typescript
export class HooksLibrary {
    // Core hooks
    appContextHook = new AppContextHook();
    mockHook = new MockHook();
    configHook = new ConfigHook();
    // ... more hooks

    registerHooks(hookManager: HookManager) {
        hookManager.addHook(this.appContextHook);
        hookManager.addHook(this.mockHook);
        // Register all hooks
    }

    getSetupHooks(): SetUpHooks {
        // Return setup-time hooks (configuration phase)
    }

    getReturnHooks(): ReturnHooks {
        // Return runtime hooks (test execution phase)
    }
}
```

## Hook System Architecture

### Hook Base Class

All hooks extend the abstract `Hook` class:

```typescript
export abstract class Hook {
    private readonly priority: number;
    private readonly state: Record<string, any>;

    constructor(priority: number = 0) {
        this.priority = priority;
        this.state = {};
    }

    // State management
    getState<T>(key: string): T | undefined {
        return this.state[key];
    }
    setState<T>(key: string, value: T): void {
        this.state[key] = value;
    }
    getPriority(): number {
        return this.priority;
    }

    // Lifecycle methods (all optional)
    beforeStart(): Promise<void> | void {}
    afterStart(_: NodeBootAppView): Promise<void> | void {}
    beforeTests(): Promise<void> | void {}
    afterTests(): Promise<void> | void {}
    beforeEachTest(): Promise<void> | void {}
    afterEachTest(): Promise<void> | void {}
}
```

### Hook Contract

Every hook should implement:

1. **Priority**: Determines execution order (lower numbers execute first)
2. **State Management**: Store configuration and runtime data
3. **Lifecycle Methods**: Implement relevant phases
4. **Call Method**: Setup-time configuration interface
5. **Use Method**: Runtime access interface

## Creating Custom Hooks

### Basic Hook Structure

```typescript
import {Hook} from "@nodeboot/test";
import {NodeBootAppView} from "@nodeboot/core";

export class MyCustomHook extends Hook {
    constructor() {
        super(10); // Priority - adjust based on dependencies
    }

    // Configuration method (called during setup)
    call(options: MyHookOptions) {
        this.setState("options", options);
        this.setState("isConfigured", true);
    }

    // Runtime access method (called during tests)
    use() {
        if (!this.getState("isConfigured")) {
            throw new Error("MyCustomHook not configured");
        }

        return {
            doSomething: () => this.performAction(),
            getState: () => this.getState("runtimeData"),
        };
    }

    // Lifecycle implementations
    override async beforeStart() {
        const options = this.getState<MyHookOptions>("options");
        // Perform setup before app starts
        await this.initializeResources(options);
    }

    override async afterStart(bootApp: NodeBootAppView) {
        // Access running application
        const server = bootApp.server;
        const address = server.address();
        this.setState("serverAddress", address);
    }

    override async beforeTests() {
        // Setup before test suite
        await this.prepareTestEnvironment();
    }

    override async afterTests() {
        // Cleanup after test suite
        await this.cleanupResources();
    }

    override async beforeEachTest() {
        // Reset state before each test
        this.setState("testStartTime", Date.now());
    }

    override async afterEachTest() {
        // Cleanup after each test
        const duration = Date.now() - this.getState<number>("testStartTime")!;
        console.log(`Test completed in ${duration}ms`);
    }

    private async initializeResources(options: MyHookOptions) {
        // Implementation
    }

    private performAction() {
        // Implementation
    }
}
```

### Advanced Hook Patterns

#### Dependent Hooks

```typescript
export class DatabaseHook extends Hook {
    constructor() {
        super(5); // Run early to setup database
    }

    override async beforeStart() {
        const connection = await this.createConnection();
        this.setState("connection", connection);
    }
}

export class SeedDataHook extends Hook {
    constructor() {
        super(15); // Run after DatabaseHook (priority 5)
    }

    override async beforeTests() {
        // Database is guaranteed to be ready
        const connection = this.findHook(DatabaseHook)?.getState("connection");
        await this.seedTestData(connection);
    }
}
```

#### Conditional Hooks

```typescript
export class ConditionalHook extends Hook {
    override async beforeStart() {
        const shouldActivate = this.getState("shouldActivate");
        if (!shouldActivate) {
            return; // Skip execution
        }

        await this.performSetup();
    }

    call(condition: boolean) {
        this.setState("shouldActivate", condition);
    }
}
```

#### Stateful Hooks

```typescript
export class MetricsHook extends Hook {
    private metrics: Map<string, number> = new Map();

    use() {
        return {
            startTimer: (name: string) => {
                this.metrics.set(name, Date.now());
            },
            endTimer: (name: string) => {
                const start = this.metrics.get(name);
                if (start) {
                    return Date.now() - start;
                }
                return 0;
            },
            getMetrics: () => Object.fromEntries(this.metrics),
        };
    }
}
```

## Building Test Framework Plugins

### Creating a Plugin Package

#### 1. Package Structure

```
my-test-plugin/
├── package.json
├── src/
│   ├── index.ts                 # Main exports
│   ├── MyPluginHooksLibrary.ts  # Extended hook library
│   ├── useMyPlugin.ts           # Integration function
│   └── hooks/
│       ├── index.ts
│       ├── CustomHook1.ts
│       └── CustomHook2.ts
└── README.md
```

#### 2. Extended Hook Library

```typescript
// MyPluginHooksLibrary.ts
import {HooksLibrary, HookManager, SetUpHooks, ReturnHooks} from "@nodeboot/test";
import {CustomHook1, CustomHook2} from "./hooks";

export type MyPluginSetUpHooks = SetUpHooks & {
    useCustom1: CustomHook1["call"];
    useCustom2: CustomHook2["call"];
};

export type MyPluginReturnHooks = ReturnHooks & {
    useCustom1: CustomHook1["use"];
    useCustom2: CustomHook2["use"];
};

export class MyPluginHooksLibrary extends HooksLibrary {
    customHook1 = new CustomHook1();
    customHook2 = new CustomHook2();

    override registerHooks(hookManager: HookManager) {
        // Register base hooks first
        super.registerHooks(hookManager);

        // Add plugin-specific hooks
        hookManager.addHook(this.customHook1);
        hookManager.addHook(this.customHook2);
    }

    override getSetupHooks(): MyPluginSetUpHooks {
        const baseHooks = super.getSetupHooks();
        return {
            ...baseHooks,
            useCustom1: this.customHook1.call.bind(this.customHook1),
            useCustom2: this.customHook2.call.bind(this.customHook2),
        };
    }

    override getReturnHooks(): MyPluginReturnHooks {
        const baseHooks = super.getReturnHooks();
        return {
            ...baseHooks,
            useCustom1: this.customHook1.use.bind(this.customHook1),
            useCustom2: this.customHook2.use.bind(this.customHook2),
        };
    }
}
```

#### 3. Integration Function

```typescript
// useMyPlugin.ts
import {NodeBootApp, NodeBootTestFramework} from "@nodeboot/test";
import {MyPluginHooksLibrary} from "./MyPluginHooksLibrary";

export function useMyPlugin<App extends NodeBootApp, CustomLibrary extends MyPluginHooksLibrary = MyPluginHooksLibrary>(
    AppClass: new (...args: any[]) => App,
    callback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    hooksLibrary: CustomLibrary = new MyPluginHooksLibrary() as CustomLibrary,
): ReturnType<CustomLibrary["getReturnHooks"]> {
    const framework = new NodeBootTestFramework(AppClass, hooksLibrary);

    // Plugin-specific test runner integration
    // This example shows generic integration - adapt for specific test runners

    return framework.getReturnHooks();
}
```

### Jest Plugin Example

```typescript
// JestPlugin.ts
import {NodeBootApp} from "@nodeboot/core";
import {NodeBootTestFramework} from "@nodeboot/test";
import {beforeAll, afterAll, beforeEach, afterEach} from "@jest/globals";
import {JestHooksLibrary} from "./JestHooksLibrary";

export function useNodeBoot<App extends NodeBootApp, CustomLibrary extends JestHooksLibrary = JestHooksLibrary>(
    AppClass: new (...args: any[]) => App,
    callback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    hooksLibrary: CustomLibrary = new JestHooksLibrary() as CustomLibrary,
): ReturnType<CustomLibrary["getReturnHooks"]> {
    const framework = new NodeBootTestFramework(AppClass, hooksLibrary);

    // Jest-specific lifecycle integration
    beforeAll(async () => {
        await framework.runBeforeAll(callback);
    });

    afterAll(async () => {
        await framework.runAfterAll();
    });

    beforeEach(async () => {
        await framework.runBeforeEachTest();
    });

    afterEach(async () => {
        await framework.runAfterEachTest();
    });

    return framework.getReturnHooks();
}
```

### Vitest Plugin Example

```typescript
// VitestPlugin.ts
import {NodeBootApp} from "@nodeboot/core";
import {NodeBootTestFramework} from "@nodeboot/test";
import {beforeAll, afterAll, beforeEach, afterEach} from "vitest";
import {VitestHooksLibrary} from "./VitestHooksLibrary";

export function useNodeBootVitest<
    App extends NodeBootApp,
    CustomLibrary extends VitestHooksLibrary = VitestHooksLibrary,
>(
    AppClass: new (...args: any[]) => App,
    callback?: (setupHooks: ReturnType<CustomLibrary["getSetupHooks"]>) => void,
    hooksLibrary: CustomLibrary = new VitestHooksLibrary() as CustomLibrary,
): ReturnType<CustomLibrary["getReturnHooks"]> {
    const framework = new NodeBootTestFramework(AppClass, hooksLibrary);

    // Vitest-specific lifecycle integration
    beforeAll(async () => {
        await framework.runBeforeAll(callback);
    });

    afterAll(async () => {
        await framework.runAfterAll();
    });

    beforeEach(async () => {
        await framework.runBeforeEachTest();
    });

    afterEach(async () => {
        await framework.runAfterEachTest();
    });

    return framework.getReturnHooks();
}
```

## Hook Libraries

### Extending Existing Libraries

```typescript
// DatabaseHooksLibrary.ts
import {HooksLibrary, HookManager} from "@nodeboot/test";
import {DatabaseHook, MigrationHook, SeedHook} from "./hooks";

export class DatabaseHooksLibrary extends HooksLibrary {
    databaseHook = new DatabaseHook();
    migrationHook = new MigrationHook();
    seedHook = new SeedHook();

    override registerHooks(hookManager: HookManager) {
        super.registerHooks(hookManager);
        hookManager.addHook(this.databaseHook);
        hookManager.addHook(this.migrationHook);
        hookManager.addHook(this.seedHook);
    }

    override getSetupHooks() {
        const baseHooks = super.getSetupHooks();
        return {
            ...baseHooks,
            useDatabase: this.databaseHook.call.bind(this.databaseHook),
            useMigrations: this.migrationHook.call.bind(this.migrationHook),
            useSeed: this.seedHook.call.bind(this.seedHook),
        };
    }

    override getReturnHooks() {
        const baseHooks = super.getReturnHooks();
        return {
            ...baseHooks,
            useDatabase: this.databaseHook.use.bind(this.databaseHook),
            useMigrations: this.migrationHook.use.bind(this.migrationHook),
            useSeed: this.seedHook.use.bind(this.seedHook),
        };
    }
}
```

### Composing Multiple Libraries

```typescript
// CompositeHooksLibrary.ts
export class CompositeHooksLibrary extends HooksLibrary {
    private databaseLibrary = new DatabaseHooksLibrary();
    private authLibrary = new AuthHooksLibrary();

    override registerHooks(hookManager: HookManager) {
        // Register hooks from all composed libraries
        this.databaseLibrary.registerHooks(hookManager);
        this.authLibrary.registerHooks(hookManager);
        super.registerHooks(hookManager);
    }

    override getSetupHooks() {
        return {
            ...super.getSetupHooks(),
            ...this.databaseLibrary.getSetupHooks(),
            ...this.authLibrary.getSetupHooks(),
        };
    }

    override getReturnHooks() {
        return {
            ...super.getReturnHooks(),
            ...this.databaseLibrary.getReturnHooks(),
            ...this.authLibrary.getReturnHooks(),
        };
    }
}
```

## Lifecycle Management

### Execution Order

The framework executes hooks in the following order:

```
1. beforeStart    (Application setup, before NodeBoot app starts)
   ↓
2. afterStart     (Application configuration, after NodeBoot app starts)
   ↓
3. beforeTests    (Test suite setup, before any tests run)
   ↓
4. [Test Execution Loop]
   ├── beforeEachTest (Before each individual test)
   ├── [Test Runs]
   └── afterEachTest  (After each individual test)
   ↓
5. afterTests     (Test suite cleanup, after all tests complete)
```

### Phase-Specific Use Cases

#### beforeStart

-   Environment variable configuration
-   External service setup (databases, message queues)
-   Configuration file preparation
-   Mock server initialization

#### afterStart

-   Server address capture
-   Health check verification
-   Service registration verification
-   Runtime configuration validation

#### beforeTests

-   Test data seeding
-   Cache warming
-   Connection pool setup
-   Test-specific service configuration

#### beforeEachTest

-   State reset
-   Mock function reset
-   Timer setup
-   Test isolation preparation

#### afterEachTest

-   Cleanup temporary data
-   Reset service states
-   Clear caches
-   Performance metric collection

#### afterTests

-   Database cleanup
-   File system cleanup
-   External service teardown
-   Resource deallocation

## Priority System

### Priority Guidelines

```typescript
// Infrastructure hooks (lowest priority numbers, run first)
const INFRASTRUCTURE_PRIORITY = 0 - 10;
const ENV_HOOK_PRIORITY = 1; // Environment variables
const CONFIG_HOOK_PRIORITY = 2; // Configuration
const DATABASE_HOOK_PRIORITY = 5; // Database setup

// Application hooks
const APPLICATION_PRIORITY = 10 - 20;
const SERVICE_HOOK_PRIORITY = 10; // Service registration
const MOCK_HOOK_PRIORITY = 15; // Service mocking

// Test framework hooks
const FRAMEWORK_PRIORITY = 20 - 30;
const HTTP_CLIENT_PRIORITY = 20; // HTTP client setup
const SUPERTEST_PRIORITY = 21; // Supertest setup

// Test runner specific hooks (highest priority, run last)
const TEST_RUNNER_PRIORITY = 30 - 40;
const JEST_SPY_PRIORITY = 35; // Jest spies
const JEST_TIMER_PRIORITY = 36; // Jest timers
```

### Dynamic Priority Assignment

```typescript
export class DynamicPriorityHook extends Hook {
    constructor(dependencies: Hook[] = []) {
        // Calculate priority based on dependencies
        const maxDependencyPriority = Math.max(...dependencies.map(dep => dep.getPriority()));
        super(maxDependencyPriority + 1);
    }
}
```

## State Management

### Hook State Patterns

#### Configuration State

```typescript
export class ConfigurableHook extends Hook {
    call(config: MyConfig) {
        // Validate configuration
        this.validateConfig(config);

        // Store configuration
        this.setState("config", config);
        this.setState("isConfigured", true);
    }

    use() {
        if (!this.getState("isConfigured")) {
            throw new Error("Hook not configured");
        }

        const config = this.getState<MyConfig>("config")!;
        return this.createAPI(config);
    }
}
```

#### Runtime State

```typescript
export class StatefulHook extends Hook {
    override async afterStart(bootApp: NodeBootAppView) {
        // Store runtime information
        this.setState("serverPort", bootApp.server.address()?.port);
        this.setState("appInstance", bootApp);
    }

    use() {
        return {
            getServerPort: () => this.getState<number>("serverPort"),
            getApp: () => this.getState<NodeBootAppView>("appInstance"),
        };
    }
}
```

#### Shared State Between Hooks

```typescript
// StateManager utility for cross-hook communication
class StateManager {
    private static instance: StateManager;
    private globalState: Map<string, any> = new Map();

    static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    set<T>(key: string, value: T): void {
        this.globalState.set(key, value);
    }

    get<T>(key: string): T | undefined {
        return this.globalState.get(key);
    }
}

// Hook using shared state
export class ProducerHook extends Hook {
    override async beforeStart() {
        const data = await this.generateData();
        StateManager.getInstance().set("sharedData", data);
    }
}

export class ConsumerHook extends Hook {
    constructor() {
        super(10); // Higher priority to run after ProducerHook
    }

    override async beforeStart() {
        const data = StateManager.getInstance().get("sharedData");
        this.processData(data);
    }
}
```

## Advanced Patterns

### Hook Factories

```typescript
// Factory for creating database hooks for different databases
export function createDatabaseHook(type: "postgres" | "mysql" | "sqlite") {
    return class DatabaseHook extends Hook {
        constructor() {
            super(5);
        }

        override async beforeStart() {
            const config = this.getState("config");
            const connection = await this.createConnection(type, config);
            this.setState("connection", connection);
        }

        call(config: DatabaseConfig) {
            this.setState("config", config);
        }

        use() {
            return {
                getConnection: () => this.getState("connection"),
                query: (sql: string) => this.executeQuery(sql),
            };
        }

        private async createConnection(type: string, config: DatabaseConfig) {
            switch (type) {
                case "postgres":
                    return new PostgresConnection(config);
                case "mysql":
                    return new MySQLConnection(config);
                case "sqlite":
                    return new SQLiteConnection(config);
                default:
                    throw new Error(`Unsupported database type: ${type}`);
            }
        }
    };
}

// Usage
const PostgresHook = createDatabaseHook("postgres");
const MySQLHook = createDatabaseHook("mysql");
```

### Conditional Hook Loading

```typescript
export class ConditionalHooksLibrary extends HooksLibrary {
    override registerHooks(hookManager: HookManager) {
        super.registerHooks(hookManager);

        // Conditionally register hooks based on environment
        if (process.env.NODE_ENV === "test") {
            hookManager.addHook(new MockHook());
        }

        if (process.env.ENABLE_METRICS === "true") {
            hookManager.addHook(new MetricsHook());
        }

        // Conditionally register based on available packages
        try {
            require("redis");
            hookManager.addHook(new RedisHook());
        } catch {
            console.log("Redis not available, skipping RedisHook");
        }
    }
}
```

### Hook Composition

```typescript
// Mixin pattern for hook composition
function withLogging<T extends new (...args: any[]) => Hook>(Base: T) {
    return class extends Base {
        override async beforeStart() {
            console.log(`Starting ${this.constructor.name}`);
            await super.beforeStart();
            console.log(`Started ${this.constructor.name}`);
        }

        override async afterTests() {
            console.log(`Cleaning up ${this.constructor.name}`);
            await super.afterTests();
            console.log(`Cleaned up ${this.constructor.name}`);
        }
    };
}

function withMetrics<T extends new (...args: any[]) => Hook>(Base: T) {
    return class extends Base {
        private startTime?: number;

        override async beforeStart() {
            this.startTime = Date.now();
            await super.beforeStart();
        }

        override async afterTests() {
            await super.afterTests();
            if (this.startTime) {
                const duration = Date.now() - this.startTime;
                console.log(`${this.constructor.name} total duration: ${duration}ms`);
            }
        }
    };
}

// Compose hooks with mixins
const EnhancedDatabaseHook = withLogging(withMetrics(DatabaseHook));
```

## Plugin Examples

### Complete Database Plugin

```typescript
// database-plugin/src/hooks/DatabaseHook.ts
import {Hook} from "@nodeboot/test";
import {Pool} from "pg";

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

export class DatabaseHook extends Hook {
    private pool?: Pool;

    constructor() {
        super(5); // Run early in lifecycle
    }

    override async beforeStart() {
        const config = this.getState<DatabaseConfig>("config");
        if (!config) {
            throw new Error("Database configuration required");
        }

        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
        });

        this.setState("pool", this.pool);
    }

    override async beforeEachTest() {
        // Clean database before each test
        await this.pool?.query("TRUNCATE TABLE users CASCADE");
    }

    override async afterTests() {
        await this.pool?.end();
    }

    call(config: DatabaseConfig) {
        this.setState("config", config);
    }

    use() {
        const pool = this.getState<Pool>("pool");
        if (!pool) {
            throw new Error("Database not initialized");
        }

        return {
            query: (text: string, params?: any[]) => pool.query(text, params),
            getPool: () => pool,
            transaction: async <T>(callback: (client: any) => Promise<T>) => {
                const client = await pool.connect();
                try {
                    await client.query("BEGIN");
                    const result = await callback(client);
                    await client.query("COMMIT");
                    return result;
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                } finally {
                    client.release();
                }
            },
        };
    }
}
```

### Authentication Plugin

```typescript
// auth-plugin/src/hooks/AuthHook.ts
import {Hook} from "@nodeboot/test";
import jwt from "jsonwebtoken";

export interface AuthConfig {
    secretKey: string;
    tokenExpiry: string;
}

export class AuthHook extends Hook {
    constructor() {
        super(12); // Run after basic setup
    }

    call(config: AuthConfig) {
        this.setState("config", config);
    }

    use() {
        const config = this.getState<AuthConfig>("config");
        if (!config) {
            throw new Error("Auth configuration required");
        }

        return {
            createToken: (payload: object) => {
                return jwt.sign(payload, config.secretKey, {
                    expiresIn: config.tokenExpiry,
                });
            },
            verifyToken: (token: string) => {
                return jwt.verify(token, config.secretKey);
            },
            createTestUser: async () => {
                // Create test user and return token
                const payload = {userId: "test-user", role: "admin"};
                return this.createToken(payload);
            },
        };
    }
}
```

### Metrics Collection Plugin

```typescript
// metrics-plugin/src/hooks/MetricsHook.ts
import {Hook} from "@nodeboot/test";

export class MetricsHook extends Hook {
    private metrics: Map<string, any[]> = new Map();

    constructor() {
        super(40); // Run late to capture all other hook metrics
    }

    override async beforeEachTest() {
        this.setState("testStartTime", Date.now());
    }

    override async afterEachTest() {
        const startTime = this.getState<number>("testStartTime");
        if (startTime) {
            const duration = Date.now() - startTime;
            this.recordMetric("testDuration", duration);
        }
    }

    override async afterTests() {
        this.generateReport();
    }

    use() {
        return {
            recordMetric: (name: string, value: any) => {
                this.recordMetric(name, value);
            },
            getMetrics: (name?: string) => {
                if (name) {
                    return this.metrics.get(name) || [];
                }
                return Object.fromEntries(this.metrics);
            },
            startTimer: (name: string) => {
                const timerName = `${name}_timer`;
                this.setState(timerName, Date.now());
                return {
                    end: () => {
                        const startTime = this.getState<number>(timerName);
                        if (startTime) {
                            const duration = Date.now() - startTime;
                            this.recordMetric(name, duration);
                            return duration;
                        }
                        return 0;
                    },
                };
            },
        };
    }

    private recordMetric(name: string, value: any) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    private generateReport() {
        console.log("\n=== Test Metrics Report ===");
        for (const [name, values] of this.metrics) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms`);
        }
        console.log("===========================\n");
    }
}
```

## Best Practices

### Hook Development

1. **Single Responsibility**: Each hook should have one clear purpose
2. **Priority Planning**: Consider dependencies when setting priorities
3. **Error Handling**: Implement proper error handling in all lifecycle methods
4. **State Validation**: Validate configuration in `call()` methods
5. **Resource Cleanup**: Always clean up resources in `afterTests()`
6. **Documentation**: Document hook behavior, dependencies, and usage

### Plugin Architecture

1. **Namespace Hooks**: Use clear, descriptive names to avoid conflicts
2. **Version Compatibility**: Maintain backward compatibility in hook interfaces
3. **Optional Dependencies**: Make external dependencies optional where possible
4. **Configuration Validation**: Validate all configuration early
5. **Error Messages**: Provide clear, actionable error messages

### Performance Considerations

1. **Lazy Initialization**: Initialize resources only when needed
2. **Connection Pooling**: Reuse connections and resources across tests
3. **Parallel Execution**: Design hooks to support parallel test execution
4. **Memory Management**: Clean up large objects and close connections
5. **Async Operations**: Use proper async/await patterns

### Testing Plugins

```typescript
// Example: Testing a custom hook
describe("DatabaseHook", () => {
    let hook: DatabaseHook;
    let mockHookManager: HookManager;

    beforeEach(() => {
        hook = new DatabaseHook();
        mockHookManager = new HookManager();
    });

    it("should initialize database connection", async () => {
        const config = {
            host: "localhost",
            port: 5432,
            database: "test",
            username: "test",
            password: "test",
        };

        hook.call(config);
        await hook.beforeStart();

        const pool = hook.getState("pool");
        expect(pool).toBeDefined();
    });

    it("should provide database utilities", () => {
        hook.setState("pool", mockPool);

        const {query, transaction} = hook.use();

        expect(typeof query).toBe("function");
        expect(typeof transaction).toBe("function");
    });
});
```

This comprehensive developer guide provides everything needed to understand the NodeBoot Test Framework architecture and build custom hooks and plugins on top of it. The framework's plugin-based design enables unlimited extensibility while maintaining a clean, predictable structure.
