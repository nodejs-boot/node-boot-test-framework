# @nodeboot/node-test

## 3.1.0

### Minor Changes

-   0e63477: Support `@nodeboot/core` 2.x and drop the upper version bound on the Node-Boot and TypeORM peer dependencies.

    `@nodeboot/core` 2.0.0 made Nonna the default dependency injection container, and every `useNodeBoot()` test failed its startup check with "Unsupported @nodeboot/core@2.0.0". The test framework only touches the container through `ApplicationContext.getIocContainer()` (`get`/`reset`), which both majors provide. The peer ranges are now open-ended (`@nodeboot/core >=1.16.0`, `@nodeboot/context >=2.2.0`, `@nodeboot/config >=1.3.0`, `typeorm >=0.3.27`), and the runtime check only enforces those minimums, so future major releases no longer need a test-framework release just to be accepted.

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@3.1.0

## 3.0.0

### Major Changes

-   1d1f35e: Make optional libraries and the Node-Boot version transparent to the test framework.

    **Breaking: optional libraries are now optional peer dependencies**

    `axios`, `pactum`, `supertest`, `typeorm`, `testcontainers`, `@testcontainers/toxiproxy` and `mongodb-memory-server` are no longer installed with the framework. Install only the ones you use:

    -   `useHttp` → `axios`
    -   `usePactum` → `pactum`
    -   `useSupertest` → `supertest`
    -   `useMongoContainer`, `useGenericContainer`, `useGenericContainerRaw` → `testcontainers`
    -   `useToxiproxy` → `@testcontainers/toxiproxy`
    -   `useMongoMemoryServer`, `useMongoMemoryReplSet` → `mongodb-memory-server`

    Libraries are loaded lazily, only when the hook is used. A missing library fails at test bootstrap with an actionable install message. `PactumHook` and `HttpClientHook` no longer initialise on every app start.

    **Breaking: Node-Boot packages are peer dependencies**

    `@nodeboot/core`, `@nodeboot/context` and `@nodeboot/config` are now peer dependencies (`core >=1.16 <2`, `context >=2.2 <3`, `config >=1.3 <2`), so the framework always uses the copy installed by the application under test instead of a duplicate with its own `ApplicationContext`. They are resolved from the application's working directory, and bootstrap fails with a clear message when a package is missing or its version is unsupported.

    **Fixes**

    -   `useService` now resolves any container-managed class, including `@Component`, not only `@Service`.
    -   `useTimer().control()` throws a clear error when fake timers were not enabled in the `useNodeBoot` setup callback.

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@3.0.0

## 2.14.0

### Minor Changes

-   Add LoggerHook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.14.0

## 2.13.0

### Minor Changes

-   Add Toxiproxy test hook to provide network resilience test features

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.13.0

## 2.12.0

### Minor Changes

-   Add Test hooks for MongoDB in memory Database and ReplicaSet

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.12.0

## 2.11.0

### Minor Changes

-   Await application.adapters.bound lifecycle before test framework runs

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.11.0

## 2.10.0

### Minor Changes

-   update signature of useIocContainer hook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.10.0

## 2.9.0

### Minor Changes

-   Fix misconfigure hooks

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.9.0

## 2.8.0

### Minor Changes

-   Add Ioc Container Hook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.8.0

## 2.7.0

### Minor Changes

-   Add handy hooks that can be used without the useNodeBoot context hook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.7.0

## 2.5.1

### Patch Changes

-   update nodeboot core
-   Updated dependencies
    -   @nodeboot/test@2.5.1

## 2.5.0

### Minor Changes

-   Add applicationEvent hook
-   Add ApplicationEvent hook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.5.0

## 2.4.0

### Minor Changes

-   Add lifecycleHook and refactor timer hook

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.4.0

## 2.3.0

### Minor Changes

-   Add several test hooks. Implement solution for unhandled rejections and uncaught exceptions

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.3.0

## 2.2.0

### Minor Changes

-   Fix teardown

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.2.0

## 2.1.4

### Patch Changes

-   handle teardown hooks in reversed priority
-   Updated dependencies
    -   @nodeboot/test@2.1.4

## 2.1.3

### Patch Changes

-   Test changeset with both packages explicitly mentioned to verify linked behavior
-   Updated dependencies
    -   @nodeboot/test@2.1.3

## 1.0.0

### Major Changes

-   Node-Boot tests goes node:test

### Patch Changes

-   Updated dependencies
    -   @nodeboot/test@2.0.0
