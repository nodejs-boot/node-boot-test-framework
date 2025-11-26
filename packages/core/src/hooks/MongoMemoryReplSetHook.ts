import {Hook} from "./Hook";
import {JsonObject} from "@nodeboot/context";
import {useLogger} from "../utils/useLogger";
import {MongoMemoryReplSet} from "mongodb-memory-server";

type UserRoles = string | {role: string; db: string};

type AutomaticAuth = {
    enable?: boolean;
    customRootName?: string;
    customRootPwd?: string;
    force?: boolean;
    keyfileContent?: string;
    extraUsers?: Array<{
        createUser: string;
        pwd: string;
        roles: UserRoles[];
        database?: string;
        customData?: Record<string, any>;
        mechanisms?: ("SCRAM-SHA-1" | "SCRAM-SHA-256")[];
        authenticationRestrictions?: Array<{
            clientSource?: string;
            serverAddress?: string;
        }>;
        digestPassword?: boolean;
    }>;
};

/**
 * Configuration options for MongoDB Memory Replica Set
 * Based on mongodb-memory-server MongoMemoryReplSet API
 */
export type MongoMemoryReplSetOpts = {
    binary?: {
        version?: string; // by default '7.0.24'
        downloadDir?: string; // see the documentation on what is chosen by default
        platform?: string; // by default os.platform()
        arch?: string; // by default os.arch()
        checkMD5?: boolean; // by default false OR process.env.MONGOMS_MD5_CHECK
        systemBinary?: string; // by default undefined or process.env.MONGOMS_SYSTEM_BINARY
    };
    instanceOpts?: Array<{
        args?: string[]; // any additional instance specific args
        port?: number; // port number for the instance
        dbPath?: string; // path to database files for this instance
        storageEngine?: string; // same storage engine options
    }>;
    // unless otherwise noted below these values will be in common with all instances spawned
    replSet?: {
        name?: string; // replica set name (default: 'testset')
        auth?: boolean | AutomaticAuth; // enable auth
        args?: string[]; // any args specified here will be combined with any per instance args from instanceOpts
        count?: number; // number of additional mongod processes to start (default: 1)
        dbName?: string; // default database for db URI strings
        ip?: string; // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`
        spawn?: Record<string, any>; // spawn options when creating the child processes
        storageEngine?: string; // default storage engine for instance
        configSettings?: {
            // Optional settings for 'replSetInitiate' command
            chainingAllowed?: boolean; // When true it allows secondary members to replicate from other secondary members
            heartbeatTimeoutSecs?: number; // Number of seconds that the replica set members wait for a successful heartbeat
            heartbeatIntervalMillis?: number; // The frequency in milliseconds of the heartbeats
            electionTimeoutMillis?: number; // The time limit in milliseconds for detecting when a replica set's primary is unreachable
            catchUpTimeoutMillis?: number; // Time limit for a newly elected primary to sync (catch up) with the other replica set members
        };
    };
};

export const MONGODB_REPLSET_URI = "MONGODB_URI";

/**
 * Spins up an in-memory MongoDB Replica Set using mongodb-memory-server.
 * Provides a multi-node MongoDB setup for testing replica set functionality.
 * No Docker required.
 */
export class MongoMemoryReplSetHook extends Hook {
    private replSet?: MongoMemoryReplSet;
    private uri?: string;

    constructor() {
        super(0);
    }

    override async beforeStart(testConfig: JsonObject) {
        if (this.getState<boolean>("mongo-replset-enabled")) {
            const opts = this.getState<MongoMemoryReplSetOpts>("replSetConfig") ?? {};
            await this.startReplSet(testConfig, opts);
        }
    }

    private async startReplSet(config: JsonObject, opts: MongoMemoryReplSetOpts) {
        const logger = useLogger();

        const dbName = opts.replSet?.dbName ?? "testdb";
        const replSetName = opts.replSet?.name ?? "testset";

        logger.info("[MongoMemoryReplSetHook] Starting MongoDB Memory Replica Set...");
        logger.info(`[MongoMemoryReplSetHook] Replica Set Name: ${replSetName}`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.replSet = await MongoMemoryReplSet.create(opts as any);

        this.uri = this.replSet.getUri();
        process.env[MONGODB_REPLSET_URI] = this.uri;

        config["persistence"] = Object.assign({}, config["persistence"] ?? {}, {
            type: "mongodb",
            cache: false,
            mongodb: {
                database: dbName,
                url: this.uri,
                useUnifiedTopology: true,
                replicaSet: replSetName,
            },
        });

        logger.info(`[MongoMemoryReplSetHook] MongoDB Replica Set started at ${this.uri}`);
        logger.info(`[MongoMemoryReplSetHook] Number of instances: ${this.replSet.servers.length}`);
    }

    override async afterTests() {
        const logger = useLogger();
        if (this.replSet) {
            logger.info("[MongoMemoryReplSetHook] Stopping MongoDB Replica Set...");
            await this.replSet.stop();
            this.replSet = undefined;
            logger.info("[MongoMemoryReplSetHook] MongoDB Replica Set stopped.");
        }
    }

    call(options?: MongoMemoryReplSetOpts) {
        this.setState("mongo-replset-enabled", true);
        this.setState("replSetConfig", options);
    }

    use() {
        if (!this.uri) {
            throw new Error("MongoMemoryReplSet not started yet. Ensure test lifecycle has begun.");
        }
        return {
            mongoUri: this.uri,
            replSet: this.replSet,
            servers: this.replSet?.servers ?? [],
        };
    }
}
