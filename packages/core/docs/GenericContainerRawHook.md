# GenericContainerRawHook

Factory-based variant of `GenericContainerHook` allowing full Testcontainers API surface (build images, custom pull policies, BuildKit, etc.). Complement to the extended documentation in `useGenericContainerRaw.md`.

## Registration

```ts
useGenericContainerRaw({
    containers: {
        nginx: () => new GenericContainer("nginx:alpine").withExposedPorts(80),
        customApp: () => GenericContainer.fromDockerfile("./app").withBuildkit().build(),
    },
});
```

## Access

```ts
const {host, getPort, container} = useGenericContainerRaw("nginx");
```

## Lifecycle

-   beforeStart: invokes each factory, configures runtime, starts container.
-   afterTests: stops all containers.

## API

-   `useGenericContainerRaw(options)` register.
-   `useGenericContainerRaw(name)` retrieve `ContainerInfo`.
-   `useGenericContainerRaw.useAll()` Map of all.

## When To Use

-   Need image build steps.
-   Conditional container creation logic.
-   Custom log consumers per container.

## See Also

Full examples: `useGenericContainerRaw.md`.
