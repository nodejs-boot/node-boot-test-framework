# Enhanced Integration Tests for Node-Boot Apps

**Date of Creation:** October 27, 2025  
**Last Updated:** October 29, 2025

## Goal

Establish strict, integration‑first testing standards for Node-Boot applications: validate real runtime wiring (DI graph, HTTP boundaries, persistence, cross-service flows) while permitting narrowly scoped unit tests only for truly isolated or core-only components.

## Testing Definitions & Conventions

-   Unit Test (Eligibility Restricted):
    -   Direct instantiation of a single class/module without booting the application (no `useNodeBoot`).
    -   Allowed only if: (a) constructor has no non-core dependencies OR (b) dependencies are exclusively core `@nodeboot/*` services (logger, config, framework utilities).
    -   NOT allowed for repositories, controllers, services with project-defined dependencies, orchestrators, or workflow components.
-   Integration Test:
    -   Boots a Node-Boot application via `useNodeBoot(ApplicationClass, setupHooks)` INSIDE a `describe` block (CRITICAL rule).
    -   Verifies collaboration among controllers, services, repositories, config, persistence, HTTP endpoints.
    -   Do NOT mock internal services/repositories; only external/outbound systems may be mocked.
-   Cross-Service / Workflow / E2E Test:
    -   May start multiple application instances or execute multi-step business flows spanning boundaries.
    -   Prefer minimal mocking; simulate only unstable/external dependencies.
-   Directory Layout Rule: Each package/app root contains adjacent `/src` and `/test` directories. No production code under `/test`.
-   Mirroring Rule: Structure beneath `/test` mirrors `/src` (e.g. `src/services/UserService.ts` → `test/services/UserService.it.test.ts`).
-   Naming Suffixes:
    -   Unit: `*.test.ts`
    -   Integration: `*.it.test.ts`
    -   Workflow / multi-instance / E2E (if adopted): `*.e2e.test.ts`
    -   Legacy `*.test.ts` files migrated incrementally to correct suffixes.
-   Scope Separation:
    -   Unit: pure logic branches, error paths, deterministic behavior.
    -   Integration: wiring, DI graph, persistence, HTTP contract shape.
    -   E2E: business workflow correctness across subsystems.
-   Mocking Guidelines:
    -   Unit: `jest.fn`, `jest.spyOn`, `jest.mock` allowed for collaborators.
    -   Integration: mock ONLY external boundaries (e.g. outbound HTTP client wrappers, payment SDKs). No internal dependency mocking.
    -   E2E: minimal mocks; only truly external or unstable systems.
-   Spies: Use `useSpy(ServiceClass, methodName)` (integration/E2E) or `jest.spyOn` (unit). Assert calls & observable effects, not private state.
-   Inline Data Pattern (Fixtureless Approach): All requests, responses, mocks, and test data are defined inline inside the test file. No new shared fixture/builder directories (`_fixtures`, `_builders`). Existing legacy fixtures (if any) remain but are deprecated – do not add new ones.
-   Cleanup & Isolation:
    -   Unit: `afterEach(() => jest.clearAllMocks())`.
    -   Integration/E2E: `useCleanup()` for DB resets, mock server teardown, resource release.
-   Coverage Thresholds (Confirmed): Statements ≥80%, Branches ≥70%, Functions ≥75%, Lines ≥80%.
-   CRITICAL Rule: `useNodeBoot` MUST appear inside a `describe` scope so framework bindings attach to the test lifecycle.

## Test Type Decision Matrix

| Scenario / Component                                     | Condition                                          | Test Type         |
| -------------------------------------------------------- | -------------------------------------------------- | ----------------- |
| Pure utility (no constructor params)                     | Stateless synchronous logic                        | Unit (optional)   |
| Utility w/ only core `@nodeboot/*` deps                  | Logger / config / framework only                   | Unit (optional)   |
| Service with project-defined dependency                  | Injects any non-core service/repository/controller | Integration       |
| Repository (data access of any kind)                     | Reads/writes or queries data                       | Integration       |
| Controller / HTTP adapter                                | Handles request/response lifecycle                 | Integration       |
| Workflow orchestrator                                    | Coordinates multiple services/repositories         | Integration / E2E |
| Cross-service communication                              | Multiple app instances or endpoints                | E2E               |
| Persistence semantics (transactions/locking/concurrency) | Requires real DB semantics                         | Integration       |
| Time-based behavior (timers/scheduling)                  | Needs lifecycle + time control                     | Integration       |

## Best Practices (Updated)

-   Default to integration tests; choose unit tests only when isolation criteria are clearly met.
-   Keep test data inline for immediate readability—avoid indirection via shared fixtures/builders.
-   One principal subject per test file; never mix unit and integration types in the same file.
-   Assertions target observable contracts (HTTP status/payload, DB state, method outputs) not internal implementation details.
-   Use `useTimer()` only for time-sensitive logic requiring deterministic control.
-   Use `useMock()` exclusively for external systems; avoid internal dependency mocks.
-   If uncertain whether a component qualifies for unit testing, prefer integration.

## Code Example: Minimal Integration Test (No Internal Mocks)

```typescript
import "reflect-metadata";
import {useNodeBoot} from "@nodeboot/jest";
import {spec} from "pactum";
import {MyApp} from "../src/MyApp"; // Main NodeBoot application class
import {UserService} from "../src/services/UserService";

describe("User flow integration", () => {
    const {useHttp, useService, useConfig, useSpy, useCleanup, useTimer} = useNodeBoot(
        MyApp,
        ({useConfig, useEnv, usePactum, useCleanup}) => {
            useConfig({app: {port: 41000}, database: {url: "sqlite::memory:"}});
            useEnv({NODE_ENV: "test"});
            usePactum();
            useCleanup({
                afterEach: () => {
                    /* inline cleanup if needed */
                },
            });
        },
    );

    test("creates and retrieves a user", async () => {
        const {post, get} = useHttp();
        const createBody = {name: "Alice", email: "alice@example.com"};
        const createRes = await post("/api/users", createBody);
        expect(createRes.status).toBe(201);
        expect(createRes.data).toMatchObject({name: "Alice"});
        const getRes = await get(`/api/users/${createRes.data.id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.data.email).toBe("alice@example.com");
    });

    test("service spy verifies interaction", () => {
        const userService = useService(UserService);
        const saveSpy = useSpy(UserService, "save");
        const payload = {name: "Bob", email: "bob@example.com"};
        userService.save(payload);
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(payload);
    });

    test("timer control for delayed operations", () => {
        const {control} = useTimer();
        let executed = false;
        setTimeout(() => {
            executed = true;
        }, 1000);
        expect(executed).toBe(false);
        control().advanceTimeBy(1000);
        expect(executed).toBe(true);
    });

    test("HTTP contract via Pactum", async () => {
        await spec().get("/api/users/1").expectStatus(200).expectJsonLike({id: 1});
    });
});
```

## Multi-Service / Workflow Example (Correct Application Usage)

(Each application must have its own Application class; example assumes `UserApp` and `OrderApp` are proper NodeBoot application classes.)

```typescript
import "reflect-metadata";
import {useNodeBoot} from "@nodeboot/jest";
import {spec} from "pactum";
import {UserApp} from "../src/user/UserApp";
import {OrderApp} from "../src/order/OrderApp";
import {PaymentGatewayClient} from "../src/external/PaymentGatewayClient";

describe("Cross-service order workflow", () => {
    const userCtx = useNodeBoot(UserApp, ({useConfig, useEnv, usePactum}) => {
        useConfig({app: {port: 42001}});
        useEnv({SERVICE_NAME: "user-service"});
        usePactum();
    });

    const orderCtx = useNodeBoot(OrderApp, ({useConfig, useEnv, usePactum, useMock}) => {
        useConfig({
            app: {port: 42002},
            services: {userServiceUrl: "http://localhost:42001/api"},
        });
        useEnv({SERVICE_NAME: "order-service"});
        usePactum();
        // External payment system mock (allowed)
        useMock(PaymentGatewayClient, {
            processPayment: () => ({transactionId: "tx-123", status: "approved"}),
        });
    });

    test("completes order across services", async () => {
        const user = await spec()
            .post("/api/users")
            .withJson({name: "Jane", email: "jane@example.com"})
            .expectStatus(201)
            .returns("res.body");

        const order = await spec()
            .post("/api/orders")
            .withJson({userId: user.id, items: [{productId: 1, quantity: 2, price: 50}]})
            .expectStatus(201)
            .returns("res.body");

        expect(order.userId).toBe(user.id);
        expect(order.total).toBe(100);
    });
});
```

## Database & External Environment Strategy (Summary)

-   Use containers (e.g. Testcontainers) for vendor-specific behavior: transactions, locking, indexing, extensions, performance profiling.
-   Use in-memory engines (sqlite memory, embedded Postgres, mongodb-memory-server) for simple CRUD + constraint validation.
-   Postgres: fresh container per test file for highest isolation; other vendors default to suite-level container unless overridden by `TEST_DB_ISOLATION=perTest`.
-   `TEST_DB_MODE=container|memory` selects harness strategy. Configuration injected with `useConfig()` before boot.
-   External systems: mock via local mock server or framework-supported mocks with realistic failure modes (timeouts, 5xx, auth failures, rate limits, network partitions, latency).
-   Seeding: Prefer inline creation during test execution; avoid global fixtures. Reset via `useCleanup()` or ephemeral containers.

## Details (Tree Structure)

-   **Test Project Structure & Conventions**

    -   Purpose: Enforce consistent layout and integration-first standards.
    -   Relation: Foundation for reliability and maintainability.
        -   **Directory Layout Enforcement** (Task)
            -   Technical Details: `/test` mirrors `/src`; no production code under `/test`.
            -   Status: Pending
            -   Task: Audit each package; add missing mirrors.
            -   Notes: Record legacy deviations.
        -   **File Naming & Suffix Standardization** (Task)
            -   Technical Details: Enforce suffixes via CI script.
            -   Status: Pending
            -   Task: Implement scan & report.
            -   Notes: Incremental migration acceptable.
        -   **Unit Test Eligibility Policy** (Task)
            -   Technical Details: Detect non-core dependencies; flag misuse.
            -   Status: Pending
            -   Task: Optional lint/script to identify violations.
            -   Notes: Prefer integration when uncertain.
        -   **Integration Test Practices** (Task)
            -   Technical Details: `useNodeBoot` inside `describe`; no internal mocks; use hooks (`useHttp`, `useService`, `useRepository`, `useSpy`, `useTimer`, `useCleanup`).
            -   Status: Pending
            -   Task: Provide template generator.
            -   Notes: Encourage inline data.
        -   **Inline Data Pattern Enforcement** (Task)
            -   Technical Details: Block creation of new fixture/builder dirs; allow legacy to persist unreferenced.
            -   Status: Pending
            -   Task: Add scan for `_fixtures|_builders` creation.
            -   Notes: Communicate deprecation in README.
        -   **Migration Strategy for Legacy Tests** (Task)
            -   Technical Details: Rename on touch; maintain mapping log.
            -   Status: Pending
            -   Task: Produce candidate rename list.
            -   Notes: No forced bulk rename.
        -   **Coverage & CI Enforcement** (Task)
            -   Technical Details: Jest coverage thresholds; fail on breach.
            -   Status: Pending
            -   Task: Integrate thresholds into CI config.
            -   Notes: Reassess baseline quarterly.
        -   **External Dependency Failure Simulation** (Task)
            -   Technical Details: Harness scenarios (timeout, 5xx, auth, rate limit, network partition, latency).
            -   Status: Pending
            -   Task: Implement minimal mock server harness.
            -   Notes: Extend for contract tests later.

-   **Database & External Environment Strategy**

    -   Purpose: Reliable persistence & external boundary fidelity.
    -   Relation: Supports repository and service correctness.
        -   **Test Database Provisioning** (Task)
            -   Technical Details: Harness selects container vs memory; Postgres per-file isolation.
            -   Status: Pending
            -   Task: Implement harness + env-driven mode.
            -   Notes: Monitor startup SLA (<60s; warn ≥45s).
        -   **Data Reset & Isolation** (Task)
            -   Technical Details: Inline creation + `useCleanup` truncation or ephemeral container.
            -   Status: Pending
            -   Task: Add `resetDatabase()` helper for container scenario.
            -   Notes: Avoid global seeding fixtures.
        -   **Selection Decision Matrix** (Task)
            -   Technical Details: Document CRUD vs fidelity mapping; vendor specifics.
            -   Status: Pending
            -   Task: Publish matrix in README.
            -   Notes: Review quarterly.

-   **Multi-Service / Workflow Testing**
    -   Purpose: Validate cross-boundary flows.
    -   Relation: Extends integration patterns.
        -   **Service Orchestration** (Task)
            -   Technical Details: Multiple app instances with port config; inline external mocks.
            -   Status: Pending
            -   Task: Provide orchestrated workflow examples.
            -   Notes: Keep data inline.
        -   **Cross-Service Data Validation** (Task)
            -   Technical Details: useHttp + repository checks + spies.
            -   Status: Pending
            -   Task: Build reference example for data consistency & failure handling.
            -   Notes: Include retry scenario.

## Acceptance Criteria (Pending User Confirmation per Item Later)

1. `/test` mirrors `/src` in all packages/apps.
2. Suffix conventions applied (`.test.ts`, `.it.test.ts`, `.e2e.test.ts` where adopted).
3. No production code under `/test`.
4. All integration tests invoke `useNodeBoot` inside a `describe` scope.
5. Unit tests only target dependency-free or core-only (`@nodeboot/*`) classes.
6. Internal mocking absent in integration tests (external-only mocks).
7. Fixtureless approach: requests/mocks defined inline; no new shared fixture/builder directories.
8. Coverage thresholds enforced (Statements ≥80%, Branches ≥70%, Functions ≥75%, Lines ≥80%).
9. Harness selects container vs memory via `TEST_DB_MODE`; Postgres isolation per test file.
10. External dependency failure simulation harness implements required failure modes.
11. CI supports `TEST_DB_MODE` and mock server lifecycle.
12. Decision matrix documented and accessible.
13. Multi-service orchestration example uses proper Application classes and inline data.
14. Inline data pattern documented; no new fixture directories introduced.
15. Optional lint/script for unit eligibility prepared (even if not enforced initially).

## Notes

-   Tasks remain Pending until implemented and explicitly confirmed Done by user.
-   Legacy fixtures may remain but should not be expanded; future removal can be separate PRD.
-   E2E suffix adoption deferred until first workflow suite is added.
