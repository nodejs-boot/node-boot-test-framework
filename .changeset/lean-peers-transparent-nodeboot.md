---
"@nodeboot/test": major
"@nodeboot/node-test": major
---

Make optional libraries and the Node-Boot version transparent to the test framework.

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
