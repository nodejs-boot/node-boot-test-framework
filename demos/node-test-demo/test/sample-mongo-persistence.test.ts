import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {TestAppWithMongoPersistence, UserRepository, UserService} from "../src/app";

/**
 * A test suite demonstrating NodeBoot app testing using node:test
 * with Mongo persistence, DI, and runtime hooks.
 */
describe("Sample Node-Boot Persistence Test", () => {
    // Initialize NodeBoot with configuration and Mongo container
    const {useRepository, useService} = useNodeBoot(
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
        const userRepository = useRepository(UserRepository);

        // This should no longer hang, since we’re running in the same async context
        const users = await userRepository.find({});

        assert.ok(users, "Expected repository to return users");
    });

    it("should retrieve data from the service", async () => {
        const userService = useService(UserService);

        // This should no longer hang, since we’re running in the same async context
        const users = await userService.findAllUser();

        assert.ok(users, "Expected repository to return users");
    });

    it("should persist and retrieve data", async () => {
        const userService = useService(UserService);

        await userService.createUser({
            email: "ney.br.santos@gmail.com",
            name: "Manuel Santos",
            password: "123456",
        });

        // This should no longer hang, since we’re running in the same async context
        const users = await userService.findAllUser();

        assert.strictEqual(users.length, 1, "Expected 1 user stored");
    });
});
