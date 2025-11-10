/**
 * Removes the default unhandledRejection listener added by the node:test module,
 * returning a restore function to reattach them later.
 */
export function removeDefaultUnhandledRejectionTestListener() {
    const removedListeners: Function[] = [];
    const originalListeners = process.listeners("unhandledRejection");

    for (const listener of originalListeners) {
        if (listener.toString().includes("rootTest")) {
            process.removeListener("unhandledRejection", listener);
            removedListeners.push(listener);
        }
    }

    // Return a restore function
    return {
        restore: () => {
            for (const listener of removedListeners) {
                process.on("unhandledRejection", listener as any);
            }
        },
    };
}

/**
 * Removes the default uncaughtException listener added by the node:test module,
 * returning a restore function to reattach them later.
 */
export function removeDefaultUncaughtExceptionTestListener() {
    const removedListeners: Function[] = [];
    const originalListeners = process.listeners("uncaughtException");

    for (const listener of originalListeners) {
        if (listener.toString().includes("rootTest")) {
            process.removeListener("uncaughtException", listener);
            removedListeners.push(listener);
        }
    }

    // Return a restore function
    return {
        restore: () => {
            for (const listener of removedListeners) {
                process.on("uncaughtException", listener as any);
            }
        },
    };
}

/**
 * Removes both the default uncaughtException and unhandledRejection listeners
 * added by the node:test module. Returns a single restore function that
 * restores both sets of listeners.
 */
export function removeDefaultTestListeners() {
    const {restore: restoreUncaught} = removeDefaultUncaughtExceptionTestListener();
    const {restore: restoreRejection} = removeDefaultUnhandledRejectionTestListener();

    return {
        restore: () => {
            restoreUncaught();
            restoreRejection();
        },
    };
}
