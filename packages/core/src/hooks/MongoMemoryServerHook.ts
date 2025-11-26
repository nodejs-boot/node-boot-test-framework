import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {MongoMemoryServer} from "mongodb-memory-server";

type UserRoles = string | {role: string; db: string};

/**
 * Configuration options for MongoDB Memory Server
 * Based on mongodb-memory-server API
 */
export type MongoMemoryServerOpts = {
    instance?: {
        port?: number; // by default choose any free port
        ip?: string; // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`
        dbName?: string; // by default '' (empty string)
        dbPath?: string; // by default create in temp directory
        storageEngine?: string; // by default `ephemeralForTest` (unless mongodb 7.0.0, where its `wiredTiger`)
        replSet?: string; // by default no replica set, replica set name
        args?: string[]; // any additional command line arguments for `mongod`
        auth?: boolean; // add "--auth" argument, dont use this directly use top-level "auth"
    };
    binary?: {
        version?: string; // by default '7.0.24'
        downloadDir?: string; // see the documentation on what is chosen by default
        platform?: string; // by default os.platform()
        arch?: string; // by default os.arch()
        checkMD5?: boolean; // by default false OR process.env.MONGOMS_MD5_CHECK
        systemBinary?: string; // by default undefined or process.env.MONGOMS_SYSTEM_BINARY
    };
    // using "auth" will manage "instance.auth"
    auth?: {
        enable?: boolean; // enable automatic user creation
        customRootName?: string; // by default "mongodb-memory-server-root"
        customRootPwd?: string; // by default "rootuser"
        force?: boolean; // force creation of users
        keyfileContent?: string; // by default "0123456789" (only useful for replsets)
        extraUsers?: Array<{
            createUser: string; // user name
            pwd: string; // user password
            roles: UserRoles[]; // user roles
            database?: string; // which database the user is created on
            customData?: Record<string, any>; // any arbitrary information
            mechanisms?: ("SCRAM-SHA-1" | "SCRAM-SHA-256")[];
            authenticationRestrictions?: Array<{
                clientSource?: string;
                serverAddress?: string;
            }>;
            digestPassword?: boolean;
        }>;
    };
};

export const MONGODB_MEMORY_URI = "MONGODB_URI";

/**
 * Spins up an in-memory MongoDB instance using mongodb-memory-server.
 * Faster and lighter than container-based approach, ideal for unit tests.
 * No Docker required.
 */
export class MongoMemoryServerHook extends Hook {
    private server?: MongoMemoryServer;
    private uri?: string;

    constructor() {
        super(0);
    }

    override async beforeStart(testConfig: JsonObject) {
        if (this.getState<boolean>("mongo-memory-enabled")) {
            const opts = this.getState<MongoMemoryServerOpts>("dbConfig") ?? {};
            await this.startServer(testConfig, opts);
        }
    }

    private async startServer(config: JsonObject, opts: MongoMemoryServerOpts) {
        const logger = useLogger();

        const dbName = opts.instance?.dbName ?? "testdb";

        logger.info("[MongoMemoryServerHook] Starting MongoDB Memory Server...");
        this.server = await MongoMemoryServer.create(opts as any);

        this.uri = this.server.getUri();
        process.env[MONGODB_MEMORY_URI] = this.uri;

        config["persistence"] = Object.assign({}, config["persistence"] ?? {}, {
            type: "mongodb",
            cache: false,
            mongodb: {
                database: dbName,
                url: this.uri,
                useUnifiedTopology: true,
            },
        });

        logger.info(`[MongoMemoryServerHook] MongoDB Memory Server started at ${this.uri}`);
    }

    override async afterTests() {
        const logger = useLogger();
        if (this.server) {
            logger.info("[MongoMemoryServerHook] Stopping MongoDB Memory Server...");
            await this.server.stop();
            this.server = undefined;
            logger.info("[MongoMemoryServerHook] MongoDB Memory Server stopped.");
        }
    }

    call(options?: MongoMemoryServerOpts) {
        this.setState("mongo-memory-enabled", true);
        this.setState("dbConfig", options);
    }

    use() {
        if (!this.uri) {
            throw new Error("MongoMemoryServer not started yet. Ensure test lifecycle has begun.");
        }
        return {mongoUri: this.uri, server: this.server};
    }
}
