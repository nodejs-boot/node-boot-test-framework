# FileSystemSandboxHook

Creates an isolated temporary directory for each test. Ensures file IO does not leak or conflict between tests.

## Features

-   Per-test temp directory (removed automatically).
-   Custom base directory and name prefix.
-   Optional keep flag for debugging.
-   Helper API for common operations.

## Configuration

```ts
useFileSystemSandbox({
    baseDir: "/custom/tmp", // default: os.tmpdir()
    prefix: "nb-sandbox-", // default
    keep: false, // keep directories after tests if true
});
```

## Usage

```ts
const {path, resolve, writeText, readText, exists} = useFileSystemSandbox();
writeText("data/input.txt", "hello");
expect(readText("data/input.txt")).toBe("hello");
expect(exists("data/input.txt")).toBe(true);
```

## Lifecycle

-   beforeEachTest: creates new directory.
-   afterEachTest: removes directory unless `keep`.
-   afterTests: double-check cleanup.

## API

`useFileSystemSandbox()` returns:

-   `path`: root sandbox path.
-   `resolve(...segments)`: join path segments within sandbox.
-   `writeText(rel, content)`: write UTF-8 text (creates parent dirs).
-   `readText(rel)`: read text.
-   `exists(rel)`: boolean.

## Debugging

Set `keep: true` to inspect contents after failures.

## Best Practices

-   Never rely on sandbox path stability between tests.
-   Use relative paths with helpers; avoid hardcoding absolute paths.

## Compare With MemoryFileSystemHook

See `MemoryVsSandbox.md` for trade-offs (real filesystem vs in-memory).
