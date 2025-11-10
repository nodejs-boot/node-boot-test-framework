# HttpClientHook

Provides cached Axios HTTP clients bound to the NodeBoot server address or custom base URLs.

## Usage

```ts
const {useHttpClient} = useNodeBoot(MyApp, ({useHttpClient}) => {
    useHttpClient(); // optional - auto client for app port
});

test("GET /health", async () => {
    const http = useHttpClient();
    const res = await http.get("/health");
    expect(res.status).toBe(200);
});
```

Custom base URL:

```ts
const external = useHttpClient("https://api.example.test");
```

## Behavior

-   afterStart: creates client for app address and caches under key.
-   afterTests: clears client cache.

## API

`useHttpClient(baseURL?: string): AxiosInstance`

-   Creates new client if missing for provided baseURL.
-   Reuses existing instance otherwise.

Default client config:

-   `timeout: 15000`
-   `Content-Type: application/json`

## Best Practices

-   Reuse clients for connection pooling & interceptor sharing.
-   Add interceptors inside test setup after obtaining instance.

## Troubleshooting

Error `No HTTP client instance available` indicates server not started and no custom base provided.
