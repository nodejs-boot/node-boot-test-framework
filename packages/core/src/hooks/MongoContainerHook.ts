import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {GenericContainer, StartedTestContainer} from "testcontainers";

type MongoContainerOptions = {
    image?: string; // Default: mongo:6
    dbName?: string;
    port?: number;
    username?: string;
    password?: string;
    env?: Record<string, string>;
};

export const MONGODB_URI = "MONGODB_URI";

/**
 * Spins up a real MongoDB container using Testcontainers.
 * Integrates cleanly with NodeBoot’s persistence layer.
 */
export class MongoContainerHook extends Hook {
    private container?: StartedTestContainer;
    private uri?: string;

    constructor() {
        super(0);
    }

    override async beforeStart(testConfig: JsonObject) {
        if (this.getState<boolean>("mongo-enabled")) {
            const opts = this.getState<MongoContainerOptions>("dbConfig") ?? {};
            await this.startContainer(testConfig, opts);
        }
    }

    private async startContainer(config: JsonObject, opts: MongoContainerOptions) {
        const logger = useLogger();

        const image = opts.image ?? "mongo:6";
        const port = opts.port ?? 27017;
        const dbName = opts.dbName ?? "testdb";

        logger.info(`[MongoContainerHook] Starting MongoDB container (${image})...`);

        process.env["TESTCONTAINERS_RYUK_DISABLED"] = "true";
        process.env["DOCKER_HOST"] = "unix:///Users/santoman/.colima/default/docker.sock"; //"unix://${HOME}/.colima/default/docker.sock";
        process.env["TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE"] = "/Users/santoman/.colima/default/docker.sock";

        const container = await new GenericContainer(image)
            .withExposedPorts(port)
            .withEnvironment({
                MONGO_INITDB_DATABASE: dbName,
                ...(opts.username ? {MONGO_INITDB_ROOT_USERNAME: opts.username} : {}),
                ...(opts.password ? {MONGO_INITDB_ROOT_PASSWORD: opts.password} : {}),
                ...(opts.env ?? {}),
            })
            .start();

        const mappedPort = container.getMappedPort(port);
        const host = container.getHost();

        const uri = opts.username
            ? `mongodb://${opts.username}:${opts.password}@${host}:${mappedPort}/${dbName}?authSource=admin`
            : `mongodb://${host}:${mappedPort}/${dbName}`;

        this.container = container;
        this.uri = uri;
        process.env[MONGODB_URI] = uri;

        config["persistence"] = Object.assign({}, config["persistence"] ?? {}, {
            type: "mongodb",
            cache: false,
            mongodb: {
                database: dbName,
                url: uri,
                useUnifiedTopology: true,
            },
        });

        logger.info(`[MongoContainerHook] MongoDB started at ${uri}`);
    }

    override async afterTests() {
        const logger = useLogger();
        if (this.container) {
            logger.info("[MongoContainerHook] Stopping MongoDB container...");
            await this.container.stop();
            this.container = undefined;
            logger.info("[MongoContainerHook] MongoDB container stopped.");
        }
    }

    call(options?: MongoContainerOptions) {
        this.setState("mongo-enabled", true);
        this.setState("dbConfig", options);
    }

    use() {
        if (!this.uri) {
            throw new Error("MongoContainer not started yet. Ensure test lifecycle has begun.");
        }
        return {mongoUri: this.uri, container: this.container};
    }
}
