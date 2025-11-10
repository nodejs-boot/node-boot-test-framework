# EnvHook

Sets environment variables for the duration of the test suite and restores originals afterward.

## Usage

```ts
useEnv({FEATURE_FLAG: "true", API_URL: "http://example"});
```

Variables merge across calls; later calls override earlier values.

## Lifecycle

-   afterStart: snapshots original `process.env`.
-   beforeTests: applies accumulated vars.
-   afterTests: restores original environment object.

## Best Practices

-   Only set variables required for tests; avoid clobbering global sensitive values.
-   For per-test changes, manage manually in the test rather than hook (this hook is suite-wide).

## Troubleshooting

If variable not restored, ensure no test mutated `process.env` references directly; prefer assignment `process.env.KEY = value`.
