# TimerHook

Provides controlled time manipulation and lightweight duration tracking using `@sinonjs/fake-timers`.

## Setup

To enable fake timers, call `useTimer()` in your test setup phase (e.g., inside the `useNodeBoot` setup callback). This ensures all timers are faked before your app or tests create any timers.

```ts
const {useTimer} = useNodeBoot(MyApp, ({useTimer}) => {
    useTimer(); // Enables fake timers for setTimeout, setInterval, Date, etc.
});
```

## Configuration

You can customize which timer APIs are faked by passing the `toFake` option. The default is `["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"]`.

```ts
useTimer({toFake: ["setTimeout", "clearTimeout", "Date"]}); // Only fakes setTimeout, clearTimeout, and Date
```

**Available options:**

-   `setTimeout`
-   `clearTimeout`
-   `setInterval`
-   `clearInterval`
-   `Date`

## Features

-   Fake timers for `setTimeout`, `setInterval`, and `Date`.
-   Manual clock advancement.
-   Simple duration tracking objects.

## Usage

```ts
describe("TimerHook Sample Test", () => {
    const {useTimer} = useNodeBoot(MyApp, ({useTimer}) => {
        useTimer({toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"]});
    });

    test("advances timers", () => {
        const {control, tracking} = useTimer();
        const t = tracking();
        let fired = false;
        setTimeout(() => {
            fired = true;
        }, 5000);
        control().advanceTimeBy(5000);
        t.stop();
        expect(fired).toBe(true);
        expect(t.elapsed()).toBeGreaterThanOrEqual(5000);
    });
});
```

## API

`useTimer()` returns:

-   `control(): { advanceTimeBy(ms), runAllTimers() }`
-   `tracking(): TimeTracking` where `stop()` finalizes and `elapsed()` returns ms.

## Lifecycle

-   beforeTests: installs fake timers.
-   afterTests: uninstalls, restoring real time.

## Best Practices

-   Always `stop()` tracking instances to avoid memory retention.
-   Advance clock instead of awaiting real time for deterministic tests.
-   Avoid mixing real async operations with heavy fake timer advancement unless awaited.

## Troubleshooting

If `Date.now()` values seem off:

-   Ensure hook was initialized (call `useTimer` in setup function).
-   Avoid creating real timers before hook activates.
