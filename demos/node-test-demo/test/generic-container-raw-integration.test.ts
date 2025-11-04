import {describe, it} from "node:test";
import {GenericContainer} from "testcontainers";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import assert from "node:assert/strict";

/**
 * Simple integration test to verify useGenericContainerRaw hook works correctly
 */
describe("useGenericContainerRaw Integration Test", () => {
    const {useGenericContainerRaw} = useNodeBoot(EmptyApp, ({useGenericContainerRaw}) => {
        useGenericContainerRaw({
            containers: {
                "test-nginx": () => {
                    return new GenericContainer("nginx:alpine").withExposedPorts(80);
                },
            },
        });
    });

    it("should start a basic container", async () => {
        const {container, host, getPort} = useGenericContainerRaw("test-nginx");

        // Basic assertions to verify the hook works
        assert.ok(container.getId(), "Container ID should be defined");
        assert.ok(getPort(80), "Port 80 mapped to a valid port");
        assert.ok(host, "Host should be defined");
    });
});
