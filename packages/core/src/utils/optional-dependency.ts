/**
 * Loads an optional peer dependency on demand.
 * Throws an actionable error if the package is not installed, so the failure
 * happens at test bootstrap of the feature that needs it, not at import time.
 */
export function requireOptional<T = any>(packageName: string, feature: string): T {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(packageName) as T;
    } catch (e) {
        if (
            (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND" &&
            String((e as Error).message).includes(packageName)
        ) {
            throw new Error(
                `${feature} requires the optional dependency "${packageName}", which is not installed. ` +
                    `Install it with: npm install --save-dev ${packageName}`,
            );
        }
        throw e;
    }
}
