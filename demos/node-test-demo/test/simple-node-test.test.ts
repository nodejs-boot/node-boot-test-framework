import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useNodeBoot } from '@nodeboot/node-test';
import {TestAppWithMongoPersistence, UserService} from "../src/app";

/**
 * A simple test suite demonstrating NodeBoot app testing using node:test
 * with basic service injection (no database containers needed).
 */
describe('Simple Node-Boot Test', () => {
    // Initialize NodeBoot with minimal configuration
    const { useService } = useNodeBoot(
        TestAppWithMongoPersistence,
        ({ useConfig, usePactum }) => {
            useConfig({
                app: { port: 20001 },
                database: {
                    type: 'mongodb',
                    url: 'mongodb://localhost:27017/test-db'
                }
            });

            usePactum();
        }
    );

    it('should instantiate UserService', async () => {
        const userService = useService(UserService);

        assert.ok(userService, 'Expected UserService to be instantiated');
        assert.strictEqual(typeof userService.findAllUser, 'function', 'Expected findAllUser method to exist');
    });
});
