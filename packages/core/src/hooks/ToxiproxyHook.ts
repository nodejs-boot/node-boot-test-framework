import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {CreatedProxy, StartedToxiProxyContainer, ToxiProxyContainer} from "@testcontainers/toxiproxy";
import {configureContainerRuntime, detectContainerRuntime} from "../utils/container-runtime";

/**
 * Toxic types available in Toxiproxy
 */
export type ToxicType =
    | "latency" // Add delay to all data going through the proxy
    | "down" // Bring the service down by closing connections
    | "bandwidth" // Limit bandwidth of connection
    | "slow_close" // Delay closing connection
    | "timeout" // Stop all data from getting through and close connection after timeout
    | "slicer" // Slice TCP packets into smaller bits
    | "limit_data"; // Limit data getting through the connection

export type ToxicDirection = "upstream" | "downstream";

/**
 * Configuration for a toxic
 */
export type ToxicConfig = {
    type: ToxicType; // Type of toxic
    stream: ToxicDirection; // Direction of the toxic
    name?: string; // Name for this toxic (auto-generated if not provided)
    toxicity?: number; // Probability of toxic being applied (0.0 - 1.0, default: 1.0)
    attributes?: Record<string, any>; // Toxic-specific attributes
};

/**
 * Latency toxic attributes
 */
export type LatencyToxicAttributes = {
    latency: number; // Latency in milliseconds
    jitter?: number; // Jitter in milliseconds (default: 0)
};

/**
 * Bandwidth toxic attributes
 */
export type BandwidthToxicAttributes = {
    rate: number; // Bandwidth rate in KB/s
};

/**
 * Slow close toxic attributes
 */
export type SlowCloseToxicAttributes = {
    delay: number; // Delay in milliseconds
};

/**
 * Timeout toxic attributes
 */
export type TimeoutToxicAttributes = {
    timeout: number; // Timeout in milliseconds
};

/**
 * Slicer toxic attributes
 */
export type SlicerToxicAttributes = {
    average_size: number; // Average size of sliced packets in bytes
    size_variation: number; // Variation in size
    delay: number; // Delay between slices in microseconds
};

/**
 * Limit data toxic attributes
 */
export type LimitDataToxicAttributes = {
    bytes: number; // Number of bytes to allow through
};

/**
 * Proxy configuration
 */
export type ProxyConfig = {
    name: string; // Name for this proxy
    upstream: string; // Upstream address to proxy to (e.g., "localhost:6379")
    enabled?: boolean; // Whether proxy is enabled (default: true)
    toxics?: ToxicConfig[]; // Toxics to apply to this proxy
};

/**
 * Toxiproxy hook options
 */
export type ToxiproxyOptions = {
    image?: string; // Toxiproxy image (default: "ghcr.io/shopify/toxiproxy:2.9.0")
    proxies?: ProxyConfig[]; // Proxies to configure
    containerLogging?: boolean; // Enable container logging
};

/**
 * Started proxy information
 */
export type ProxyInfo = {
    name: string;
    host: string;
    port: number;
    upstream: string;
    enabled: boolean;
    proxy: CreatedProxy;
};

export const TOXIPROXY_HOST = "TOXIPROXY_HOST";
export const TOXIPROXY_PORT = "TOXIPROXY_PORT";

/**
 * Spins up a Toxiproxy container for testing network conditions.
 * Allows simulation of network latency, bandwidth limits, connection failures, etc.
 *
 * Toxiproxy is a framework for simulating network conditions. It's particularly
 * useful for testing how your application handles degraded network conditions.
 *
 * @see https://github.com/Shopify/toxiproxy
 * @see https://node.testcontainers.org/modules/toxiproxy/
 */
export class ToxiproxyHook extends Hook {
    private container?: StartedToxiProxyContainer;
    private host?: string;
    private controlPort?: number;
    private proxies: Map<string, ProxyInfo> = new Map();

    constructor() {
        super(0);
    }

    override async beforeStart(_testConfig: JsonObject) {
        if (this.getState<boolean>("toxiproxy-enabled")) {
            const opts = this.getState<ToxiproxyOptions>("toxiproxyConfig") ?? {};
            await this.startContainer(opts);
        }
    }

    private async startContainer(opts: ToxiproxyOptions) {
        const logger = useLogger();

        const image = opts.image ?? "ghcr.io/shopify/toxiproxy:2.9.0";

        logger.info(`[ToxiproxyHook] Starting Toxiproxy container (${image})...`);

        // Detect and configure container runtime
        const {runtime, config: runtimeConfig} = detectContainerRuntime();
        configureContainerRuntime(runtimeConfig);
        logger.info(`[ToxiproxyHook] Using container runtime: ${runtime}`);

        const container = new ToxiProxyContainer(image);

        if (opts.containerLogging) {
            container.withLogConsumer(stream => {
                stream.on("data", line => logger.debug(`[ToxiproxyHook] ${line}`));
                stream.on("err", line => logger.error(`[ToxiproxyHook] ${line}`));
                stream.on("end", () => logger.debug("Stream closed"));
            });
        }

        // Start the container
        this.container = await container.start();

        this.host = this.container.getHost();
        this.controlPort = this.container.getMappedPort(8474); // Toxiproxy control port

        process.env[TOXIPROXY_HOST] = this.host;
        if (this.controlPort !== undefined) {
            process.env[TOXIPROXY_PORT] = this.controlPort.toString();
        }

        logger.info(`[ToxiproxyHook] Toxiproxy started at ${this.host}:${this.controlPort}`);

        // Configure proxies if provided
        logger.info(`[ToxiproxyHook] Configuring ${opts.proxies?.length ?? 0} proxies...`);
        if (opts.proxies && opts.proxies.length > 0) {
            await this.configureProxies(opts.proxies);
        }
    }

    private async configureProxies(proxies: ProxyConfig[]) {
        const logger = useLogger();

        for (const proxyConfig of proxies) {
            await this.createProxy(proxyConfig);

            // Apply toxics if configured
            if (proxyConfig.toxics && proxyConfig.toxics.length > 0) {
                for (const toxic of proxyConfig.toxics) {
                    await this.addToxic(proxyConfig.name, toxic);
                }
            }

            logger.info(`[ToxiproxyHook] Configured proxy: ${proxyConfig.name} (${proxyConfig.upstream})`);
        }
    }

    private async createProxy(config: ProxyConfig) {
        if (!this.container) {
            throw new Error("Toxiproxy container not started");
        }
        const logger = useLogger();
        try {
            logger.info(` [ToxiproxyHook] Creating proxy '${config.name}' for upstream '${config.upstream}'...`);
            const proxy = await this.container.createProxy({
                name: config.name,
                upstream: config.upstream,
                enabled: config.enabled ?? true,
            });

            // Extract port from upstream
            const portStr = config.upstream.split(":")[1];
            if (!portStr) {
                throw new Error(`Invalid upstream format: ${config.upstream}`);
            }
            const port = parseInt(portStr, 10);

            this.proxies.set(config.name, {
                name: config.name,
                host: this.host!,
                port: this.container.getMappedPort(port),
                upstream: config.upstream,
                enabled: config.enabled ?? true,
                proxy,
            });
            logger.info(` [ToxiproxyHook] Created proxy '${config.name}' successfully.`);
        } catch (e) {
            logger.error(` [ToxiproxyHook] Error creating proxy '${config.name}': ${(e as Error).stack}`);
            throw e;
        }
    }

    private async addToxic(proxyName: string, toxic: ToxicConfig) {
        if (!this.container) {
            throw new Error("Toxiproxy container not started");
        }
        const logger = useLogger();

        try {
            const name = toxic.name ?? `${toxic.type}_${Date.now()}`;
            const proxyInfo = this.proxies.get(proxyName);
            logger.info(`[ToxiproxyHook] Adding toxic '${name}' (${toxic.type}) to proxy '${proxyName}'...`);

            // Add toxic based on type
            switch (toxic.type) {
                case "latency":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "latency",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as LatencyToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "bandwidth":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "bandwidth",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as BandwidthToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "slow_close":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "slow_close",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as SlowCloseToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "timeout":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "timeout",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as TimeoutToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "slicer":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "slicer",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as SlicerToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "limit_data":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "limit_data",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as LimitDataToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                case "down":
                    await proxyInfo?.proxy.instance.addToxic({
                        type: "down",
                        name,
                        toxicity: toxic.toxicity ?? 1.0,
                        attributes: toxic.attributes as LimitDataToxicAttributes,
                        stream: toxic.stream,
                    });
                    break;
                default:
                    logger.warn(`[ToxiproxyHook] Unknown toxic type: ${toxic.type}`);
            }

            logger.info(`[ToxiproxyHook] Added toxic '${name}' (${toxic.type}) to proxy '${proxyName}'`);
        } catch (e) {
            logger.error(` [ToxiproxyHook] Error adding toxic to proxy '${proxyName}': ${(e as Error).stack}`);
            throw e;
        }
    }

    override async afterTests() {
        const logger = useLogger();
        if (this.container) {
            logger.info("[ToxiproxyHook] Stopping Toxiproxy container...");
            await this.container.stop();
            this.container = undefined;
            this.proxies.clear();
            logger.info("[ToxiproxyHook] Toxiproxy container stopped.");
        }
    }

    call(options?: ToxiproxyOptions) {
        this.setState("toxiproxy-enabled", true);
        this.setState("toxiproxyConfig", options);
    }

    use(): {
        container: StartedToxiProxyContainer;
        host: string;
        controlPort: number;
        proxies: Map<string, ProxyInfo>;
        getProxy: (name: string) => ProxyInfo | undefined;
        addToxic: (proxyName: string, toxic: ToxicConfig) => Promise<void>;
        removeToxic: (proxyName: string, toxicName: string) => Promise<void>;
        enableProxy: (proxyName: string) => Promise<void>;
        disableProxy: (proxyName: string) => Promise<void>;
    };

    use() {
        if (!this.container || !this.host || !this.controlPort) {
            throw new Error("Toxiproxy not started yet. Ensure test lifecycle has begun.");
        }

        return {
            container: this.container,
            host: this.host,
            controlPort: this.controlPort,
            proxies: this.proxies,
            getProxy: (name: string) => this.proxies.get(name),
            addToxic: async (proxyName: string, toxic: ToxicConfig) => {
                await this.addToxic(proxyName, toxic);
            },
            removeToxic: async (proxyName: string, toxicName: string) => {
                if (!this.container) {
                    throw new Error("Toxiproxy container not started");
                }
                const proxy = this.proxies.get(proxyName)?.proxy?.instance;
                await (await proxy?.getToxic(toxicName))?.remove();
            },
            enableProxy: async (proxyName: string) => {
                if (!this.container) {
                    throw new Error("Toxiproxy container not started");
                }
                const proxy = this.proxies.get(proxyName)?.proxy;
                await proxy?.setEnabled(true);
                const proxyInfo = this.proxies.get(proxyName);
                if (proxyInfo) {
                    proxyInfo.enabled = true;
                }
            },
            disableProxy: async (proxyName: string) => {
                if (!this.container) {
                    throw new Error("Toxiproxy container not started");
                }
                const proxy = this.proxies.get(proxyName)?.proxy;
                await proxy?.setEnabled(false);
                const proxyInfo = this.proxies.get(proxyName);
                if (proxyInfo) {
                    proxyInfo.enabled = false;
                }
            },
        };
    }
}
