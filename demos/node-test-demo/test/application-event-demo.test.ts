import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

/**
 * Demo test for the useApplicationEvent hook.
 * It awaits for a lifecycle event emitted by the application before continuing assertions.
 */

describe("Application Event Hook Demo", () => {
    // Bootstrap the app normally; no special setup required for the event hook.
    const {useApplicationEvent, useAppContext} = useNodeBoot(EmptyApp, () => {
        // Intentionally left blank. Event hook works at test scope only.
    });

    it("should await the 'application.initialized' lifecycle event", async () => {
        // Await the lifecycle event (must be a valid LifecycleType value)
        await useApplicationEvent.awaitEvent("application.initialized");

        // After event resolves, app context should be available
        useAppContext(appContext => {
            assert.ok(appContext, "App context should be defined after lifecycle event");
            assert.ok(appContext.config, "Config should be accessible");
            const port = appContext.config.get("app.port");
            assert.ok(port, "App port should be available in config after event");
        });
    });

    it("should await the 'application.started' lifecycle event", async () => {
        // Await the lifecycle event (must be a valid LifecycleType value)
        await useApplicationEvent.awaitEvent("application.started");

        // After event resolves, app context should be available
        useAppContext(appContext => {
            assert.ok(appContext, "App context should be defined after lifecycle event");
            assert.ok(appContext.config, "Config should be accessible");
            const port = appContext.config.get("app.port");
            assert.ok(port, "App port should be available in config after event");
        });
    });

    it("should await the 'persistence.started' lifecycle event", async () => {
        // Await the lifecycle event (must be a valid LifecycleType value)
        await useApplicationEvent.awaitEvent("persistence.started");

        // After event resolves, app context should be available
        useAppContext(appContext => {
            assert.ok(appContext, "App context should be defined after lifecycle event");
            assert.ok(appContext.config, "Config should be accessible");
            const port = appContext.config.get("app.port");
            assert.ok(port, "App port should be available in config after event");
        });
    });

    it("should await the 'application.adapters.bound' lifecycle event", async () => {
        // Await the lifecycle event (must be a valid LifecycleType value)
        await useApplicationEvent.awaitEvent("application.adapters.bound");

        // After event resolves, app context should be available
        useAppContext(appContext => {
            assert.ok(appContext, "App context should be defined after lifecycle event");
            assert.ok(appContext.config, "Config should be accessible");
            const port = appContext.config.get("app.port");
            assert.ok(port, "App port should be available in config after event");
        });
    });

    it("should throw when awaiting with an empty event name", async () => {
        let error: any;
        try {
            // @ts-expect-error: testing runtime validation of missing event
            await useApplicationEvent.awaitEvent("");
        } catch (e) {
            error = e;
        }
        assert.ok(error, "An error should have been thrown for empty event name");
        assert.match(String(error.message), /applicationEvent is required/);
    });
});
