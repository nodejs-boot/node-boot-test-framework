import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {useNodeBoot} from "@nodeboot/node-test";
import {TestAppWithMongoPersistence, UserService} from "../src/app";

// Demonstrates spy & mock hooks for node-test
describe("Demonstrates spy & mock hooks for node-test", () => {
    const {useService, useSpy, useMock} = useNodeBoot(TestAppWithMongoPersistence, ({useConfig, useMongoContainer}) => {
        useConfig({app: {port: 35001}});

        useMongoContainer({
            dbName: "test-db",
            image: "mongo:8",
        });
    });

    test("should spy on UserService.findAllUser", async () => {
        console.log("[SpyTest] Starting spy test");
        const userService = useService(UserService);
        const spy = useSpy(UserService, "findAllUser");

        console.log("[SpyTest] Calling findAllUser");
        await userService.findAllUser();

        console.log("[SpyTest] Completed call");
        assert.equal(spy.callCount, 1, "Expected findAllUser to be called once");

        assert.ok(Array.isArray(spy.calls), "Calls should be tracked");
        spy.restore();
    });

    test("should mock UserService.findAllUser", async () => {
        useMock(UserService, {
            async findAllUser() {
                return [{id: "mock", email: "mock@example.com", password: "mockpass"}];
            },
        });
        const userService = useService(UserService);
        const result = await userService.findAllUser();
        assert.equal(result[0]?.email, "mock@example.com");
    });
});
