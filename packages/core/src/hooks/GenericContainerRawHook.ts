import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {GenericContainer, StartedTestContainer} from "testcontainers";
import {configureContainerRuntime, detectContainerRuntime} from "../utils/container-runtime";

type ContainerFactory = () => GenericContainer | Promise<GenericContainer>;

type GenericContainerRawOptions = {
    containers?: Record<string, ContainerFactory>; // Named container factories
};

type ContainerInfo = {
    container: StartedTestContainer;
    host: string;
    ports: Map<number, number>;
    getPort: (containerPort: number) => number;
};

/**
 * Spins up any generic container using a factory function for maximum flexibility.
 * Supports advanced scenarios like building images, custom pull policies, buildkit, etc.
 * Automatically detects and configures the appropriate container runtime.
 *
 * Examples:
 * - Building images: GenericContainer.fromDockerfile("/path").build()
 * - Custom pull policies: container.withPullPolicy(PullPolicy.alwaysPull())
 * - Build arguments: container.withBuildArgs({ ARG: "VALUE" })
 * - Buildkit: container.withBuildkit()
 */
export class GenericContainerRawHook extends Hook {
    private containers: Map<string, ContainerInfo> = new Map();

    constructor() {
        super(0);
    }

    override async beforeStart(_testConfig: JsonObject) {
        const logger = useLogger();
        const containerFactories = this.getState<Map<string, ContainerFactory>>("container-factories");

        if (containerFactories && containerFactories.size > 0) {
            logger.info(`[GenericContainerRawHook] Starting ${containerFactories.size} containers...`);
            for (const [key, factory] of containerFactories) {
                await this.startContainer(key, factory);
            }
        } else {
            logger.debug(`[GenericContainerRawHook] No containers configured to start.`);
        }
    }

    private async startContainer(key: string, factory: ContainerFactory) {
        const logger = useLogger();

        logger.info(`[GenericContainerRawHook] Starting container '${key}' using factory...`);

        // Detect and configure container runtime
        const {runtime, config: runtimeConfig} = detectContainerRuntime();
        configureContainerRuntime(runtimeConfig);
        logger.info(`[GenericContainerRawHook] Using container runtime: ${runtime}`);

        // Create container using the factory function
        const container = await factory();

        // Attach log consumer
        container.withLogConsumer(stream => {
            stream.on("data", line => logger.debug(`[GenericContainerRawHook] ${key}: ${line}`));
            stream.on("err", line => logger.error(`[GenericContainerRawHook] ${key}: ${line}`));
            stream.on("end", () => logger.debug(`[GenericContainerRawHook] ${key}: Stream closed`));
        });

        // Start the container
        const startedContainer = await container.start();
        const host = startedContainer.getHost();

        // Create port mapping - we'll discover ports dynamically
        const ports = new Map<number, number>();

        const containerInfo: ContainerInfo = {
            container: startedContainer,
            host,
            ports,
            getPort: (containerPort: number) => {
                if (ports.has(containerPort)) {
                    return ports.get(containerPort)!;
                }
                // Try to get mapped port directly from container
                try {
                    const mappedPort = startedContainer.getMappedPort(containerPort);
                    ports.set(containerPort, mappedPort);
                    return mappedPort;
                } catch (error) {
                    logger.warn(`[GenericContainerRawHook] Could not get mapped port for ${containerPort}: ${error}`);
                    throw error;
                }
            },
        };

        this.containers.set(key, containerInfo);

        logger.info(`[GenericContainerRawHook] Container '${key}' started at ${host}`);
    }

    override async afterTests() {
        const logger = useLogger();
        for (const [key, containerInfo] of this.containers) {
            logger.info(`[GenericContainerRawHook] Stopping container '${key}'...`);
            await containerInfo.container.stop();
            logger.info(`[GenericContainerRawHook] Container '${key}' stopped.`);
        }
        this.containers.clear();
    }

    call(options?: GenericContainerRawOptions) {
        if (options?.containers) {
            let containerFactories = this.getState<Map<string, ContainerFactory>>("container-factories");
            if (!containerFactories) {
                containerFactories = new Map();
                this.setState("container-factories", containerFactories);
            }
            for (const [key, factory] of Object.entries(options.containers)) {
                containerFactories.set(key, factory);
            }
        }
    }

    use(key: string): ContainerInfo {
        const containerInfo = this.containers.get(key);
        if (!containerInfo) {
            throw new Error(
                `GenericContainerRaw '${key}' not started yet. Ensure test lifecycle has begun and the container was configured.`,
            );
        }
        return containerInfo;
    }

    useAll(): Map<string, ContainerInfo> {
        return new Map(this.containers);
    }
}
