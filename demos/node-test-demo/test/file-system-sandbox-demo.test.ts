import {describe, it} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

// Demo inspired by timer-hook-demo showing core capabilities of FileSystemSandboxHook
// - Custom prefix configuration
// - Writing, reading, resolving, and existence checks
// - Automatic cleanup between tests (keep=false by default)
// - Isolation (each test gets a fresh directory)

describe("FileSystemSandboxHook Demo", () => {
    const {useFileSystemSandbox} = useNodeBoot(EmptyApp, ({useConfig, useFileSystemSandbox}) => {
        useConfig({app: {port: 35004}});
        // Configure sandbox with a custom prefix for easier identification in tmp folders
        useFileSystemSandbox({prefix: "nb-fs-demo-"});
    });

    let previousSandboxDir: string | undefined;

    it("provides an isolated sandbox with file operations", () => {
        const sandbox = useFileSystemSandbox();
        const root = sandbox.path;
        assert.ok(root.includes("nb-fs-demo-"), "Sandbox directory should include custom prefix");

        // Write nested file
        const writtenPath = sandbox.writeText("nested/hello.txt", "Hello Sandbox");
        assert.equal(fs.existsSync(writtenPath), true, "Written file should exist on disk");
        assert.equal(sandbox.exists("nested/hello.txt"), true, "exists(rel) should return true");

        // Read content back
        const content = sandbox.readText("nested/hello.txt");
        assert.equal(content, "Hello Sandbox", "File content should match written text");

        // Resolve convenience helper
        const resolved = sandbox.resolve("nested", "hello.txt");
        assert.equal(resolved, writtenPath, "Resolved path should match written path returned by writeText");

        // Stash for next test to verify cleanup
        previousSandboxDir = root;
    });

    it("automatically cleans up previous sandbox and allocates a fresh one", () => {
        assert.ok(previousSandboxDir, "Previous sandbox path should have been captured by first test");

        const sandbox = useFileSystemSandbox();
        const currentRoot = sandbox.path;

        // Ensure a different directory was allocated
        assert.notEqual(currentRoot, previousSandboxDir, "Each test should receive a distinct sandbox directory");

        // Previous directory should have been removed after prior test (keep=false default)
        assert.equal(
            fs.existsSync(previousSandboxDir!),
            false,
            "Previous sandbox directory should be cleaned up automatically",
        );

        // Demonstrate fresh sandbox is empty by writing another file
        const filePath = sandbox.writeText("fresh/data.txt", "42");
        assert.equal(sandbox.readText("fresh/data.txt"), "42", "Fresh sandbox should allow file IO");
        assert.ok(fs.existsSync(filePath), "File should exist in the new sandbox");
    });
});
