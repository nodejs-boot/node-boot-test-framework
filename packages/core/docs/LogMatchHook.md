# LogMatchHook

Asserts presence or absence of log message patterns. Works alongside `LogCaptureHook` but independently duplicates capture for simplicity.

## Configuration

```ts
useLogMatch({
    expect: ["Server started", /port:\s+\d+/], // must appear
    forbid: [/ERROR/], // must NOT appear
    scope: "current", // 'current' (default) or 'all'
});
```

## Pattern Types

-   String: substring match via `includes`.
-   RegExp: `.test()` against log line.

## Scope Behavior

-   `current`: each test evaluated individually after it runs.
-   `all`: patterns evaluated again against global logs after entire suite.

## Usage

```ts
useLogMatch({expect: [/started/i]});

// No explicit API needed for assertions; failures throw automatically.
```

Programmatic access:

```ts
const {getAll, getCurrentTest} = useLogMatch();
expect(getCurrentTest().length).toBeGreaterThan(0);
```

## Lifecycle

-   beforeTests: patches logger.
-   beforeEachTest: resets current buffer.
-   afterEachTest: evaluates expect/forbid (current scope).
-   afterTests: optional global evaluation if `scope === 'all'`, then restore.

## Failure Messages

-   Missing: `Expected log pattern not found: /regex/` or `Expected log pattern not found: 'text'`
-   Forbidden: `Forbidden log pattern appeared: 'text'`

## Best Practices

-   Keep patterns specific to avoid false positives.
-   Prefer RegExp for flexible matching (case-insensitive via `/.../i`).
-   Use `scope: 'all'` for startup-only messages.

## Combine With

-   `LogCaptureHook` for manual inspection.
-   Performance or leak detectors to correlate anomalies with logs.
