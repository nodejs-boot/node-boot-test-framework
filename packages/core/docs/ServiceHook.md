# ServiceHook

Retrieves IoC-managed service instances (decorated with `@Service`).

## Usage

```ts
const userService = useService(UserService);
await userService.createUser({name: "Alice"});
```

## Validation

Throws if target class not decorated with `@Service`.

## Best Practices

-   Favor service interactions over repository for domain logic tests.
-   Combine with `MockHook`/`SpyHook` for behavioral verification.

## Troubleshooting

Error regarding missing decorator: confirm correct import & that build step preserved metadata.
