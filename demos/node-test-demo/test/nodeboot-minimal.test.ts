import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {EmptyApp} from "../src/empty-app";
import {useNodeBoot} from "@nodeboot/node-test";

/**
 * A minimal test to verify node:test works without NodeBoot
 */
describe("Minimal NodeBoot bootstrap Test", () => {
    const {useConfig, useAppContext} = useNodeBoot(EmptyApp, ({useConfig}) => {
        useConfig({
            app: {port: 40000},
            integrations: {
                http: {
                    "facts-lake": {
                        baseURL: "http://localhost:59999", // matches mock server port
                        timeout: 10000,
                        httpLogging: true,
                    },
                },
            },
        });
    });

    it("app bootstrapped successfully", () => {
        useAppContext(appContext => {
            assert.ok(appContext, "App context should be defined");
            assert.strictEqual(appContext.appOptions.port, 40000);

            assert.strictEqual(appContext.config.get("app.port"), 40000);
            assert.strictEqual(appContext.config.get("integrations.http.facts-lake.baseURL"), "http://localhost:59999");
        });
    });

    it("app config should point to patched config", () => {
        const config = useConfig();
        assert.strictEqual(config.get("app.port"), 40000);
        assert.strictEqual(config.get("integrations.http.facts-lake.baseURL"), "http://localhost:59999");
    });
});
