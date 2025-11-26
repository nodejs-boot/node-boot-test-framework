import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {TestAppWithMongoPersistence, UserRepository, UserService} from "../src/app";
import {spec} from "pactum";

/**
 * A test suite demonstrating NodeBoot app testing using node:test
 * with Mongo persistence, DI, and runtime hooks.
 */
describe("Sample Node-Boot Persistence Test", () => {
    // Initialize NodeBoot with configuration and Mongo container
    const {useRepository, useService, useConfig} = useNodeBoot(
        TestAppWithMongoPersistence,
        ({useConfig, usePactum, useMongoContainer}) => {
            useConfig({
                app: {port: 20000},
            });

            useMongoContainer({
                dbName: "test-db",
                image: "mongo:8",
            });

            usePactum();
        },
    );

    it("should retrieve data from repository", async () => {
        const appConfig = useConfig();
        assert.strictEqual(appConfig.get("app.port"), 20000, "Expected app port to be 20000");
        assert.strictEqual(appConfig.get("api.routePrefix"), "/api", "Expected app port to be 20000");

        const userRepository = useRepository(UserRepository);
        // This should no longer hang, since we’re running in the same async context
        const users = await userRepository.find({});
        assert.ok(users, "Expected repository to return users");
    });

    it("should retrieve data from the service", async () => {
        const userService = useService(UserService);
        const users = await userService.findAllUser();
        assert.ok(users, "Expected service to return users");
    });

    it("should persist and retrieve data", async () => {
        const userService = useService(UserService);

        await userService.createUser({
            email: "ney.br.santos@gmail.com",
            name: "Manuel Santos",
            password: "123456789",
        });

        // This should no longer hang, since we’re running in the same async context
        const users = await userService.findAllUser();

        assert.strictEqual(users.length, 1, "Expected 1 user stored");
    });

    it("should retrieve data via HTTP", async () => {
        await spec()
            .post("/api/users/")
            .withJson({
                name: "bolt",
                email: "bolt@swift.run",
                password: "123456789",
            })
            .expectStatus(200);

        const response = await spec().get("/api/users/").returns("res.body");

        assert.strictEqual(response.length, 2, "Expected 2 users stored");
    });
});
