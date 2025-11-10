# MongoContainerHook

Launches a real MongoDB container and wires persistence config automatically. See `useMongoContainer.md` for extensive examples.

## Quick Start

```ts
useMongoContainer();

test("uri available", () => {
    const {mongoUri} = useMongoContainer();
    expect(mongoUri).toMatch(/^mongodb:\/\//);
});
```

## Options

```ts
useMongoContainer({
    image: "mongo:7",
    dbName: "mydb",
    username: "user",
    password: "pass",
    port: 27017,
    env: {MONGO_INITDB_DATABASE: "mydb"},
});
```

## Provided Persistence Config

Automatically sets `persistence.type = 'mongodb'` and connection details.

## API

`useMongoContainer(options?)` register.
`useMongoContainer()` retrieve `{ mongoUri, container }`.

## Lifecycle

-   beforeStart: if enabled, starts container & sets env `MONGODB_URI`.
-   afterTests: stops container.

## See Also

Detailed usage: `useMongoContainer.md`.
