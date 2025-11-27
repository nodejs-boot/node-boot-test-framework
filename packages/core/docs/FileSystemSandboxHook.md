# FileSystemSandboxHook

Creates an isolated temporary directory for each test. Ensures file IO does not leak or conflict between tests.

## Purpose

Provide a clean, per-test temporary directory to isolate filesystem operations and prevent interference between tests. Useful when code under test writes to disk, reads files, or performs path-sensitive operations.

## Features

-   Per-test temp directory (removed automatically).
-   Custom base directory and name prefix.
-   Optional keep flag for debugging.
-   Helper API for common operations.

## Setup / Activation (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("FileSystemSandboxHook - Basic", () => {
    const {useFileSystemSandbox} = useNodeBoot(EmptyApp, ({useFileSystemSandbox}) => {
        useFileSystemSandbox(); // Activate per-test sandbox
    });

    it("writes and reads a file", () => {
        const {path, writeText, readText, exists} = useFileSystemSandbox();
        assert.ok(path);
        writeText("data.txt", "hello");
        assert.strictEqual(readText("data.txt"), "hello");
        assert.strictEqual(exists("data.txt"), true);
    });
});
```

## Configuration (custom base, prefix, keep)

```typescript
useFileSystemSandbox({
    baseDir: "/custom/tmp", // default: os.tmpdir()
    prefix: "nb-sandbox-", // default
    keep: false, // set true to retain dirs after tests
});
```

## Usage

```ts
const {path, resolve, writeText, readText, exists} = useFileSystemSandbox();
writeText("data/input.txt", "hello");
expect(readText("data/input.txt")).toBe("hello");
expect(exists("data/input.txt")).toBe(true);
```

## File Operations Examples

```typescript
it("nested directories auto-create", () => {
    const {writeText, readText, exists} = useFileSystemSandbox();
    writeText("a/b/c.txt", "content");
    assert.ok(exists("a/b/c.txt"));
    assert.strictEqual(readText("a/b/c.txt"), "content");
});

it("resolve full paths within sandbox", () => {
    const {resolve, writeText} = useFileSystemSandbox();
    const full = resolve("sub", "file.txt");
    writeText("sub/file.txt", "nested");
    // full contains absolute path inside sandbox
    assert.ok(full.includes("sub/file.txt"));
});
```

## Test Isolation

```typescript
describe("Sandbox isolation", () => {
    const {useFileSystemSandbox} = useNodeBoot(EmptyApp, ({useFileSystemSandbox}) => {
        useFileSystemSandbox();
    });

    it("first test has its own sandbox", () => {
        const {writeText, exists} = useFileSystemSandbox();
        writeText("only-here.txt", "one");
        assert.ok(exists("only-here.txt"));
    });

    it("second test does not see first test files", () => {
        const {exists} = useFileSystemSandbox();
        assert.strictEqual(exists("only-here.txt"), false);
    });
});
```

## Debugging with Keep Flag

```typescript
describe("Keep sandbox for inspection", () => {
    const {useFileSystemSandbox} = useNodeBoot(EmptyApp, ({useFileSystemSandbox}) => {
        useFileSystemSandbox({keep: true});
    });

    it("prints sandbox path", () => {
        const {path, writeText} = useFileSystemSandbox();
        writeText("debug.txt", "inspect me");
        console.log(`Sandbox kept at: ${path}`);
        // directory will be retained after test for manual inspection
    });
});
```

## Lifecycle

-   beforeEachTest: creates new directory.
-   afterEachTest: removes directory unless `keep`.
-   afterTests: double-check cleanup.

## Integration Patterns

| Hook                  | Pattern                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| MemoryFileSystemHook  | Use memory FS for speed; sandbox for real OS semantics (permissions, paths). |
| SnapshotStateHook     | Capture counts before/after to detect unintended file writes.                |
| PerformanceBudgetHook | Measure time for heavy file operations.                                      |

## Extended API

`useFileSystemSandbox()` returns:

-   `path`: root sandbox path
-   `resolve(...segments)`: join path segments within sandbox
-   `writeText(rel, content)`: write UTF-8 text (creates parent dirs)
-   `readText(rel)`: read text
-   `exists(rel)`: boolean

## Best Practices

-   Use relative paths within helpers; avoid absolute OS paths inside tests.
-   Do not rely on sandbox path stability—treat it as ephemeral per test.
-   Keep `keep: true` only while debugging; revert to `false` for CI reliability.
-   Prefer small, targeted test artifacts to reduce I/O.

## Edge Cases

-   External code writing to absolute paths can escape sandbox—adapt code to accept base path or inject `resolve`.
-   Long-running file handles may block deletion—ensure proper close in code under test.
-   Permission issues with custom `baseDir`—choose a writable location.

## Troubleshooting

| Symptom                    | Cause                           | Resolution                                                                    |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Files persist across tests | `keep: true` or external writes | Disable `keep` or fix code writing outside sandbox.                           |
| Path not found             | Absolute path usage             | Switch to relative paths or use `resolve()` for absolute path within sandbox. |
| Cleanup fails              | Open file handles               | Ensure files are closed; check for background processes.                      |

## Debugging

Set `keep: true` to inspect contents after failures.
