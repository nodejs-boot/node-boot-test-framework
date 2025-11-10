# MemoryFileSystemHook

Replaces Node's `fs` module with an in-memory `memfs` implementation for fast, isolated file operations during tests.

## Features

-   In-memory file system seeded with optional initial files.
-   Automatic reset before each test (configurable).
-   Optional mirroring of write operations to the real filesystem for debugging or artifact generation.
-   Supports both callback and promises `fs` APIs.

## Configuration

```ts
useMemoryFileSystem({
    files: {"config/app.json": '{"ok":true}'}, // seed files
    resetEachTest: true, // default true
    mirrorToRealFs: false, // also apply writes to real disk
});
```

## Usage

```ts
const {fs, seed, toJSON, reset, realFs} = useMemoryFileSystem();
fs.writeFileSync("tmp/data.txt", "hello");
expect(fs.readFileSync("tmp/data.txt", "utf8")).toBe("hello");

// Add more seed files mid-suite
seed({"extra/info.txt": "42"});

// Inspect full volume
console.log(toJSON());
```

## Mirroring Writes

Enable `mirrorToRealFs` to duplicate write operations to the underlying real `fs` module (helpful for debugging artifacts):

```ts
useMemoryFileSystem({mirrorToRealFs: true});
```

Writes (e.g., `writeFileSync`, `appendFileSync`, `mkdirSync`) are first applied in-memory, then attempted on real disk. Errors in real-disk mirroring are swallowed to avoid test flakiness.

## Lifecycle

-   beforeStart / beforeTests: patches global `fs` early.
-   beforeEachTest: resets volume if `resetEachTest`.
-   afterTests: restores original `fs` implementation.

## API

`useMemoryFileSystem()` returns:

-   `fs`: memfs replacement (drop-in for Node `fs`).
-   `volume`: underlying `Volume` instance.
-   `seed(files)`: add or overwrite files.
-   `toJSON()`: snapshot of current file tree.
-   `restore()`: manually restore original `fs` early.
-   `realFs()`: access original Node `fs` implementation.
-   `reset()`: manually reset volume (reapplies initial seed files if configured).

## Example: JSON Fixture Isolation

```ts
useMemoryFileSystem({files: {"fixtures/user.json": '{"id":1}'}});

test("reads fixture", () => {
    const {fs} = useMemoryFileSystem();
    const user = JSON.parse(fs.readFileSync("fixtures/user.json", "utf8"));
    expect(user.id).toBe(1);
});
```

## Best Practices

-   Use relative paths; avoid absolute OS paths for portability.
-   Keep seed files minimal to reduce test startup time.
-   Prefer `resetEachTest: true` for strong isolation; disable only for intentional cross-test reuse.

## Compare With FileSystemSandboxHook

-   MemoryFileSystemHook: faster; no actual disk IO; good for heavy read/write tests.
-   FileSystemSandboxHook: real filesystem semantics (useful when code relies on OS features not emulated by memfs).

## Troubleshooting

-   If a module imported before patch captures `fs` reference internally, ensure MemoryFileSystemHook runs with very early priority (already set to -30) or import after hook setup.
-   Missing seed files each test? Confirm `resetEachTest` is true and `files` provided.
