/**
 * @fileoverview Integration Tests for TestApp NodeBoot Application
 *
 * Comprehensive integration tests demonstrating the NodeBoot Test Framework
 * with the Fastify-based TestApp application.
 */

import "reflect-metadata";
import {useNodeBoot} from "@nodeboot/jest";
import {spec} from "pactum";
import {TestApp, ServiceA, ServiceN, NotService} from "./app";

describe("TestApp Integration Tests", () => {
    const {useHttp, useService, useConfig, useSpy, useTimer} = useNodeBoot(
        TestApp,
        ({useAppContext, useConfig, useAddress, useEnv, useCleanup, usePactum}) => {
            // Enable Pactum HTTP testing
            usePactum();

            // Test-specific configuration
            useConfig({
                app: {port: 40000},
                logging: {level: "error"}, // Reduce log noise during tests
            });

            // Environment variables for testing
            useEnv({
                NODE_ENV: "test",
                LOG_LEVEL: "error",
            });

            // Server address callback
            useAddress(address => {
                console.log("TestApp server running at:", address);
            });

            // Application context validation
            useAppContext(appContext => {
                expect(appContext.config).toBeDefined();
                expect(appContext.logger).toBeDefined();
            });

            // Cleanup registration
            useCleanup({
                afterAll: () => console.log("TestApp integration tests cleanup complete"),
            });
        },
    );

    describe("Service Integration", () => {
        test("should access services running inside the application", () => {
            // Access services that are running inside the bootstrapped TestApp
            const serviceA = useService(ServiceA);
            const serviceN = useService(ServiceN);

            // Verify services are properly injected and functional
            expect(serviceA).toBeDefined();
            expect(serviceN).toBeDefined();
            expect(serviceA.doSomething()).toBe("Real ServiceA result");
            expect(serviceN.doSomethingElse()).toBe("Real ServiceN result");
        });

        test("should throw error when accessing non-service classes", () => {
            // NotService is not decorated with @Service, so should throw error
            expect(() => useService(NotService)).toThrow("The class NotService is not decorated with @Service.");
        });

        test("should spy on service methods within the running application", () => {
            const serviceASpy = useSpy(ServiceA, "doSomething");
            const serviceNSpy = useSpy(ServiceN, "doSomethingElse");

            // Access the actual services running in the app and call methods
            const serviceA = useService(ServiceA);
            const serviceN = useService(ServiceN);

            const resultA = serviceA.doSomething();
            const resultN = serviceN.doSomethingElse();

            // Verify spy captured the calls
            expect(serviceASpy).toHaveBeenCalledTimes(1);
            expect(serviceNSpy).toHaveBeenCalledTimes(1);
            expect(serviceASpy).toHaveReturnedWith("Real ServiceA result");
            expect(serviceNSpy).toHaveReturnedWith("Real ServiceN result");
            expect(resultA).toBe("Real ServiceA result");
            expect(resultN).toBe("Real ServiceN result");
        });
    });

    describe("HTTP Endpoint Integration", () => {
        test("should call /test/ping endpoint of the running application", async () => {
            const {get} = useHttp();

            // Make HTTP request to the running TestApp
            const response = await get("/api/test/ping");

            expect(response.status).toBe(200);
            expect(response.data).toEqual({
                serviceA: "Real ServiceA result",
                serviceN: "Real ServiceN result",
            });
        });

        test("should use Pactum for fluent HTTP testing", async () => {
            const response = await spec()
                .get("/api/test/ping")
                .expectStatus(200)
                .expectJsonLike({
                    serviceA: "Real ServiceA result",
                    serviceN: "Real ServiceN result",
                })
                .returns("res.body");

            expect(response.serviceA).toBe("Real ServiceA result");
            expect(response.serviceN).toBe("Real ServiceN result");
        });

        test("should verify service interactions during HTTP requests", async () => {
            const serviceASpy = useSpy(ServiceA, "doSomething");
            const serviceNSpy = useSpy(ServiceN, "doSomethingElse");

            // Make HTTP request that triggers service calls
            await spec().get("/api/test/ping").expectStatus(200);

            // Verify the HTTP request triggered the expected service calls
            expect(serviceASpy).toHaveBeenCalledTimes(1);
            expect(serviceNSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("Request/Response Transformation Integration", () => {
        const testUser = {
            firstName: "John",
            lastName: "Doe",
            socialSecurityNumber: "123-45-6789", // This should be excluded in responses
        };

        test("should handle default transformation (both request and response)", async () => {
            const {post} = useHttp();

            const response = await post("/api/test/default", testUser);

            expect(response.status).toBe(200);
            expect(response.data).toEqual({
                firstName: "John",
                // lastName should not be exposed due to @Exclude() decorator
                // socialSecurityNumber should not be exposed
            });
        });

        test("should handle no transformation", async () => {
            const response = await spec()
                .post("/api/test/noTransform")
                .withJson(testUser)
                .expectStatus(200)
                .returns("res.body");

            // With no transformation, we get raw object structure
            expect(response.firstName).toBe("John");
            expect(response.lastName).toBe("Doe");
        });

        test("should handle transform request only", async () => {
            const {post} = useHttp();

            const response = await post("/api/test/transformRequestOnly", testUser);

            expect(response.status).toBe(200);
            // Request is transformed, response is raw
            expect(response.data.firstName).toBe("John");
            expect(response.data.lastName).toBe("Doe");
        });

        test("should handle transform response only", async () => {
            const response = await spec()
                .post("/api/test/transformResponseOnly")
                .withJson(testUser)
                .expectStatus(200)
                .expectJsonLike({
                    firstName: "John",
                    // lastName should be excluded due to response transformation
                })
                .returns("res.body");

            expect(response.firstName).toBe("John");
            expect(response.lastName).toBeUndefined();
        });

        test("should handle missing lastName with default value", async () => {
            const userWithoutLastName = {
                firstName: "Jane",
                // No lastName provided
            };

            const {post} = useHttp();
            const response = await post("/api/test/noTransform", userWithoutLastName);

            expect(response.status).toBe(200);
            expect(response.data.firstName).toBe("Jane");
            expect(response.data.lastName).toBe("default"); // Default value applied
        });
    });

    describe("Application Configuration Integration", () => {
        test("should access application configuration", () => {
            const config = useConfig();

            expect(config).toBeDefined();
            expect(config.getNumber("app.port")).toBe(40000);
            expect(config.getString("logging.level")).toBe("error");
        });

        test("should verify environment variables are set", () => {
            expect(process.env["NODE_ENV"]).toBe("test");
            expect(process.env["LOG_LEVEL"]).toBe("error");
        });
    });

    describe("Service Mocking Integration", () => {
        describe("with mocked ServiceA", () => {
            const {useService: useMockedService} = useNodeBoot(TestApp, ({useConfig, useMock, usePactum}) => {
                useConfig({app: {port: 40001}});
                usePactum();

                // Mock ServiceA to return different result
                useMock(ServiceA, {
                    doSomething: () => "Mocked ServiceA result",
                });
            });

            test("should use mocked service implementation", () => {
                const serviceA = useMockedService(ServiceA);
                const serviceN = useMockedService(ServiceN);

                // ServiceA should return mocked result
                expect(serviceA.doSomething()).toBe("Mocked ServiceA result");
                // ServiceN should remain real
                expect(serviceN.doSomethingElse()).toBe("Real ServiceN result");
            });

            test("should use mocked service in HTTP endpoints", async () => {
                const response = await spec()
                    .get("/api/test/ping")
                    .expectStatus(200)
                    .expectJsonLike({
                        serviceA: "Mocked ServiceA result",
                        serviceN: "Real ServiceN result",
                    })
                    .returns("res.body");

                expect(response.serviceA).toBe("Mocked ServiceA result");
                expect(response.serviceN).toBe("Real ServiceN result");
            });
        });
    });

    describe("Timer Control Integration", () => {
        test("should control timers in application context", () => {
            const {control} = useTimer();

            let callbackExecuted = false;
            let callbackValue;

            // Simulate some async operation in the application
            setTimeout(() => {
                callbackExecuted = true;
                callbackValue = "Timer completed";
            }, 1000);

            expect(callbackExecuted).toBe(false);

            // Advance time by 1 second
            control().advanceTimeBy(1000);

            expect(callbackExecuted).toBe(true);
            expect(callbackValue).toBe("Timer completed");
        });

        test("should track execution time of operations", async () => {
            const {tracking} = useTimer();
            const {get} = useHttp();

            const tracker = tracking();
            tracker.start();

            // Make multiple HTTP requests and track total time
            await Promise.all([get("/api/test/ping"), get("/api/test/ping"), get("/api/test/ping")]);

            tracker.stop();
            const elapsedTime = tracker.calculateElapsedTime();

            // Verify timing was captured
            expect(elapsedTime).toBeGreaterThan(0);
            expect(elapsedTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe("Error Handling Integration", () => {
        test("should handle invalid endpoints gracefully", async () => {
            const {get} = useHttp();

            const response = await get("/api/test/nonexistent");

            expect(response.status).toBe(404);
        });

        test("should handle malformed request bodies", async () => {
            const {post} = useHttp();

            // Send invalid JSON
            const response = await post("/api/test/default", "invalid-json").catch(error => error.response);

            expect(response.status).toBe(400);
        });
    });

    describe("Concurrent Request Integration", () => {
        test("should handle concurrent requests to the same endpoint", async () => {
            const {get} = useHttp();
            const serviceASpy = useSpy(ServiceA, "doSomething");
            const serviceNSpy = useSpy(ServiceN, "doSomethingElse");

            // Make 5 concurrent requests
            const requests = Array.from({length: 5}, () => get("/api/test/ping"));

            const responses = await Promise.all(requests);

            // Verify all requests succeeded
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.data).toEqual({
                    serviceA: "Real ServiceA result",
                    serviceN: "Real ServiceN result",
                });
            });

            // Verify services were called for each request
            expect(serviceASpy).toHaveBeenCalledTimes(5);
            expect(serviceNSpy).toHaveBeenCalledTimes(5);
        });

        test("should handle mixed endpoint concurrent requests", async () => {
            const testUser = {firstName: "Concurrent", lastName: "User"};

            const requests = [
                spec().get("/api/test/ping"),
                spec().post("/api/test/default").withJson(testUser),
                spec().post("/api/test/noTransform").withJson(testUser),
                spec().get("/api/test/ping"),
                spec().post("/api/test/transformResponseOnly").withJson(testUser),
            ];

            const responses = await Promise.all(requests);

            // Verify all requests completed successfully
            expect(responses).toHaveLength(5);
            responses.forEach(response => {
                expect([200, 201]).toContain(response.status);
            });
        });
    });

    describe("Application Lifecycle Integration", () => {
        test("should verify application started correctly", () => {
            // The fact that we can make HTTP requests proves the app started
            // But let's also verify through the app context
            const config = useConfig();
            expect(config.getNumber("app.port")).toBe(40000);
        });

        test("should maintain state between test cases", async () => {
            // Services should maintain their identity across test cases
            const serviceA1 = useService(ServiceA);
            const serviceA2 = useService(ServiceA);

            // Should be the same instance (singleton)
            expect(serviceA1).toBe(serviceA2);
        });
    });
});
