# AddressHook

Provides the application base URL (e.g., `http://localhost:<port>`) once the NodeBoot app has started and invokes registered consumers prior to tests.

## Purpose

Some hooks/tools (HTTP clients, Pactum, custom integrations) need the server address early. `AddressHook` supplies it without making test code query internal app objects.

## Usage

```ts
const {useAddress} = useNodeBoot(MyApp, ({useAddress}) => {
    useAddress(addr => console.log("Server listening at", addr));
});
```

Within tests you typically rely on side effects done inside the consumer. If you need to capture it into a variable, define one in outer scope:

```ts
let baseUrl: string;
const {useAddress} = useNodeBoot(MyApp, ({useAddress}) => {
    useAddress(addr => {
        baseUrl = addr;
    });
});

test("can reach health endpoint", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.ok).toBe(true);
});
```

## Lifecycle

-   afterStart: builds `http://localhost:<port>` and stores state.
-   beforeTests: invokes all registered consumers with the computed address.

## API

`useAddress(consumer: (address: string) => void)`

-   Register any number of consumers; order preserved.

## Notes

If you require an HTTP client instance, prefer `HttpClientHook` or `SupertestHook` to avoid manual fetch boilerplate.
