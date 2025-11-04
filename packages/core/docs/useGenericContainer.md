# useGenericContainer Hook

The `useGenericContainer` hook allows you to spin up any generic Docker container using Testcontainers for your integration tests. It provides maximum flexibility for testing with any Docker image and automatically handles container lifecycle management.

## Features

-   **Any Docker Image**: Use any Docker image available on Docker Hub or custom registries
-   **Multiple Containers**: Configure and run multiple containers simultaneously
-   **Port Mapping**: Automatic port mapping with easy access to mapped ports
-   **Container Runtime Detection**: Automatically detects and configures Docker/Podman
-   **Lifecycle Management**: Automatic container startup before tests and cleanup after tests
-   **Command Execution**: Execute commands inside running containers
-   **Environment Variables**: Set environment variables in containers
-   **Working Directory**: Configure container working directory
-   **Advanced Options**: Support for privileged mode, labels, platform specification, and more

## Basic Usage

### Single Container

```typescript
import {useNodeBoot} from "@nodeboot/test";

const {useGenericContainer} = useNodeBoot(MyApp, ({useGenericContainer}) => {
    useGenericContainer({
        containers: {
            redis: {
                image: "redis:7-alpine",
                exposedPorts: [6379],
            },
        },
    });
});

test("should connect to Redis", async () => {
    const redis = useGenericContainer("redis");
    const redisUrl = `redis://${redis.host}:${redis.getPort(6379)}`;
    // Use redisUrl to connect to Redis...
});
```

### Multiple Containers

```typescript
const {useGenericContainer} = useNodeBoot(MyApp, ({useGenericContainer}) => {
    useGenericContainer({
        containers: {
            postgres: {
                image: "postgres:15-alpine",
                exposedPorts: [5432],
                environment: {
                    POSTGRES_DB: "testdb",
                    POSTGRES_USER: "testuser",
                    POSTGRES_PASSWORD: "testpass",
                },
            },
            redis: {
                image: "redis:7-alpine",
                exposedPorts: [6379],
            },
            elasticsearch: {
                image: "elasticsearch:8.11.0",
                exposedPorts: [9200, 9300],
                environment: {
                    "discovery.type": "single-node",
                    "xpack.security.enabled": "false",
                },
            },
        },
    });
});

test("should work with multiple databases", async () => {
    const postgres = useGenericContainer("postgres");
    const redis = useGenericContainer("redis");
    const elasticsearch = useGenericContainer("elasticsearch");

    // Each container provides host, ports map, and getPort method
    console.log("PostgreSQL:", `${postgres.host}:${postgres.getPort(5432)}`);
    console.log("Redis:", `${redis.host}:${redis.getPort(6379)}`);
    console.log("Elasticsearch:", `http://${elasticsearch.host}:${elasticsearch.getPort(9200)}`);
});
```

## Configuration Options

### ContainerOptions

Each container can be configured with the following options:

```typescript
type ContainerOptions = {
    image: string; // Required: Container image
    name?: string; // Optional: Container name
    command?: string[]; // Optional: Command to run
    entrypoint?: string[]; // Optional: Entrypoint
    environment?: Record<string, string>; // Optional: Environment variables
    exposedPorts?: number[]; // Optional: Ports to expose
    workingDir?: string; // Optional: Working directory
    user?: string; // Optional: User (format: <name|uid>[:<group|gid>])
    privilegedMode?: boolean; // Optional: Run in privileged mode
    labels?: Record<string, string>; // Optional: Labels
    autoRemove?: boolean; // Optional: Auto-remove container
    reuse?: boolean; // Optional: Reuse container
    platform?: string; // Optional: Platform (e.g., "linux/arm64")
    defaultLogDriver?: boolean; // Optional: Use default log driver
    waitForLog?: string; // Optional: Wait for log message
    waitForLogTimeout?: number; // Optional: Timeout for waiting (ms)
};
```

### GenericContainerOptions

The main configuration object:

```typescript
type GenericContainerOptions = {
    containers?: Record<string, ContainerOptions>; // Named containers to create
};
```

## Advanced Examples

### Database Container with Custom Configuration

```typescript
useGenericContainer({
    containers: {
        mongodb: {
            image: "mongo:7",
            exposedPorts: [27017],
            environment: {
                MONGO_INITDB_ROOT_USERNAME: "admin",
                MONGO_INITDB_ROOT_PASSWORD: "password",
                MONGO_INITDB_DATABASE: "testdb",
            },
            command: ["mongod", "--auth"],
        },
    },
});
```

### Web Server Container

```typescript
useGenericContainer({
    containers: {
        nginx: {
            image: "nginx:alpine",
            exposedPorts: [80, 443],
            labels: {
                "test.container": "nginx",
                "test.purpose": "web-server",
            },
            workingDir: "/usr/share/nginx/html",
        },
    },
});
```

### Message Queue Container

```typescript
useGenericContainer({
    containers: {
        rabbitmq: {
            image: "rabbitmq:3-management-alpine",
            exposedPorts: [5672, 15672], // AMQP and Management UI
            environment: {
                RABBITMQ_DEFAULT_USER: "guest",
                RABBITMQ_DEFAULT_PASS: "guest",
            },
        },
    },
});
```

### Long-running Service Container

```typescript
useGenericContainer({
    containers: {
        alpine: {
            image: "alpine:latest",
            command: ["sleep", "infinity"], // Keep container running
            workingDir: "/app",
            user: "1000:1000",
            environment: {
                PATH: "/usr/local/bin:/usr/bin:/bin",
            },
        },
    },
});

test("should execute commands in Alpine container", async () => {
    const alpine = useGenericContainer("alpine");

    // Install and use tools
    await alpine.container.exec(["apk", "add", "--no-cache", "curl"]);
    const result = await alpine.container.exec(["curl", "--version"]);
    expect(result.exitCode).toBe(0);
});
```

## API Reference

### useGenericContainer(containerName: string)

Returns a `ContainerInfo` object for the specified container.

```typescript
type ContainerInfo = {
    container: StartedTestContainer; // Testcontainers instance
    host: string; // Container host
    ports: Map<number, number>; // Port mappings
    getPort: (containerPort: number) => number; // Get mapped port
};
```

### ContainerInfo Methods

#### container.exec(command: string[], options?)

Execute a command in the container:

```typescript
const result = await container.exec(["ls", "-la", "/app"]);
// result: { output: string, stdout: string, stderr: string, exitCode: number }
```

#### getPort(containerPort: number)

Get the host port mapped to a container port:

```typescript
const redis = useGenericContainer("redis");
const hostPort = redis.getPort(6379); // e.g., returns 54321
```

#### Access Container Properties

```typescript
const container = useGenericContainer("postgres");
console.log("Host:", container.host); // e.g., "localhost"
console.log("Container ID:", container.container.getId());
console.log("Port 5432 maps to:", container.getPort(5432));
```

## Best Practices

### 1. Use Specific Image Tags

```typescript
// ✅ Good - specific version
image: "postgres:15.4-alpine";

// ❌ Avoid - may break in future
image: "postgres:latest";
```

### 2. Set Required Environment Variables

```typescript
postgres: {
    image: 'postgres:15-alpine',
    environment: {
        POSTGRES_DB: 'testdb',
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass'
    }
}
```

### 3. Use Meaningful Container Names

```typescript
// ✅ Good - descriptive names
containers: {
    userDatabase: { image: 'postgres:15' },
    sessionStore: { image: 'redis:7' },
    searchEngine: { image: 'elasticsearch:8' }
}

// ❌ Avoid - generic names
containers: {
    db1: { image: 'postgres:15' },
    cache: { image: 'redis:7' }
}
```

### 4. Wait for Container Readiness

For containers that need time to initialize:

```typescript
elasticsearch: {
    image: 'elasticsearch:8.11.0',
    waitForLog: 'started', // Wait for this log message
    waitForLogTimeout: 60000 // 60 seconds timeout
}
```

### 5. Clean Resource Usage

The hook automatically manages container lifecycle, but you can optimize:

```typescript
// Containers are automatically stopped after tests
// No manual cleanup needed
```

## Troubleshooting

### Container Runtime Issues

The hook automatically detects Docker/Podman, but you can debug:

```typescript
// Check logs for container runtime detection messages
// [GenericContainerHook] Using container runtime: docker
```

### Port Conflicts

Testcontainers automatically maps to available ports:

```typescript
// Container port 5432 might map to host port 54321
const postgres = useGenericContainer("postgres");
const actualPort = postgres.getPort(5432); // Always use this
```

### Container Startup Failures

Check container logs and configuration:

```typescript
test("debug container startup", async () => {
    const container = useGenericContainer("myservice");

    // Get logs if container fails to start
    const logs = await container.container.logs();
    logs.on("data", line => console.log("Container log:", line));
});
```

### Memory and Performance

For resource-intensive containers:

```typescript
heavyService: {
    image: 'my-heavy-service:latest',
    // Consider container reuse for multiple tests
    reuse: true
}
```

## Integration Examples

### With Database ORMs

```typescript
test("should work with TypeORM", async () => {
    const postgres = useGenericContainer("postgres");

    const connection = await createConnection({
        type: "postgres",
        host: postgres.host,
        port: postgres.getPort(5432),
        username: "testuser",
        password: "testpass",
        database: "testdb",
    });

    // Use connection for tests...
});
```

### With HTTP Clients

```typescript
test("should make HTTP requests to containerized service", async () => {
    const nginx = useGenericContainer("nginx");
    const baseURL = `http://${nginx.host}:${nginx.getPort(80)}`;

    const response = await fetch(`${baseURL}/health`);
    expect(response.status).toBe(200);
});
```

The `useGenericContainer` hook provides a powerful and flexible way to integrate any Docker container into your Node Boot tests, enabling comprehensive integration testing with real services and dependencies.
