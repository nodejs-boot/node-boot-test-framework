# RepositoryHook

Retrieves IoC-managed data repository instances (decorated with `@SDataRepository`).

## Usage

```ts
const userRepo = useRepository(UserRepository);
const users = await userRepo.find({});
```

## Validation

Throws if class lacks `@SDataRepository` metadata.

## Best Practices

-   Keep repository interactions inside services for business logic; use repository directly only for focused data tests.

## Troubleshooting

Error `not decorated with @SDataRepository` — ensure decorator imported & applied.
