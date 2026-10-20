/**
 * Single access point to the Node-Boot packages that are needed at runtime.
 *
 * Node-Boot packages are peer dependencies: the framework must always use the exact copy
 * installed by the application under test (ApplicationContext is a singleton, so a second
 * copy would see an empty IoC container). They are therefore resolved from the application's
 * working directory first, and only then from this package.
 */
import type * as ContextModule from "@nodeboot/context";
import type * as ConfigModule from "@nodeboot/config";

/** Minimum supported Node-Boot versions. There is deliberately no upper bound: newer majors are expected to work. */
const MIN_VERSION: Record<string, {major: number; minor: number}> = {
    "@nodeboot/core": {major: 1, minor: 16},
    "@nodeboot/context": {major: 2, minor: 2},
    "@nodeboot/config": {major: 1, minor: 3},
};

const cache = new Map<string, any>();

function resolveFromApp(pkg: string): string {
    try {
        return require.resolve(pkg, {paths: [process.cwd()]});
    } catch {
        return require.resolve(pkg);
    }
}

function checkVersion(pkg: string, entry: string) {
    const min = MIN_VERSION[pkg];
    if (!min) return;
    try {
        // walk up from the resolved entry file to the package.json of the package
        let dir = require("path").dirname(entry);
        let manifest: {name?: string; version?: string} | undefined;
        for (let i = 0; i < 6 && !manifest; i++) {
            try {
                const candidate = require(require("path").join(dir, "package.json"));
                if (candidate.name === pkg) manifest = candidate;
            } catch {
                /* keep walking */
            }
            dir = require("path").dirname(dir);
        }
        const [major, minor] = (manifest?.version ?? "").split(".").map(Number);
        if (major === undefined || Number.isNaN(major)) return;
        if (major < min.major || (major === min.major && (minor ?? 0) < min.minor)) {
            throw new Error(
                `Unsupported ${pkg}@${manifest?.version}. @nodeboot/test supports ${pkg} >=${min.major}.${min.minor}.0`,
            );
        }
    } catch (e) {
        if ((e as Error).message.startsWith("Unsupported")) throw e;
    }
}

export function loadNodeBoot<T = any>(pkg: "@nodeboot/core" | "@nodeboot/context" | "@nodeboot/config"): T {
    if (cache.has(pkg)) return cache.get(pkg);
    let entry: string;
    try {
        entry = resolveFromApp(pkg);
    } catch {
        throw new Error(
            `${pkg} was not found. It is a peer dependency of @nodeboot/test: install it in the application under test.`,
        );
    }
    checkVersion(pkg, entry);
    const mod = require(entry);
    cache.set(pkg, mod);
    return mod;
}

const context = () => loadNodeBoot<typeof ContextModule>("@nodeboot/context");

export type IocContainer = NonNullable<ReturnType<typeof ContextModule.ApplicationContext.getIocContainer>>;

export const getIocContainer = (): IocContainer | undefined => context().ApplicationContext.getIocContainer();
export const getLifecycleBridgeClass = () => context().ApplicationLifecycleBridge;
export const getConfigServiceClass = () => loadNodeBoot<typeof ConfigModule>("@nodeboot/config").ConfigService;

/** Fails fast (at test bootstrap) if the Node-Boot packages are missing or unsupported. */
export function assertNodeBootCompatibility() {
    for (const pkg of Object.keys(MIN_VERSION)) {
        loadNodeBoot(pkg as any);
    }
}
