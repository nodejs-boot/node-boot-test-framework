# TimerHook

The `TimerHook` provides controlled time manipulation and lightweight duration tracking using `@sinonjs/fake-timers`. This enables deterministic testing of time-dependent code without waiting for real time to pass.

## Purpose

Testing time-dependent code (delays, timeouts, intervals, scheduled tasks) is challenging with real timers. `TimerHook` provides fake timers that can be advanced manually, making tests fast, deterministic, and reliable.

## Features

-   **Fake Timers**: Replace real `setTimeout`, `setInterval`, and `Date` with controllable versions
-   **Manual Time Control**: Advance time manually without waiting
-   **Duration Tracking**: Lightweight tracking objects to measure elapsed time
-   **Configurable**: Choose which timer APIs to fake
-   **Automatic Cleanup**: Timers automatically restored after tests

## Setup

To enable fake timers, call `useTimer()` in your test setup phase. This ensures all timers are faked before your app or tests create any timers.

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Setup", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer(); // Enables fake timers for setTimeout, setInterval, Date, etc.
    });

    it("should have fake timers enabled", () => {
        const {control} = useTimer();
        assert.ok(control);
        assert.ok(typeof control().advanceTimeBy === "function");
    });
});
```

## Basic Timer Control

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Basic Control", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should advance setTimeout", () => {
        const {control} = useTimer();
        let fired = false;

        setTimeout(() => {
            fired = true;
        }, 5000);

        assert.strictEqual(fired, false);
        control().advanceTimeBy(5000);
        assert.strictEqual(fired, true);
    });

    it("should advance setInterval", () => {
        const {control} = useTimer();
        let count = 0;

        setInterval(() => {
            count++;
        }, 1000);

        assert.strictEqual(count, 0);
        control().advanceTimeBy(3000);
        assert.strictEqual(count, 3);
    });
});
```

## Running All Timers

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Run All Timers", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should run all pending timers", () => {
        const {control} = useTimer();
        let count = 0;

        setTimeout(() => count++, 100);
        setTimeout(() => count++, 500);
        setTimeout(() => count++, 1000);

        assert.strictEqual(count, 0);
        control().runAllTimers();
        assert.strictEqual(count, 3);
    });
});
```

## Duration Tracking

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Duration Tracking", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should track elapsed time", () => {
        const {control, tracking} = useTimer();
        const timer = tracking();

        control().advanceTimeBy(1000);
        control().advanceTimeBy(2000);
        control().advanceTimeBy(3000);

        timer.stop();
        assert.ok(timer.elapsed() >= 6000);
    });

    it("should track operation duration", () => {
        const {control, tracking} = useTimer();
        const timer = tracking();

        setTimeout(() => {
            // Operation completed
        }, 5000);

        control().advanceTimeBy(5000);
        timer.stop();

        assert.ok(timer.elapsed() >= 5000);
    });
});
```

## Testing Delayed Operations

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {SchedulerService} from "../src/services/SchedulerService";

describe("TimerHook - Delayed Operations", () => {
    const {useTimer, useService} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should test delayed task execution", async () => {
        const {control} = useTimer();
        const scheduler = useService(SchedulerService);

        const results: string[] = [];

        scheduler.scheduleTask(() => {
            results.push("task1");
        }, 1000);

        scheduler.scheduleTask(() => {
            results.push("task2");
        }, 2000);

        assert.strictEqual(results.length, 0);

        control().advanceTimeBy(1000);
        assert.deepStrictEqual(results, ["task1"]);

        control().advanceTimeBy(1000);
        assert.deepStrictEqual(results, ["task1", "task2"]);
    });
});
```

## Testing Retry Logic

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {RetryService} from "../src/services/RetryService";

describe("TimerHook - Retry Logic", () => {
    const {useTimer, useService} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should test exponential backoff", () => {
        const {control} = useTimer();
        const retryService = useService(RetryService);

        let attempts = 0;
        retryService.retryWithBackoff(() => {
            attempts++;
            if (attempts < 3) throw new Error("Failed");
        });

        assert.strictEqual(attempts, 1); // Initial attempt

        control().advanceTimeBy(1000); // First retry after 1s
        assert.strictEqual(attempts, 2);

        control().advanceTimeBy(2000); // Second retry after 2s
        assert.strictEqual(attempts, 3);
    });
});
```

## Testing Debounce and Throttle

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";
import {SearchService} from "../src/services/SearchService";

describe("TimerHook - Debounce/Throttle", () => {
    const {useTimer, useService} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should test debounced search", () => {
        const {control} = useTimer();
        const searchService = useService(SearchService);

        let searchCount = 0;
        const debouncedSearch = searchService.createDebouncedSearch(() => {
            searchCount++;
        }, 300);

        // Rapid calls
        debouncedSearch("a");
        debouncedSearch("ab");
        debouncedSearch("abc");

        assert.strictEqual(searchCount, 0); // Not executed yet

        control().advanceTimeBy(300);
        assert.strictEqual(searchCount, 1); // Executed once after debounce
    });

    it("should test throttled updates", () => {
        const {control} = useTimer();
        const searchService = useService(SearchService);

        let updateCount = 0;
        const throttledUpdate = searchService.createThrottledUpdate(() => {
            updateCount++;
        }, 1000);

        throttledUpdate();
        control().advanceTimeBy(500);
        throttledUpdate(); // Throttled, won't execute

        assert.strictEqual(updateCount, 1);

        control().advanceTimeBy(500);
        throttledUpdate(); // Now can execute

        assert.strictEqual(updateCount, 2);
    });
});
```

## Testing Date.now()

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Date Control", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer(); // Fakes Date as well
    });

    it("should control Date.now()", () => {
        const {control} = useTimer();

        const startTime = Date.now();
        control().advanceTimeBy(5000);
        const endTime = Date.now();

        assert.strictEqual(endTime - startTime, 5000);
    });

    it("should control new Date()", () => {
        const {control} = useTimer();

        const start = new Date();
        control().advanceTimeBy(10000);
        const end = new Date();

        assert.strictEqual(end.getTime() - start.getTime(), 10000);
    });
});
```

## Configuration Options

You can customize which timer APIs are faked:

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Custom Configuration", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer({
            toFake: ["setTimeout", "clearTimeout", "Date"],
        }); // Only fakes setTimeout, clearTimeout, and Date
    });

    it("should only fake configured timers", () => {
        const {control} = useTimer();
        let fired = false;

        setTimeout(() => {
            fired = true;
        }, 1000);

        control().advanceTimeBy(1000);
        assert.strictEqual(fired, true);
    });
});
```

**Available options:**

-   `setTimeout`
-   `clearTimeout`
-   `setInterval`
-   `clearInterval`
-   `Date`

**Default:** `["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"]`

## Complex Async Scenarios

```typescript
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {EmptyApp} from "../src/empty-app";

describe("TimerHook - Complex Scenarios", () => {
    const {useTimer} = useNodeBoot(EmptyApp, ({useTimer}) => {
        useTimer();
    });

    it("should handle nested timers", () => {
        const {control} = useTimer();
        const events: string[] = [];

        setTimeout(() => {
            events.push("outer");
            setTimeout(() => {
                events.push("inner");
            }, 1000);
        }, 1000);

        control().advanceTimeBy(1000);
        assert.deepStrictEqual(events, ["outer"]);

        control().advanceTimeBy(1000);
        assert.deepStrictEqual(events, ["outer", "inner"]);
    });

    it("should handle timer cancellation", () => {
        const {control} = useTimer();
        let executed = false;

        const timerId = setTimeout(() => {
            executed = true;
        }, 1000);

        clearTimeout(timerId);
        control().advanceTimeBy(1000);

        assert.strictEqual(executed, false);
    });
});
```

## Lifecycle

-   **beforeTests**: Installs fake timers
-   **afterTests**: Uninstalls fake timers, restoring real time

## API

### `useTimer(options?: TimerOptions): TimerControl`

**Setup mode** (in setup phase):
Enables and configures fake timers.

**Parameters:**

-   `options.toFake` (optional): Array of timer APIs to fake. Default: all timers

**Usage mode** (in tests):
Returns timer control functions.

**Returns:**

-   `control()`: Returns `{advanceTimeBy(ms), runAllTimers()}`
-   `advanceTimeBy(ms)`: Advances the fake clock by specified milliseconds
-   `runAllTimers()`: Executes all pending timers immediately
-   `tracking()`: Returns `TimeTracking` object
-   `stop()`: Finalizes tracking
-   `elapsed()`: Returns elapsed milliseconds

## Best Practices

-   **Always Stop Tracking**: Call `stop()` on tracking instances to avoid memory retention
-   **Advance, Don't Wait**: Use `advanceTimeBy` instead of `await new Promise` for deterministic tests
-   **Avoid Mixing**: Don't mix real async operations with heavy fake timer advancement unless properly awaited
-   **Configure Selectively**: Only fake the timers you need for the test
-   **Test Time-Dependent Logic**: Perfect for testing delays, retries, debounce, throttle, scheduling

## Troubleshooting

**Date.now() values seem incorrect:**

-   Ensure hook was initialized in setup phase (call `useTimer` in setup function)
-   Avoid creating real timers before hook activates
-   Verify `Date` is included in `toFake` option

**Timers not advancing:**

-   Confirm you're calling `control().advanceTimeBy()` or `control().runAllTimers()`
-   Check that `useTimer` was called in setup phase
-   Verify the timer delay matches the advance amount

**Tests timing out:**

-   Don't use real `await` with fake timers
-   Call `runAllTimers()` to immediately execute pending timers
-   Check for infinite loops in interval timers

**Memory leaks:**

-   Always call `stop()` on tracking instances
-   Clear intervals that shouldn't run indefinitely
-   Ensure fake timers are properly cleaned up (automatic in `afterTests`)
