# useGenericContainerRaw Hook

The `useGenericContainerRaw` hook provides maximum flexibility for creating and managing Docker containers using factory functions. Unlike the standard `useGenericContainer` hook, this hook allows you to provide a factory function that returns a configured `GenericContainer` instance, enabling advanced scenarios like building images from Dockerfiles, custom pull policies, and complex container configurations.

## Features

-   **Factory Function Approach**: Provide a function that returns a `GenericContainer` instance
-   **Image Building**: Support for building images from Dockerfiles with full configuration
-   **Advanced Configuration**: Full access to all Testcontainers features
-   **Buildkit Support**: Enable Docker Buildkit for faster builds
-   **Custom Pull Policies**: Control when and how images are pulled
-   **Multi-stage Builds**: Target specific stages in multi-stage Dockerfiles
-   **Platform Specification**: Build for specific platforms (linux/amd64, linux/arm64, etc.)
-   **Build Arguments**: Pass build-time variables to Dockerfile
-   **Cache Control**: Enable or disable Docker build cache
-   **Async Factories**: Support for asynchronous factory functions
-   **Lifecycle Management**: Automatic container startup and cleanup

## Basic Usage

### Simple Container Factory

```typescript
import {useNodeBoot} from "@nodeboot/test";
import {GenericContainer} from "testcontainers";

const {useGenericContainerRaw} = useNodeBoot(MyApp, ({useGenericContainerRaw}) => {
    useGenericContainerRaw({
        containers: {
            nginx: () => new GenericContainer("nginx:alpine").withExposedPorts(80).withEnvironment({NGINX_PORT: "80"}),
        },
    });
});

test("should start nginx container", async () => {
    const {container, host, getPort} = useGenericContainerRaw("nginx");

    const port = getPort(80);
    const url = `http://${host}:${port}`;

    // Container is ready to use
    console.log("Nginx available at:", url);
});
```

## Image Building Scenarios

### Build from Dockerfile

```typescript
useGenericContainerRaw({
    containers: {
        "custom-app": () => {
            return GenericContainer.fromDockerfile("./my-app-context").build();
        },
    },
});
```

### Build with Custom Image Name

```typescript
useGenericContainerRaw({
    containers: {
        "named-build": () => {
            return GenericContainer.fromDockerfile("./app-context").build("my-custom-app:test", {deleteOnExit: false});
        },
    },
});
```

### Build with Buildkit

```typescript
useGenericContainerRaw({
    containers: {
        "buildkit-app": () => {
            return GenericContainer.fromDockerfile("./buildkit-context").withBuildkit().build();
        },
    },
});
```

## Pull Policy Configuration

### Always Pull Images

```typescript
import {GenericContainer, PullPolicy} from "testcontainers";

useGenericContainerRaw({
    containers: {
        "always-fresh": () => {
            return GenericContainer.fromDockerfile("./app-context").withPullPolicy(PullPolicy.alwaysPull()).build();
        },
    },
});
```

### Never Pull Images

```typescript
useGenericContainerRaw({
    containers: {
        "local-only": () => {
            return GenericContainer.fromDockerfile("./app-context").withPullPolicy(PullPolicy.neverPull()).build();
        },
    },
});
```

### Custom Pull Policy

```typescript
import {GenericContainer, ImagePullPolicy} from "testcontainers";

class CustomPullPolicy implements ImagePullPolicy {
    public shouldPull(): boolean {
        // Custom logic - e.g., only pull in CI environment
        return process.env.CI === "true";
    }
}

useGenericContainerRaw({
    containers: {
        "conditional-pull": () => {
            return GenericContainer.fromDockerfile("./app-context").withPullPolicy(new CustomPullPolicy()).build();
        },
    },
});
```

## Build Arguments

### Static Build Arguments

```typescript
useGenericContainerRaw({
    containers: {
        "with-args": () => {
            return GenericContainer.fromDockerfile("./app-context")
                .withBuildArgs({
                    NODE_VERSION: "20",
                    APP_ENV: "test",
                    BUILD_TIME: new Date().toISOString(),
                })
                .build();
        },
    },
});
```

### Dynamic Build Arguments

```typescript
useGenericContainerRaw({
    containers: {
        "dynamic-args": () => {
            const buildArgs = {
                NODE_VERSION: process.env.NODE_VERSION || "18",
                TIMESTAMP: Date.now().toString(),
                GIT_COMMIT: process.env.GITHUB_SHA || "dev",
            };

            return GenericContainer.fromDockerfile("./app-context").withBuildArgs(buildArgs).build();
        },
    },
});
```

## Multi-stage Build Targets

### Target Specific Stage

```typescript
useGenericContainerRaw({
    containers: {
        "dev-stage": () => {
            return GenericContainer.fromDockerfile("./multi-stage-context").withTarget("development").build();
        },
        "prod-stage": () => {
            return GenericContainer.fromDockerfile("./multi-stage-context").withTarget("production").build();
        },
    },
});

test("should use development stage", async () => {
    const {container} = useGenericContainerRaw("dev-stage");
    // Development stage with debugging tools
});

test("should use production stage", async () => {
    const {container} = useGenericContainerRaw("prod-stage");
    // Optimized production stage
});
```

## Platform Specification

### Cross-platform Builds

```typescript
useGenericContainerRaw({
    containers: {
        "amd64-build": () => {
            return GenericContainer.fromDockerfile("./app-context").withPlatform("linux/amd64").build();
        },
        "arm64-build": () => {
            return GenericContainer.fromDockerfile("./app-context").withPlatform("linux/arm64").build();
        },
    },
});

test("should build for AMD64", async () => {
    const {container} = useGenericContainerRaw("amd64-build");
    // AMD64 specific tests
});
```

## Custom Dockerfile Path

### Non-standard Dockerfile Name

```typescript
useGenericContainerRaw({
    containers: {
        "custom-dockerfile": () => {
            return GenericContainer.fromDockerfile("./context", "Dockerfile.test").build();
        },
        "dev-dockerfile": () => {
            return GenericContainer.fromDockerfile("./context", "Dockerfile.development").build();
        },
    },
});
```

## Cache Control

### Disable Build Cache

```typescript
useGenericContainerRaw({
    containers: {
        "no-cache-build": () => {
            return GenericContainer.fromDockerfile("./app-context")
                .withCache(false) // Force rebuild every time
                .build();
        },
    },
});
```

### Enable Build Cache

```typescript
useGenericContainerRaw({
    containers: {
        "cached-build": () => {
            return GenericContainer.fromDockerfile("./app-context")
                .withCache(true) // Use build cache for faster builds
                .build();
        },
    },
});
```

## Advanced Scenarios

### Complex Build Configuration

```typescript
useGenericContainerRaw({
    containers: {
        "complex-app": () => {
            return GenericContainer.fromDockerfile("./complex-app")
                .withBuildArgs({
                    NODE_VERSION: "20",
                    NPM_VERSION: "10",
                    BUILD_ENV: "production",
                    API_URL: "https://api.test.com",
                })
                .withTarget("production")
                .withPlatform("linux/amd64")
                .withBuildkit()
                .withCache(false)
                .withPullPolicy(PullPolicy.alwaysPull())
                .build("my-complex-app:test", {deleteOnExit: true});
        },
    },
});
```

### Environment-specific Configuration

```typescript
useGenericContainerRaw({
    containers: {
        "env-specific": () => {
            const isCI = process.env.CI === "true";
            const isDev = process.env.NODE_ENV === "development";

            let container = GenericContainer.fromDockerfile("./app-context").withBuildArgs({
                NODE_ENV: process.env.NODE_ENV || "test",
            });

            if (isCI) {
                container = container.withPullPolicy(PullPolicy.alwaysPull()).withCache(false);
            }

            if (isDev) {
                container = container.withTarget("development").withBuildArgs({DEBUG: "true"});
            }

            return container.build();
        },
    },
});
```

## Async Factory Functions

### Asynchronous Setup

```typescript
useGenericContainerRaw({
    containers: {
        "async-setup": async () => {
            // Perform async setup before building
            const config = await fetchBuildConfig();

            return GenericContainer.fromDockerfile("./app-context")
                .withBuildArgs(config.buildArgs)
                .withTarget(config.target)
                .build();
        },
    },
});

async function fetchBuildConfig() {
    // Simulate fetching configuration from external source
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
        buildArgs: {VERSION: "1.0.0"},
        target: "production",
    };
}
```

### Conditional Container Creation

```typescript
useGenericContainerRaw({
    containers: {
        conditional: async () => {
            const useLocal = await checkLocalImageExists();

            if (useLocal) {
                return new GenericContainer("my-local-image:latest").withExposedPorts(8080);
            } else {
                return GenericContainer.fromDockerfile("./fallback-context").build();
            }
        },
    },
});
```

## API Reference

### useGenericContainerRaw(options?: GenericContainerRawOptions)

Configures containers using factory functions. Call this in the setup function passed to `useNodeBoot`.

```typescript
type ContainerFactory = () => GenericContainer | Promise<GenericContainer>;

type GenericContainerRawOptions = {
    containers?: Record<string, ContainerFactory>;
};
```

### useGenericContainerRaw(key: string)

Returns container information for the specified container. Call this within test functions.

```typescript
type ContainerInfo = {
    container: StartedTestContainer;
    host: string;
    ports: Map<number, number>;
    getPort: (containerPort: number) => number;
};
```

### useGenericContainerRaw.useAll()

Returns all container information as a Map.

```typescript
const allContainers: Map<string, ContainerInfo> = useGenericContainerRaw.useAll();
```

## Complete Example

```typescript
import {describe, test, expect} from "node:test";
import {useNodeBoot} from "@nodeboot/test";
import {GenericContainer, PullPolicy} from "testcontainers";

describe("Advanced Container Testing", () => {
    const {useGenericContainerRaw} = useNodeBoot(MyApp, ({useConfig, useGenericContainerRaw}) => {
        useConfig({
            database: {host: "localhost", port: 5432},
        });

        useGenericContainerRaw({
            containers: {
                // Build custom app image
                app: () => {
                    return GenericContainer.fromDockerfile("./docker/app")
                        .withBuildArgs({
                            NODE_VERSION: "20",
                            BUILD_ENV: "test",
                        })
                        .withTarget("test")
                        .withBuildkit()
                        .build();
                },

                // Use pre-built database image
                postgres: () => {
                    return new GenericContainer("postgres:15-alpine").withExposedPorts(5432).withEnvironment({
                        POSTGRES_DB: "testdb",
                        POSTGRES_USER: "test",
                        POSTGRES_PASSWORD: "test",
                    });
                },

                // Build Redis with custom config
                redis: async () => {
                    // Simulate async configuration loading
                    const config = await loadRedisConfig();

                    return GenericContainer.fromDockerfile("./docker/redis", "Dockerfile.redis")
                        .withBuildArgs({CONFIG: JSON.stringify(config)})
                        .withCache(false)
                        .build();
                },
            },
        });
    });

    test("should connect app to database", async () => {
        const app = useGenericContainerRaw("app");
        const db = useGenericContainerRaw("postgres");

        const appPort = app.getPort(3000);
        const dbPort = db.getPort(5432);

        // Test app connection to database
        const response = await fetch(`http://${app.host}:${appPort}/health`);
        expect(response.status).toBe(200);

        const health = await response.json();
        expect(health.database.connected).toBe(true);
    });

    test("should cache data in Redis", async () => {
        const app = useGenericContainerRaw("app");
        const redis = useGenericContainerRaw("redis");

        const appPort = app.getPort(3000);

        // Test Redis caching
        await fetch(`http://${app.host}:${appPort}/cache/test`, {
            method: "POST",
            body: JSON.stringify({key: "test", value: "data"}),
        });

        const cached = await fetch(`http://${app.host}:${appPort}/cache/test`);
        const data = await cached.json();

        expect(data.value).toBe("data");
    });
});

async function loadRedisConfig() {
    return {
        maxmemory: "256mb",
        maxmemoryPolicy: "allkeys-lru",
    };
}
```

## Best Practices

### 1. Use Specific Image Tags

```typescript
// ✅ Good - specific version
() => new GenericContainer('redis:7.2-alpine')

// ❌ Avoid - may break in future
() => new GenericContainer('redis:latest')
```

### 2. Leverage Build Cache in Development

```typescript
() => {
    const isDev = process.env.NODE_ENV === "development";

    return GenericContainer.fromDockerfile("./app-context")
        .withCache(isDev) // Cache in dev, no cache in CI
        .build();
};
```

### 3. Use Environment-specific Configuration

```typescript
() => {
    const buildArgs = {
        NODE_ENV: process.env.NODE_ENV || "test",
        ...(process.env.CI && {OPTIMIZE: "true"}),
    };

    return GenericContainer.fromDockerfile("./app-context").withBuildArgs(buildArgs).build();
};
```

### 4. Handle Async Operations Properly

```typescript
// ✅ Good - proper async handling
'async-container': async () => {
    const config = await getConfig();
    return GenericContainer.fromDockerfile('./context')
        .withBuildArgs(config)
        .build();
}

// ❌ Avoid - not handling async properly
'sync-container': () => {
    getConfig().then(config => {
        // This won't work as expected
    });
    return GenericContainer.fromDockerfile('./context').build();
}
```

### 5. Meaningful Container Names

```typescript
useGenericContainerRaw({
    containers: {
        "user-service-api": () => buildUserServiceContainer(),
        "postgres-main-db": () => buildPostgresContainer(),
        "redis-session-cache": () => buildRedisContainer(),
    },
});
```

## Troubleshooting

### Build Context Issues

```typescript
// Ensure your Dockerfile context path is correct
() => {
    console.log("Building from:", process.cwd());
    return GenericContainer.fromDockerfile("./docker/app") // Relative to current working directory
        .build();
};
```

### Build Argument Problems

```typescript
// Debug build arguments
() => {
    const buildArgs = {NODE_VERSION: "20", DEBUG: "true"};
    console.log("Build args:", buildArgs);

    return GenericContainer.fromDockerfile("./context").withBuildArgs(buildArgs).build();
};
```

### Platform Issues

```typescript
// Handle platform-specific builds
() => {
    const platform = process.arch === "arm64" ? "linux/arm64" : "linux/amd64";

    return GenericContainer.fromDockerfile("./context").withPlatform(platform).build();
};
```

### Factory Function Errors

```typescript
// Handle errors in factory functions
'error-prone-container': async () => {
    try {
        const config = await riskyAsyncOperation();
        return GenericContainer.fromDockerfile('./context')
            .withBuildArgs(config)
            .build();
    } catch (error) {
        console.error('Factory function failed:', error);
        // Fallback to simple container
        return new GenericContainer('nginx:alpine');
    }
}
```

## Performance Tips

### 1. Reuse Built Images

```typescript
// Build once, reuse multiple times
() => GenericContainer.fromDockerfile("./app-context").build("my-app:test", {deleteOnExit: false});
```

### 2. Use Multi-stage Builds

```typescript
// Target specific stages for different test scenarios
'unit-tests': () => GenericContainer
    .fromDockerfile('./context')
    .withTarget('test')
    .build(),

'integration-tests': () => GenericContainer
    .fromDockerfile('./context')
    .withTarget('integration')
    .build()
```

### 3. Optimize Build Context

```typescript
// Use .dockerignore to reduce build context size
// Keep Dockerfile and context as small as possible
```

The `useGenericContainerRaw` hook provides the ultimate flexibility for container testing scenarios, enabling you to leverage the full power of Testcontainers while maintaining the convenience of NodeBoot's lifecycle management.
