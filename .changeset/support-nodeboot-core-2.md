---
"@nodeboot/test": minor
"@nodeboot/node-test": minor
---

Support `@nodeboot/core` 2.x and drop the upper version bound on the Node-Boot and TypeORM peer dependencies.

`@nodeboot/core` 2.0.0 made Nonna the default dependency injection container, and every `useNodeBoot()` test failed its startup check with "Unsupported @nodeboot/core@2.0.0". The test framework only touches the container through `ApplicationContext.getIocContainer()` (`get`/`reset`), which both majors provide. The peer ranges are now open-ended (`@nodeboot/core >=1.16.0`, `@nodeboot/context >=2.2.0`, `@nodeboot/config >=1.3.0`, `typeorm >=0.3.27`), and the runtime check only enforces those minimums, so future major releases no longer need a test-framework release just to be accepted.
