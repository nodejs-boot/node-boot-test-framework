# TimerHook

Provides controlled time manipulation and lightweight duration tracking using `@sinonjs/fake-timers`.

## Features

-   Fake timers for `setTimeout`, `setInterval`, and `Date`.
-   Manual clock advancement.
-   Simple duration tracking objects.

## Usage

```ts
const {useTimer} = useNodeBoot(MyApp, ({useTimer}) => {
    useTimer();
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
