# MemoryFileSystemHook

Replaces Node's `fs` module with an in-memory `memfs` implementation for fast, isolated file operations during tests.

## Purpose

Provides an in-memory replacement for Node's `fs` enabling ultra-fast, isolated file operations for tests without touching disk. Ideal for fixtures, transformation pipelines, and heavy ephemeral I/O scenarios.

## Features

-   In-memory file system seeded with optional initial files.
-   Automatic reset before each test (configurable).
-   Optional mirroring of write operations to the real filesystem for debugging or artifact generation.
-   Supports both callback and promises `fs` APIs.

## Setup

Register in `useNodeBoot` setup callback. Patch must occur early before application or libraries import and capture the original `fs`.

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("MemoryFileSystemHook - Basic", () => {
    const {useMemoryFileSystem} = useNodeBoot(EmptyApp, ({useMemoryFileSystem}) => {
        useMemoryFileSystem({files: {"config/app.json": '{"ok":true}'}});
    });

    it("reads seeded file", () => {
        const {fs} = useMemoryFileSystem();
        const raw = fs.readFileSync("config/app.json", "utf8");
        assert.ok(raw.includes("ok"));
    });
});
```

## Basic Usage

```typescript
it("writes & reads file", () => {
    const {fs} = useMemoryFileSystem();
    fs.writeFileSync("tmp/data.txt", "hello");
    assert.strictEqual(fs.readFileSync("tmp/data.txt", "utf8"), "hello");
});
```

## Configuration Examples

```typescript
useMemoryFileSystem({
    files: {"fixtures/user.json": '{"id":1}'},
    resetEachTest: true, // full reset between tests
    mirrorToRealFs: false, // set true to also write to disk
});

// Mid-suite enabling mirroring (re-registration merges/overrides):
useMemoryFileSystem({mirrorToRealFs: true});
```

## Advanced Usage

-   **Mid-test Reset**: `reset()` to clear volume and reapply initial seed.
-   **Dynamic Seeding**: `seed({...})` to add new test data without reset.
-   **Binary Handling**: Use Buffers; memfs supports standard Node APIs.
-   **Selective Mirroring**: Mirror only when debugging failing tests.

```typescript
it("dynamic seeding & reset", () => {
    const {fs, seed, reset, toJSON} = useMemoryFileSystem();
    seed({"a.txt": "A"});
    assert.ok(fs.existsSync("a.txt"));
    reset(); // a.txt removed (reverts to original seed set)
    console.log(toJSON());
});
```

## Integration Patterns

| Hook                  | Pattern                                                       |
| --------------------- | ------------------------------------------------------------- |
| SnapshotStateHook     | Capture file counts before/after to detect unintended writes. |
| PerformanceBudgetHook | Measure transform pipeline duration with memory I/O.          |
| FileSystemSandboxHook | Compare performance vs real filesystem operations.            |

## Extended API

`useMemoryFileSystem()` returns:

| Member        | Description                                   |
| ------------- | --------------------------------------------- |
| `fs`          | memfs implementation (drop-in for Node `fs`). |
| `volume`      | Underlying `Volume` instance.                 |
| `seed(files)` | Add or overwrite files.                       |
| `toJSON()`    | Snapshot object of current volume.            |
| `restore()`   | Restore original `fs` early (manual unpatch). |
| `realFs()`    | Access original Node `fs` reference.          |
| `reset()`     | Clear volume & reapply initial seed.          |

## Edge Cases

-   **Module Preload**: Libraries imported before patch may retain original `fs`; ensure early hook registration.
-   **Mirroring Failures**: Real filesystem write errors are swallowed—debug by temporarily asserting existence on real path.
-   **Large Trees**: Extremely large seed sets slow startup; prefer minimal seeds.
-   **Mixed Paths**: Absolute paths may bypass volume logic—use relative paths inside tests.

## Best Practices

-   Keep seed minimal & explicit.
-   Prefer `resetEachTest: true` for isolation.
-   Use `mirrorToRealFs` sparingly to avoid slowing tests.
-   Log `toJSON()` only for debugging (avoid noise in CI).

## Troubleshooting

| Symptom                       | Cause                               | Resolution                                     |
| ----------------------------- | ----------------------------------- | ---------------------------------------------- |
| File missing after test start | Forgot to seed / reset removed file | Use `seed()` or verify initial `files` config. |
| Changes persist across tests  | `resetEachTest` disabled            | Enable or call `reset()` manually.             |
| Real disk not updated         | `mirrorToRealFs` false              | Enable mirroring; confirm path permissions.    |
| Binary corruption             | Incorrect encoding usage            | Use Buffers instead of strings where needed.   |

## Comparison vs FileSystemSandboxHook

| MemoryFileSystemHook | FileSystemSandboxHook           |
| -------------------- | ------------------------------- |
| In-memory only       | Real disk semantics             |
| Faster heavy I/O     | Closer to production filesystem |
| Perfect isolation    | Tests actual OS limitations     |

## Summary

MemoryFileSystemHook accelerates filesystem-heavy tests with clean isolation; leverage SnapshotStateHook or PerformanceBudgetHook for higher-level validation.
