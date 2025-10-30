import {Hook, useLogger} from "@nodeboot/test";
import {JsonObject} from "@nodeboot/context";

type MongoMemoryOptions = {
    port?: number; // by default choose any free port
    ip?: string; // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`,
    dbName?: string; // by
};

export const MONGODB_URI = "MONGODB_URI";

/**
 * Hook to manage an in-memory MongoDB instance for tests.
 * Optional Dependencies:
 *   - mongodb-memory-server
 *   - mongodb
 * These must be installed by the user ONLY if they intend to use this hook:
 *   pnpm add -D mongodb-memory-server mongodb
 */
export class MongoMemoryHook extends Hook {
    private server: any; // MongoMemoryServer instance
    private client: any; // MongoClient instance
    private depsLoaded = false;
    private MongoMemoryServerCtor: any;
    private MongoClientCtor: any;

    constructor() {
        super(0);
    }

    private async ensureDeps() {
        if (this.depsLoaded) return;
        try {
            const [{MongoMemoryServer}, mongodbPkg] = await Promise.all([
                import("mongodb-memory-server"),
                import("mongodb"),
            ]);
            this.MongoMemoryServerCtor = MongoMemoryServer;
            this.MongoClientCtor = (mongodbPkg as any).MongoClient;
            this.depsLoaded = true;
        } catch (err) {
            throw new Error(
                "MongoMemoryHook requires optional dependencies 'mongodb-memory-server' and 'mongodb'. Install them with: pnpm add -D mongodb-memory-server mongodb",
            );
        }
    }

    override async beforeStart(testConfig: JsonObject) {
        if (!this.server) {
            const options = this.getState<MongoMemoryOptions>("dbConfig");
            await this.configure(testConfig, options);
        }
    }

    private async configure(config: JsonObject, options?: MongoMemoryOptions) {
        const logger = useLogger();
        await this.ensureDeps();
        const dbName = options?.dbName || "test-db";
        this.server = await this.MongoMemoryServerCtor.create({instance: {...options, dbName}});
        const uri = this.server.getUri();
        this.setState("mongoUri", uri);
        logger.debug(`[MongoMemoryHook] Started in-memory MongoDB at ${uri}`);
        this.client = new this.MongoClientCtor(uri);
        process.env[MONGODB_URI] = uri;
        await this.client.connect();
        this.setState("mongoClient", this.client);
        config["persistence"] = Object.assign({}, config["persistence"] ?? {}, {
            type: "mongodb",
            cache: false,
            url: uri,
            mongodb: {
                database: dbName,
            },
        });
    }

    override async beforeEachTest() {
        // Clean all collections to ensure test isolation
    }

    override async afterTests() {
        const logger = useLogger();
        try {
            if (this.client) {
                await this.client.close();
                logger.debug(`[MongoMemoryHook] MongoClient closed.`);
            }
        } catch (err) {
            logger.error(`[MongoMemoryHook] Error closing MongoClient: ${(err as Error).message}`);
        } finally {
            this.client = undefined;
        }
        try {
            if (this.server) {
                await this.server.stop();
                logger.debug(`[MongoMemoryHook] MongoMemoryServer stopped.`);
            }
        } catch (err) {
            logger.error(`[MongoMemoryHook] Error stopping MongoMemoryServer: ${(err as Error).message}`);
        } finally {
            this.server = undefined;
        }
    }

    call(options?: MongoMemoryOptions) {
        this.setState("dbConfig", options);
    }

    /**
     * Returns the connected MongoClient instance.
     */
    use() {
        const mongoUri = this.getState<string>("mongoUri");
        if (!mongoUri) {
            throw new Error("MongoMemoryServer not started yet. Call beforeTests or ensure test lifecycle has begun.");
        }

        const mongoClient = this.getState<any>("mongoClient");
        if (!mongoClient) {
            throw new Error("MongoMemoryServer not started yet. Call beforeTests or ensure test lifecycle has begun.");
        }
        return {
            mongoUri,
            mongoClient,
        };
    }
}
