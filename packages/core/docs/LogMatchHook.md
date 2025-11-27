# LogMatchHook

## Purpose

Assert presence or absence of log message patterns during tests without writing manual assertions. Designed to complement `LogCaptureHook` with declarative `expect`/`forbid` lists and automatic evaluation per test or across the whole suite.

## Features

-   Declarative `expect` and `forbid` pattern lists
-   Supports string substrings and RegExp patterns
-   Per-test (`current`) or whole-suite (`all`) scope
-   Optional programmatic access to captured logs
-   Works alongside `LogCaptureHook` but can operate independently

## Setup / Activation (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("LogMatchHook - Basic", () => {
    const {useLogMatch, useLogger} = useNodeBoot(EmptyApp, ({useLogMatch}) => {
        useLogMatch({
            expect: ["Server started", /port:\s+\d+/],
            forbid: [/ERROR/],
            scope: "current",
        });
    });

    it("emits expected logs without errors", () => {
        const logger = useLogger();
        logger.info("Server started");
        logger.info("port: 3000");
        // Assertions are automatic; if patterns missing/forbidden present, test fails
        assert.ok(true);
    });
});
```

## Configuration

```typescript
useLogMatch({
    expect: ["ready", /listening on/i], // must appear
    forbid: [/fatal/i, "panic"], // must NOT appear
    scope: "current", // 'current' (default) or 'all'
});
```

## Pattern Types

-   String: substring match via `includes`
-   RegExp: `.test()` against log line

## Scope Behavior

-   `current`: each test evaluated individually after it runs
-   `all`: patterns evaluated against global logs after entire suite (useful for startup-only messages)

### Scope `all` Example

```typescript
describe("LogMatchHook - Scope all", () => {
    const {useLogMatch, useLogger} = useNodeBoot(EmptyApp, ({useLogMatch}) => {
        useLogMatch({expect: [/started/i], scope: "all"});
    });

    it("startup logs appear", () => {
        const logger = useLogger();
        logger.info("Server STARTED");
    });

    it("other test", () => {
        // evaluation happens after all tests, not per-test
    });
});
```

## Usage

```typescript
useLogMatch({expect: [/started/i]});
// No explicit API needed for assertions; failures throw automatically.
```

## Programmatic Access

```typescript
const {getAll, getCurrentTest} = useLogMatch();
// Inspect captured logs when you need custom assertions
expect(getCurrentTest().length).toBeGreaterThan(0);
```

## Integration Patterns

| Hook                     | Pattern                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| LogCaptureHook           | Use for manual inspection alongside declarative pattern checks.        |
| PerformanceBudgetHook    | Correlate slow operations with specific warning/error logs.            |
| ResourceLeakDetectorHook | Verify absence of leak-related logs across the suite (`scope: 'all'`). |

## API (shape)

```typescript
useLogMatch({
  expect?: Array<string | RegExp>;
  forbid?: Array<string | RegExp>;
  scope?: "current" | "all"; // default 'current'
});

// Test-time access
const { getAll, getCurrentTest } = useLogMatch();
```

## Failure Messages

-   Missing: `Expected log pattern not found: /regex/` or `Expected log pattern not found: 'text'`
-   Forbidden: `Forbidden log pattern appeared: 'text'`

## Best Practices

-   Keep patterns specific to avoid false positives.
-   Prefer RegExp for flexible matching (case-insensitive via `/.../i`).
-   Use `scope: 'all'` for startup-only or once-per-suite messages.
-   Combine with `LogCaptureHook` when debugging complex sequences.

## Troubleshooting

| Symptom                         | Cause                                 | Resolution                                                              |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Test fails with missing pattern | Pattern too strict or log not emitted | Relax to RegExp or ensure code emits expected log.                      |
| False positives                 | Generic substring                     | Use RegExp with anchors or case-insensitive flags.                      |
| No logs captured                | Logger not patched or wrong level     | Ensure framework logger usage and that default level captures messages. |

## Edge Cases

-   Multi-line logs: matching performed per line; design patterns accordingly.
-   Very noisy suites: prefer `scope: 'current'` to limit noise, or filter via more specific patterns.
-   Mixed logger instances: ensure tests use the framework logger, not console.

## Lifecycle

-   beforeTests: patches logger.
-   beforeEachTest: resets current buffer.
-   afterEachTest: evaluates expect/forbid (current scope).
-   afterTests: optional global evaluation if `scope === 'all'`, then restore.
