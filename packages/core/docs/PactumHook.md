# PactumHook

Integrates Pactum HTTP testing library with NodeBoot, auto-setting the base URL and request timeout.

## Registration

```ts
usePactum(); // uses NodeBoot server address
// or
usePactum("http://external-service:4000");
```

## Usage

```ts
await pactum.spec().get("/health").expectStatus(200);
```

## Behavior

-   afterStart: sets Pactum base URL (custom or derived) and default timeout (15000ms).
-   afterTests: clears base URL to avoid cross-suite leakage.

## Configuration

`usePactum(baseUrl?: string)` optionally override server address before tests.

## Troubleshooting

If requests go to wrong address, ensure only one `usePactum` call or last call sets desired URL.
