import {useNodeBoot} from "@nodeboot/jest";
import {TestAppWithMongoPersistence, UserRepository} from "./app-with-mongo-persistence";
import {beforeAll} from "@jest/globals";

/**
 * A test suite demonstrating the usage of useNodeBoot framework for testing NodeBoot
 * applications with dependency injection and mocking capabilities.
 * */
describe("Sample Node-Boot Persistence Test", () => {
    beforeAll(() => {
        jest.useRealTimers();
    });

    const {useRepository} = useNodeBoot(TestAppWithMongoPersistence, ({useConfig, usePactum, useMongoContainer}) => {
        useConfig({
            app: {
                port: 20000,
            },
        });

        useMongoContainer({
            dbName: "test-db",
            image: "mongo:8",
        });

        usePactum();
    });

    it("should retrieve data from repository", async () => {
        const userRepository = useRepository(UserRepository);

        // hanging here
        const users = await userRepository.find({});

        expect(users).toBeDefined();
    });
});
