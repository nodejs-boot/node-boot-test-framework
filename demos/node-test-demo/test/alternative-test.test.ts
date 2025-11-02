import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useNodeBoot } from '@nodeboot/node-test';
import {TestAppWithMongoPersistence, UserService} from "../src/app";

/**
 * Test using a different approach - setup/teardown within suite
 */
describe('Alternative Node-Boot Test', async () => {
    let nodeBootContext: any;

    // Manual setup before all tests
    try {
        nodeBootContext = useNodeBoot(
            TestAppWithMongoPersistence,
            ({ useConfig, usePactum }) => {
                useConfig({
                    app: { port: 20002 },
                    database: {
                        type: 'mongodb',
                        url: 'mongodb://localhost:27017/test-db'
                    }
                });
                usePactum();
            }
        );

        console.log('NodeBoot setup completed successfully');
    } catch (error) {
        console.error('NodeBoot setup failed:', error);
        throw error;
    }

    it('should instantiate UserService with manual setup', async () => {
        const userService = nodeBootContext.useService(UserService);

        assert.ok(userService, 'Expected UserService to be instantiated');
        assert.strictEqual(typeof userService.findAllUser, 'function', 'Expected findAllUser method to exist');
    });
});
