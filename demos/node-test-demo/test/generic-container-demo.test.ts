import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// Simple test demonstrating useGenericContainer hook
describe("GenericContainer Demo", () => {
    const {useGenericContainer} = useNodeBoot(EmptyApp, ({useGenericContainer}) => {
        // Configure a simple Alpine container for testing
        useGenericContainer({
            containers: {
                alpine: {
                    image: "alpine:latest",
                    command: ["sleep", "60"], // Keep container running for 60 seconds
                },
            },
        });
    });

    it("should start alpine container and provide access", async () => {
        // Access Alpine container
        const alpine = useGenericContainer("alpine");
        assert.ok(alpine.host, "Alpine host should be defined");
        assert.ok(alpine.container, "Alpine container should be defined");

        console.log("Alpine container started on host:", alpine.host);

        // Execute a simple command
        const result = await alpine.container.exec(["echo", "Hello from Alpine!"]);
        assert.strictEqual(result.exitCode, 0, "Echo command should succeed");
        assert.strictEqual(result.output.trim(), "Hello from Alpine!", "Output should match");

        console.log("Command output:", result.output.trim());
    });

    it("should execute commands in container", async () => {
        const alpine = useGenericContainer("alpine");

        // Test file operations
        const writeResult = await alpine.container.exec(["sh", "-c", 'echo "Hello from container" > /tmp/test.txt']);
        assert.strictEqual(writeResult.exitCode, 0, "Write command should succeed");

        const readResult = await alpine.container.exec(["cat", "/tmp/test.txt"]);
        assert.strictEqual(readResult.exitCode, 0, "Read command should succeed");
        assert.strictEqual(readResult.output.trim(), "Hello from container", "File content should match");
    });
});

// Example with multiple containers
describe("Multiple GenericContainers Demo", () => {
    const {useGenericContainer} = useNodeBoot(EmptyApp, ({useGenericContainer}) => {
        // Configure multiple containers
        useGenericContainer({
            containers: {
                alpine1: {
                    image: "alpine:latest",
                    command: ["sleep", "60"],
                },
                alpine2: {
                    image: "alpine:latest",
                    command: ["sleep", "60"],
                },
            },
        });
    });

    it("should start multiple containers independently", async () => {
        const alpine1 = useGenericContainer("alpine1");
        const alpine2 = useGenericContainer("alpine2");

        assert.ok(alpine1.host, "Alpine1 host should be defined");
        assert.ok(alpine2.host, "Alpine2 host should be defined");
        assert.ok(alpine1.container, "Alpine1 container should be defined");
        assert.ok(alpine2.container, "Alpine2 container should be defined");

        // Containers should be different instances
        assert.notStrictEqual(
            alpine1.container.getId(),
            alpine2.container.getId(),
            "Containers should have different IDs",
        );

        // Both should be able to execute commands independently
        const result1 = await alpine1.container.exec(["echo", "Container 1"]);
        const result2 = await alpine2.container.exec(["echo", "Container 2"]);

        assert.strictEqual(result1.exitCode, 0, "Container 1 command should succeed");
        assert.strictEqual(result2.exitCode, 0, "Container 2 command should succeed");
        assert.strictEqual(result1.output.trim(), "Container 1", "Container 1 output should match");
        assert.strictEqual(result2.output.trim(), "Container 2", "Container 2 output should match");

        console.log("Container 1 output:", result1.output.trim());
        console.log("Container 2 output:", result2.output.trim());
    });
});
