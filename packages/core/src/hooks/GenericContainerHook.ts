import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {GenericContainer, StartedTestContainer} from "testcontainers";
import {configureContainerRuntime, detectContainerRuntime} from "../utils/container-runtime";

type ContainerOptions = {
    image: string; // Required: Container image to use (e.g., "alpine:3.10")
    name?: string; // Optional: Container name
    command?: string[]; // Optional: Command to run
    entrypoint?: string[]; // Optional: Entrypoint
    environment?: Record<string, string>; // Optional: Environment variables
    exposedPorts?: number[]; // Optional: Ports to expose (simplified to just numbers)
    workingDir?: string; // Optional: Working directory
    user?: string; // Optional: User (format: <name|uid>[:<group|gid>])
    privilegedMode?: boolean; // Optional: Run in privileged mode
    labels?: Record<string, string>; // Optional: Labels
    autoRemove?: boolean; // Optional: Auto-remove container
    reuse?: boolean; // Optional: Reuse container
    platform?: string; // Optional: Platform (e.g., "linux/arm64")
    defaultLogDriver?: boolean; // Optional: Use default log driver
    waitForLog?: string; // Optional: Wait for log message before considering container started
    waitForLogTimeout?: number; // Optional: Timeout for waiting for log message (ms)
    containerLogging?: boolean;
};

type GenericContainerOptions = {
    containers?: Record<string, ContainerOptions>; // Optional: Named containers to create
};

type ContainerInfo = {
    container: StartedTestContainer;
    host: string;
    ports: Map<number, number>;
    getPort: (containerPort: number) => number;
};

/**
 * Spins up any generic container using Testcontainers.
 * Provides maximum flexibility for testing with any Docker container.
 * Automatically detects and configures the appropriate container runtime.
 */
export class GenericContainerHook extends Hook {
    private containers: Map<string, ContainerInfo> = new Map();

    constructor() {
        super(0);
    }

    override async beforeStart(_testConfig: JsonObject) {
        const logger = useLogger();
        const containerConfigs = this.getState<Map<string, ContainerOptions>>("container-configs");

        if (containerConfigs && containerConfigs.size > 0) {
            logger.info(`[GenericContainerHook] Starting ${containerConfigs.size} containers...`);
            for (const [key, config] of containerConfigs) {
                await this.startContainer(key, config);
            }
        } else {
            logger.debug(`[GenericContainerHook] No containers configured to start.`);
        }
    }

    private async startContainer(key: string, options: ContainerOptions) {
        const logger = useLogger();

        logger.info(`[GenericContainerHook] Starting container '${key}' (${options.image})...`);

        // Detect and configure container runtime
        const {runtime, config: runtimeConfig} = detectContainerRuntime();
        configureContainerRuntime(runtimeConfig);
        logger.info(`[GenericContainerHook] Using container runtime: ${runtime}`);

        let container = new GenericContainer(options.image);

        // Configure the container based on options
        if (options.command) {
            container = container.withCommand(options.command);
        }

        if (options.entrypoint) {
            container = container.withEntrypoint(options.entrypoint);
        }

        if (options.environment) {
            container = container.withEnvironment(options.environment);
        }

        if (options.exposedPorts) {
            container = container.withExposedPorts(...options.exposedPorts);
        }

        if (options.workingDir) {
            container = container.withWorkingDir(options.workingDir);
        }

        if (options.user) {
            container = container.withUser(options.user);
        }

        if (options.privilegedMode) {
            container = container.withPrivilegedMode();
        }

        if (options.labels) {
            container = container.withLabels(options.labels);
        }

        if (options.autoRemove !== undefined) {
            container = container.withAutoRemove(options.autoRemove);
        }

        if (options.reuse) {
            container = container.withReuse();
        }

        if (options.platform) {
            container = container.withPlatform(options.platform);
        }

        if (options.defaultLogDriver) {
            container = container.withDefaultLogDriver();
        }

        if (options.name) {
            container = container.withName(options.name);
        }

        if (options.containerLogging) {
            // Attach log consumer
            container.withLogConsumer(stream => {
                stream.on("data", line => logger.debug(`[GenericContainerHook] ${line}`));
                stream.on("err", line => logger.error(`[GenericContainerHook] ${line}`));
                stream.on("end", () => logger.debug("Stream closed"));
            });
        }

        // Start the container
        const startedContainer = await container.start();
        const host = startedContainer.getHost();

        // Create port mapping
        const ports = new Map<number, number>();
        if (options.exposedPorts) {
            for (const port of options.exposedPorts) {
                ports.set(port, startedContainer.getMappedPort(port));
            }
        }

        const containerInfo: ContainerInfo = {
            container: startedContainer,
            host,
            ports,
            getPort: (containerPort: number) => {
                if (ports.has(containerPort)) {
                    return ports.get(containerPort)!;
                }
                return startedContainer.getMappedPort(containerPort);
            },
        };

        this.containers.set(key, containerInfo);

        logger.info(`[GenericContainerHook] Container '${key}' started at ${host}`);
        if (ports.size > 0) {
            logger.info(
                `[GenericContainerHook] Port mappings: ${Array.from(ports.entries())
                    .map(([c, h]) => `${c}:${h}`)
                    .join(", ")}`,
            );
        }

        // Wait for log if specified
        if (options.waitForLog) {
            logger.info(`[GenericContainerHook] Waiting for log: "${options.waitForLog}"`);
            // Note: This would require additional implementation for log waiting
            // For now, we'll just log the intention
        }
    }

    override async afterTests() {
        const logger = useLogger();
        for (const [key, containerInfo] of this.containers) {
            logger.info(`[GenericContainerHook] Stopping container '${key}'...`);
            await containerInfo.container.stop();
            logger.info(`[GenericContainerHook] Container '${key}' stopped.`);
        }
        this.containers.clear();
    }

    call(options?: GenericContainerOptions) {
        if (options?.containers) {
            let containerConfigs = this.getState<Map<string, ContainerOptions>>("container-configs");
            if (!containerConfigs) {
                containerConfigs = new Map();
                this.setState("container-configs", containerConfigs);
            }
            for (const [key, containerOptions] of Object.entries(options.containers)) {
                containerConfigs.set(key, containerOptions);
            }
        }
    }

    use(key: string): ContainerInfo {
        const containerInfo = this.containers.get(key);
        if (!containerInfo) {
            throw new Error(
                `GenericContainer '${key}' not started yet. Ensure test lifecycle has begun and the container was configured.`,
            );
        }
        return containerInfo;
    }

    useAll(): Map<string, ContainerInfo> {
        return new Map(this.containers);
    }
}
