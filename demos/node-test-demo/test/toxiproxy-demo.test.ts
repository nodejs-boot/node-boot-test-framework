import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// Test that hook doesn't run when not configured
describe("Toxiproxy Demo - Inactive Hook", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, () => {
        // Intentionally NOT calling useToxiproxy() here
        // Hook should remain inactive
    });

    it("should not start Toxiproxy when hook is not configured", () => {
        // Attempting to use the hook should throw an error
        assert.throws(
            () => {
                useToxiproxy();
            },
            {
                message: "Toxiproxy not started yet. Ensure test lifecycle has begun.",
            },
            "Hook should not be active when not configured in setup phase",
        );

        console.log("✓ Hook correctly remains inactive when not configured");
    });
});

// Basic Toxiproxy test
describe("Toxiproxy Demo - Basic Usage", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy();
    });

    it("should start Toxiproxy container with default options", () => {
        const {container, host, controlPort} = useToxiproxy();

        // Verify Toxiproxy is running
        assert.ok(container, "Toxiproxy container should be defined");
        assert.ok(host, "Host should be defined");
        assert.ok(controlPort > 0, "Control port should be greater than 0");

        console.log(`Toxiproxy running at ${host}:${controlPort}`);
    });

    it("should set TOXIPROXY environment variables", () => {
        assert.ok(process.env["TOXIPROXY_HOST"], "TOXIPROXY_HOST should be set");
        assert.ok(process.env["TOXIPROXY_PORT"], "TOXIPROXY_PORT should be set");

        console.log(`TOXIPROXY_HOST: ${process.env["TOXIPROXY_HOST"]}`);
        console.log(`TOXIPROXY_PORT: ${process.env["TOXIPROXY_PORT"]}`);
    });
});

// Create proxy without toxics
describe("Toxiproxy Demo - Simple Proxy", () => {
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

    it("should create a proxy", () => {
        const {proxies, getProxy} = useToxiproxy();

        assert.strictEqual(proxies.size, 1, "Should have 1 proxy");

        const redisProxy = getProxy("redis");
        assert.ok(redisProxy, "Redis proxy should exist");
        assert.strictEqual(redisProxy.name, "redis");
        assert.strictEqual(redisProxy.upstream, "localhost:6379");
        assert.strictEqual(redisProxy.enabled, true);

        console.log(`Redis proxy: ${redisProxy.host}:${redisProxy.port} -> ${redisProxy.upstream}`);
    });
});

// Latency toxic
describe("Toxiproxy Demo - Latency Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "slow-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "latency",
                            stream: "downstream",
                            attributes: {
                                latency: 1000, // 1 second delay
                                jitter: 100, // 100ms jitter
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with latency toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("slow-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log(`Slow redis proxy configured with 1s latency`);
    });
});

// Bandwidth limit toxic
describe("Toxiproxy Demo - Bandwidth Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "limited-redis",
                    upstream: "localhost:6379",
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

    it("should create proxy with bandwidth limit", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("limited-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log(`Limited redis proxy configured with 100KB/s bandwidth`);
    });
});

// Timeout toxic
describe("Toxiproxy Demo - Timeout Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "timeout-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "timeout",
                            stream: "downstream",
                            attributes: {
                                timeout: 5000, // 5 seconds
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with timeout toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("timeout-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log(`Timeout redis proxy configured with 5s timeout`);
    });
});

// Multiple proxies
describe("Toxiproxy Demo - Multiple Proxies", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "redis",
                    upstream: "localhost:6379",
                },
                {
                    name: "postgres",
                    upstream: "localhost:5432",
                },
                {
                    name: "mongodb",
                    upstream: "localhost:27017",
                },
            ],
        });
    });

    it("should create multiple proxies", () => {
        const {proxies} = useToxiproxy();

        assert.strictEqual(proxies.size, 3, "Should have 3 proxies");

        const names = Array.from(proxies.keys());
        assert.ok(names.includes("redis"));
        assert.ok(names.includes("postgres"));
        assert.ok(names.includes("mongodb"));

        console.log(`Created ${proxies.size} proxies: ${names.join(", ")}`);
    });
});

// Dynamic toxic management
describe("Toxiproxy Demo - Dynamic Toxic Management", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "dynamic-redis",
                    upstream: "localhost:6379",
                },
            ],
        });
    });

    it("should add toxic dynamically", async () => {
        const {addToxic, getProxy} = useToxiproxy();

        const proxy = getProxy("dynamic-redis");
        assert.ok(proxy, "Proxy should exist");

        // Add latency toxic dynamically
        await addToxic("dynamic-redis", {
            type: "latency",
            stream: "downstream",
            name: "dynamic-latency",
            attributes: {
                latency: 500,
            },
        });

        console.log("✓ Added latency toxic dynamically");
    });

    it("should remove toxic dynamically", async () => {
        const {removeToxic} = useToxiproxy();

        await removeToxic("dynamic-redis", "dynamic-latency");

        console.log("✓ Removed toxic dynamically");
    });
});

// Proxy enable/disable
describe("Toxiproxy Demo - Enable/Disable Proxy", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "toggle-redis",
                    upstream: "localhost:6379",
                },
            ],
        });
    });

    it("should disable proxy", async () => {
        const {disableProxy, getProxy} = useToxiproxy();

        await disableProxy("toggle-redis");

        const proxy = getProxy("toggle-redis");
        assert.strictEqual(proxy?.enabled, false, "Proxy should be disabled");

        console.log("✓ Proxy disabled");
    });

    it("should enable proxy", async () => {
        const {enableProxy, getProxy} = useToxiproxy();

        await enableProxy("toggle-redis");

        const proxy = getProxy("toggle-redis");
        assert.strictEqual(proxy?.enabled, true, "Proxy should be enabled");

        console.log("✓ Proxy enabled");
    });
});

// Multiple toxics on single proxy
describe("Toxiproxy Demo - Multiple Toxics", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "degraded-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "latency",
                            stream: "downstream",
                            name: "latency-toxic",
                            attributes: {
                                latency: 1000,
                            },
                        },
                        {
                            type: "bandwidth",
                            stream: "downstream",
                            name: "bandwidth-toxic",
                            attributes: {
                                rate: 50,
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with multiple toxics", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("degraded-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Proxy created with latency + bandwidth toxics");
    });
});

// Slow close toxic
describe("Toxiproxy Demo - Slow Close Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "slow-close-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "slow_close",
                            stream: "downstream",
                            attributes: {
                                delay: 2000, // 2 second delay on close
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with slow close toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("slow-close-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Slow close toxic configured");
    });
});

// Slicer toxic
describe("Toxiproxy Demo - Slicer Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "sliced-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "slicer",
                            stream: "downstream",
                            attributes: {
                                average_size: 64,
                                size_variation: 32,
                                delay: 10,
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with slicer toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("sliced-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Slicer toxic configured");
    });
});

// Limit data toxic
describe("Toxiproxy Demo - Limit Data Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "limited-data-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "limit_data",
                            stream: "downstream",
                            attributes: {
                                bytes: 1024, // Limit to 1KB
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with limit data toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("limited-data-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Limit data toxic configured");
    });
});

// Down toxic (simulate service down)
describe("Toxiproxy Demo - Down Toxic", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "down-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "down",
                            stream: "downstream",
                            toxicity: 1.0, // 100% of connections will be closed
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with down toxic", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("down-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Down toxic configured - simulating service outage");
    });
});

// Toxicity probability
describe("Toxiproxy Demo - Toxicity Probability", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "intermittent-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "latency",
                            stream: "downstream",
                            toxicity: 0.5, // 50% of requests will have latency
                            attributes: {
                                latency: 1000,
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with 50% toxicity", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("intermittent-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Intermittent latency toxic configured (50% probability)");
    });
});

// Upstream and downstream toxics
describe("Toxiproxy Demo - Directional Toxics", () => {
    const {useToxiproxy} = useNodeBoot(EmptyApp, ({useToxiproxy}) => {
        useToxiproxy({
            proxies: [
                {
                    name: "bidirectional-redis",
                    upstream: "localhost:6379",
                    toxics: [
                        {
                            type: "latency",
                            stream: "upstream",
                            name: "upstream-latency",
                            attributes: {
                                latency: 100,
                            },
                        },
                        {
                            type: "latency",
                            stream: "downstream",
                            name: "downstream-latency",
                            attributes: {
                                latency: 200,
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should create proxy with upstream and downstream toxics", () => {
        const {getProxy} = useToxiproxy();

        const proxy = getProxy("bidirectional-redis");
        assert.ok(proxy, "Proxy should exist");

        console.log("✓ Bidirectional toxics configured (upstream: 100ms, downstream: 200ms)");
    });
});
