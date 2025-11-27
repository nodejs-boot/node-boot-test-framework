# Node-Boot Test Framework Hooks

This folder documents the test hooks provided by the Node-Boot test framework. Each hook page includes a Purpose section, concrete node:test + useNodeBoot examples, API reference, best practices, and troubleshooting.

## Index

-   [AddressHook.md](./AddressHook.md) — Access the server address and port of the running application
-   [AppContextHook.md](./AppContextHook.md) — Inspect application context and DI container
-   [ConfigHook.md](./ConfigHook.md) — Override configuration values for tests
-   [EmergencyCleanup.md](./EmergencyCleanup.md) — Global unhandled error handling and forced cleanup
-   [EnvHook.md](./EnvHook.md) — Manage environment variables for tests
-   [FileSystemSandboxHook.md](./FileSystemSandboxHook.md) — Per-test real filesystem sandbox with helpers
-   [GenericContainerHook.md](./GenericContainerHook.md) — Declarative Docker containers via Testcontainers
-   [GenericContainerRawHook.md](./GenericContainerRawHook.md) — Raw, factory-based Testcontainers control
-   [Hook.md](./Hook.md) — Base concepts and lifecycle for hooks
-   [HttpClientHook.md](./HttpClientHook.md) — HTTP client for calling app endpoints
-   [LifecycleHook.md](./LifecycleHook.md) — Unified before/after lifecycle management
-   [LogCaptureHook.md](./LogCaptureHook.md) — Capture and assert framework logs
-   [LoggerHook.md](./LoggerHook.md) — Access the shared Winston logger in tests
-   [LogMatchHook.md](./LogMatchHook.md) — Pattern-based log assertions
-   [MemoryFileSystemHook.md](./MemoryFileSystemHook.md) — In-memory filesystem replacement (memfs)
-   [MetricsHook.md](./MetricsHook.md) — Record custom metrics and test durations
-   [MockHook.md](./MockHook.md) — Mock external dependencies
-   [MongoContainerHook.md](./MongoContainerHook.md) — Real MongoDB via Docker for integration tests
-   [MongoMemoryReplSetHook.md](./MongoMemoryReplSetHook.md) — In-memory Mongo replica set (transactions/change streams)
-   [MongoMemoryServerHook.md](./MongoMemoryServerHook.md) — In-memory single MongoDB instance
-   [PactumHook.md](./PactumHook.md) — Pactum integration for HTTP API testing
-   [PerformanceBudgetHook.md](./PerformanceBudgetHook.md) — Enforce per-label performance budgets
-   [RepositoryHook.md](./RepositoryHook.md) — Repository access to persistence layer
-   [ResourceLeakDetectorHook.md](./ResourceLeakDetectorHook.md) — Detect lingering resources/handles
-   [ServiceHook.md](./ServiceHook.md) — Access services within the running app
-   [SnapshotStateHook.md](./SnapshotStateHook.md) — Detect shared state mutations between tests
-   [SpyHook.md](./SpyHook.md) — Spies for observing calls and arguments
-   [SupertestHook.md](./SupertestHook.md) — Supertest integration for HTTP endpoints
-   [TimerHook.md](./TimerHook.md) — Control and observe time during tests
-   [ToxiproxyHook.md](./ToxiproxyHook.md) — Network toxicity simulation

## Quick Start Pattern

All hooks follow this test pattern:

```ts
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("HookName", () => {
    const {useHookName} = useNodeBoot(EmptyApp, ({useHookName}) => {
        useHookName(/* optional configuration */);
    });

    it("uses hook", async () => {
        const api = useHookName();
        // interact with api
        assert.ok(api);
    });
});
```

## Notes

-   Hooks that require activation must be called in the setup callback (e.g., Mongo memory hooks, container hooks).
-   Some hooks are always available without explicit registration (e.g., MetricsHook).
-   Use the individual hook docs for configuration options and examples.
