# ToxiproxyHook

The `ToxiproxyHook` provides a Toxiproxy container for testing network conditions and service degradation. Toxiproxy allows you to simulate various network problems like latency, bandwidth limits, connection failures, and more.

## Important Note

**The hook only runs when explicitly configured** by calling `useToxiproxy()` in the setup phase. If you don't call this function, the hook is inactive and won't affect your test lifecycle.

## Features

-   **Network Condition Simulation**: Test latency, bandwidth limits, timeouts, and connection failures
-   **Multiple Proxies**: Configure multiple service proxies in a single container
-   **Dynamic Toxic Management**: Add, remove, enable, and disable toxics at runtime
-   **Directional Toxics**: Apply toxics to upstream or downstream traffic independently
-   **Toxicity Probability**: Configure toxics to apply only to a percentage of connections
-   **No Service Modification**: Test network resilience without modifying your services
-   **Opt-in Activation**: Only runs when explicitly configured

## What is Toxiproxy?

Toxiproxy is a framework for simulating network conditions. It's particularly useful for testing:

-   How your application handles slow network connections
-   Behavior under bandwidth constraints
-   Recovery from connection failures
-   Timeout handling
-   Packet loss and corruption scenarios

## Installation

```bash
pnpm add -D @testcontainers/toxiproxy toxiproxy-node-client
```

## Basic Usage

### Hook Activation

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("Toxiproxy Test", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy(); // Activates the hook
    });

    it("should have Toxiproxy running", () => {
        const {host, controlPort} = useToxiproxy();
        console.log(`Toxiproxy at ${host}:${controlPort}`);

        assert.ok(host);
        assert.ok(controlPort > 0);
    });
});
```

## Configuration Options

### Simple Proxy

Create a proxy without any toxics:

```typescript
describe("Simple Redis Proxy", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "redis",
                    upstream: "localhost:6379",
                },
            ],
        });
    });

    it("should proxy to Redis", () => {
        const {getProxy} = useToxiproxy();
        const redis = getProxy("redis");

        // Connect to redis.host:redis.port instead of localhost:6379
        console.log(`Connect to Redis via: ${redis.host}:${redis.port}`);
    });
});
```

### Latency Toxic

Add network latency to simulate slow connections:

```typescript
describe("Slow Network", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "slow-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "latency",
                            stream: "downstream",
                            attributes: {
                                latency: 1000, // 1 second delay
                                jitter: 200, // ±200ms variation
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should add 1s latency to responses", async () => {
        // Test your application's behavior with slow responses
    });
});
```

### Bandwidth Limit

Limit connection bandwidth:

```typescript
describe("Limited Bandwidth", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "limited-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "bandwidth",
                            stream: "downstream",
                            attributes: {
                                rate: 100, // 100 KB/s
                            },
                        },
                    ],
                },
            ],
        });
    });
});
```

### Connection Timeout

Simulate connection timeouts:

```typescript
describe("Connection Timeout", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "timeout-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "timeout",
                            stream: "downstream",
                            attributes: {
                                timeout: 5000, // 5 second timeout
                            },
                        },
                    ],
                },
            ],
        });
    });
});
```

### Service Down

Simulate complete service outage:

```typescript
describe("Service Outage", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "down-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "down",
                            stream: "downstream",
                            toxicity: 1.0, // 100% of connections fail
                        },
                    ],
                },
            ],
        });
    });
});
```

## Available Toxics

### 1. Latency

Adds delay to connections.

```typescript
{
    type: "latency",
    stream: "downstream",
    attributes: {
        latency: 1000, // Delay in milliseconds
        jitter: 100    // Random variation (±ms)
    }
}
```

### 2. Down

Closes connections immediately.

```typescript
{
    type: "down",
    stream: "downstream",
    toxicity: 1.0 // Probability (0.0 - 1.0)
}
```

### 3. Bandwidth

Limits connection bandwidth.

```typescript
{
    type: "bandwidth",
    stream: "downstream",
    attributes: {
        rate: 100 // KB/s
    }
}
```

### 4. Slow Close

Delays closing the connection.

```typescript
{
    type: "slow_close",
    stream: "downstream",
    attributes: {
        delay: 2000 // Milliseconds
    }
}
```

### 5. Timeout

Stops data transfer after timeout.

```typescript
{
    type: "timeout",
    stream: "downstream",
    attributes: {
        timeout: 5000 // Milliseconds
    }
}
```

### 6. Slicer

Slices TCP packets into smaller chunks.

```typescript
{
    type: "slicer",
    stream: "downstream",
    attributes: {
        average_size: 64,     // Bytes
        size_variation: 32,   // Bytes
        delay: 10             // Microseconds between slices
    }
}
```

### 7. Limit Data

Limits total data transferred.

```typescript
{
    type: "limit_data",
    stream: "downstream",
    attributes: {
        bytes: 1024 // Total bytes before closing
    }
}
```

## Dynamic Toxic Management

### Add Toxic at Runtime

```typescript
describe("Dynamic Toxics", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [{name: "api", upstream: "localhost:3000"}],
        });
    });

    it("should add latency dynamically", async () => {
        const {addToxic} = useToxiproxy();

        // Add latency during test
        await addToxic("api", {
            type: "latency",
            stream: "downstream",
            name: "test-latency",
            attributes: {latency: 500},
        });
    });
});
```

### Remove Toxic at Runtime

```typescript
it("should remove toxic", async () => {
    const {removeToxic} = useToxiproxy();
    await removeToxic("api", "test-latency");
});
```

### Enable/Disable Proxy

```typescript
it("should disable proxy", async () => {
    const {disableProxy} = useToxiproxy();
    await disableProxy("api"); // All connections will fail
});

it("should enable proxy", async () => {
    const {enableProxy} = useToxiproxy();
    await enableProxy("api"); // Restore connections
});
```

## Advanced Scenarios

### Intermittent Failures

Use toxicity probability for realistic scenarios:

```typescript
{
    type: "latency",
    stream: "downstream",
    toxicity: 0.3, // Only 30% of requests affected
    attributes: {
        latency: 2000
    }
}
```

### Bidirectional Toxics

Apply different toxics to upstream and downstream:

```typescript
toxics: [
    {
        type: "latency",
        stream: "upstream",
        name: "request-latency",
        attributes: {latency: 100},
    },
    {
        type: "bandwidth",
        stream: "downstream",
        name: "response-limit",
        attributes: {rate: 50},
    },
];
```

### Multiple Proxies

Test interactions between multiple services:

```typescript
useToxiproxy({
    proxies: [
        {
            name: "redis",
            upstream: "localhost:6379",
            toxics: [{type: "latency", stream: "downstream", attributes: {latency: 50}}],
        },
        {
            name: "postgres",
            upstream: "localhost:5432",
            toxics: [{type: "latency", stream: "downstream", attributes: {latency: 100}}],
        },
        {
            name: "api",
            upstream: "localhost:3000",
            toxics: [{type: "bandwidth", stream: "downstream", attributes: {rate: 100}}],
        },
    ],
});
```

## Testing Resilience Patterns

### Circuit Breaker

```typescript
describe("Circuit Breaker Test", () => {
    const {useToxiproxy} = useNodeBoot(MyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "flaky-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "timeout",
                            stream: "downstream",
                            toxicity: 0.5, // 50% failure rate
                            attributes: {timeout: 1000},
                        },
                    ],
                },
            ],
        });
    });

    it("should open circuit after failures", async () => {
        // Test that circuit breaker opens after threshold
    });
});
```

### Retry Logic

```typescript
describe("Retry Test", () => {
    const {useToxiproxy} = useNodeBoot(MyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "unreliable-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "down",
                            stream: "downstream",
                            toxicity: 0.7, // 70% failure rate
                        },
                    ],
                },
            ],
        });
    });

    it("should retry failed requests", async () => {
        // Test retry behavior
    });
});
```

### Timeout Handling

```typescript
describe("Timeout Handling", () => {
    const {useToxiproxy} = useNodeBoot(MyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "slow-api",
                    upstream: "localhost:3000",
                    toxics: [
                        {
                            type: "latency",
                            stream: "downstream",
                            attributes: {latency: 10000}, // 10 seconds
                        },
                    ],
                },
            ],
        });
    });

    it("should timeout and handle gracefully", async () => {
        // Test timeout behavior
    });
});
```

## Environment Variables

The hook sets these environment variables:

```typescript
process.env["TOXIPROXY_HOST"]; // Container host
process.env["TOXIPROXY_PORT"]; // Control API port
```

## Lifecycle

```
Setup Phase (if useToxiproxy() is called):
  └─ Hook state set to enabled

beforeAll (if enabled):
  ├─ Detect and configure container runtime
  ├─ Start Toxiproxy container
  ├─ Configure proxies
  ├─ Apply toxics
  └─ Set environment variables

Test Execution:
  └─ Proxies available via useToxiproxy()

afterAll (if enabled):
  └─ Stop Toxiproxy container and cleanup

If useToxiproxy() is NOT called:
  └─ Hook remains inactive
```

## TypeScript Types

```typescript
export type ToxicType = "latency" | "down" | "bandwidth" | "slow_close" | "timeout" | "slicer" | "limit_data";

export type ToxicDirection = "upstream" | "downstream";

export type ToxicConfig = {
    type: ToxicType;
    stream: ToxicDirection;
    name?: string;
    toxicity?: number; // 0.0 - 1.0
    attributes?: Record<string, any>;
};

export type ProxyConfig = {
    name: string;
    upstream: string;
    enabled?: boolean;
    toxics?: ToxicConfig[];
};

export type ToxiproxyOptions = {
    image?: string;
    proxies?: ProxyConfig[];
    containerLogging?: boolean;
};
```

## Return Type

```typescript
{
    container: StartedToxiProxyContainer;
    host: string;
    controlPort: number;
    proxies: Map<string, ProxyInfo>;
    getProxy: (name: string) => ProxyInfo | undefined;
    addToxic: (proxyName: string, toxic: ToxicConfig) => Promise<void>;
    removeToxic: (proxyName: string, toxicName: string) => Promise<void>;
    enableProxy: (proxyName: string) => Promise<void>;
    disableProxy: (proxyName: string) => Promise<void>;
}
```

## Best Practices

1. **Start Simple**: Begin with basic toxics (latency, down) before complex scenarios
2. **Realistic Values**: Use realistic network conditions based on your deployment environment
3. **Test Recovery**: Focus on testing how your application recovers, not just fails
4. **Isolate Toxics**: Test one toxic at a time initially
5. **Document Scenarios**: Clearly document what network condition each test simulates

## Common Use Cases

### Slow Third-Party APIs

```typescript
useToxiproxy({
    proxies: [
        {
            name: "payment-gateway",
            upstream: "payment-api:443",
            toxics: [
                {
                    type: "latency",
                    stream: "downstream",
                    attributes: {latency: 3000, jitter: 1000},
                },
            ],
        },
    ],
});
```

### Database Connection Issues

```typescript
useToxiproxy({
    proxies: [
        {
            name: "database",
            upstream: "postgres:5432",
            toxics: [
                {
                    type: "timeout",
                    stream: "downstream",
                    toxicity: 0.1, // 10% of queries timeout
                    attributes: {timeout: 5000},
                },
            ],
        },
    ],
});
```

### Rate-Limited Services

```typescript
useToxiproxy({
    proxies: [
        {
            name: "rate-limited-api",
            upstream: "api:3000",
            toxics: [
                {
                    type: "limit_data",
                    stream: "downstream",
                    attributes: {bytes: 10240}, // 10KB limit
                },
            ],
        },
    ],
});
```

## Troubleshooting

### Proxy Not Working

Ensure you're connecting to the proxied port:

```typescript
const {getProxy} = useToxiproxy();
const proxy = getProxy("redis");
// Connect to proxy.host:proxy.port, NOT localhost:6379
```

### Toxics Not Applied

Check stream direction (upstream vs downstream) and toxicity probability.

### Container Won't Start

Ensure Docker is running and testcontainers is properly configured.

## See Also

-   [GenericContainerHook](./GenericContainerHook.md) - For general container needs
-   [MongoContainerHook](./MongoContainerHook.md) - MongoDB-specific testing
-   [Toxiproxy GitHub](https://github.com/Shopify/toxiproxy) - Official documentation
-   [Testcontainers Toxiproxy](https://node.testcontainers.org/modules/toxiproxy/) - Module docs
