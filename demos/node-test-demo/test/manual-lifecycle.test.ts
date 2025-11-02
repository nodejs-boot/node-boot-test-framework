import "reflect-metadata";
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useNodeBoot } from '@nodeboot/node-test';
import {ApplicationContext} from "@nodeboot/context";
import {ConfigService} from "@nodeboot/config";
import {TestAppWithMongoPersistence, UserService, UserRepository} from "../src/app";

/**
 * Test using manual lifecycle management to avoid async hook issues
 */
describe('Manual Lifecycle Node-Boot Test', () => {
    const nodeBootHooks = useNodeBoot(
        TestAppWithMongoPersistence,
        ({ useConfig, usePactum }) => {
            useConfig({
                app: { port: 20003 },
                database: {
                    type: 'mongodb',
                    url: 'mongodb://localhost:27017/test-db'
                }
            });
            usePactum();
        }
    );

    it('should instantiate UserService with manual lifecycle', async () => {
        const userService = nodeBootHooks.useService(UserService);
        const xpto = ApplicationContext.getIocContainer()?.get(UserService);
        const config = ApplicationContext.getIocContainer()?.get(ConfigService)
        const repo = ApplicationContext.getIocContainer()?.get(UserRepository)

        assert.ok(userService, 'Expected UserService to be instantiated');
        assert.strictEqual(typeof userService.findAllUser, 'function', 'Expected findAllUser method to exist');
    });
});
