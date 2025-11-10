# SupertestHook

Provides a Supertest agent bound to the NodeBoot HTTP server for endpoint testing.

## Usage

```ts
const {useSupertest} = useNodeBoot(MyApp, ({useSupertest}) => {
    useSupertest();
});

test("GET /health", async () => {
    const request = useSupertest();
    await request.get("/health").expect(200);
});
```

## Behavior

-   afterStart: stores `NodeBootAppView` and its server.
-   afterTests: resets reference to release resources.

## API

`useSupertest(): TestAgent` — throws if server not available.

## Best Practices

-   Prefer Supertest for precise HTTP assertions (status, headers, body) over generic clients.
-   Chain expectations: `request.post('/x').send(payload).expect(201).expect('Content-Type', /json/)`.

## Troubleshooting

Error about server not available: ensure hook registered in setup portion of `useNodeBoot` and not inside test.
