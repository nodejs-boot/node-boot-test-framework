# LoggerHook

Provides test-time access to the shared Winston logger used by the framework.

## Purpose

Expose the same logger instance that the application and framework use so tests can:

-   Emit logs for debugging
-   Integrate with `LogCaptureHook` and `LogMatchHook` to assert log behavior
-   Control level via environment (`LOG_LEVEL`)

## Setup / Activation (node:test + useNodeBoot)

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("LoggerHook - Basic", () => {
    const {useLogger} = useNodeBoot(EmptyApp, () => {});

    it("emits logs", () => {
        const logger = useLogger();
        logger.info("hello from test");
        assert.ok(true);
    });
});
```

## Integration

-   Combine with `LogCaptureHook` to capture emitted logs for assertions.
-   Use `LogMatchHook` to assert presence/absence of patterns.

## API

```typescript
const logger = useLogger(); // returns winston.Logger
logger.info("message");
logger.warn("warning");
logger.error("error");
```

## Configuration

-   Level is controlled via `process.env.LOG_LEVEL` (default: `debug`).

## Troubleshooting

-   If logs don’t appear in capture/match hooks, ensure those hooks are activated in setup and that `LOG_LEVEL` isn’t filtering them out.
