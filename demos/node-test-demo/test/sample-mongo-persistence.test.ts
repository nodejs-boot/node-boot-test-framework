import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useNodeBoot } from '@nodeboot/node-test';
import {TestAppWithMongoPersistence, UserRepository} from "../src/app";

/**
 * A test suite demonstrating NodeBoot app testing using node:test
 * with Mongo persistence, DI, and runtime hooks.
 */
describe('Sample Node-Boot Persistence Test', () => {
    // Initialize NodeBoot with configuration and Mongo container
    const { useRepository } = useNodeBoot(
        TestAppWithMongoPersistence,
        ({ useConfig, usePactum, useMongoContainer }) => {
            useConfig({
                app: { port: 20000 },
            });

            useMongoContainer({
                dbName: 'test-db',
                image: 'mongo:8',
            });

            usePactum();
        }
    );

    it('should retrieve data from repository', async () => {
        const userRepository = useRepository(UserRepository);

        // This should no longer hang, since we’re running in the same async context
        const users = await userRepository.find({});

        assert.ok(users, 'Expected repository to return users');
    });
});
