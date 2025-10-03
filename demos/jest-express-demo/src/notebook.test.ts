/**
 * @fileoverview NodeBoot Test Framework Integration Demo
 *
 * This file serves as a comprehensive, step-by-step guide demonstrating how the NodeBoot
 * Test Framework integrates with and builds upon the NodeBoot application framework.
 *
 * @author NodeBoot Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// ============================================================================
// STEP 1: Essential Imports for NodeBoot Test Framework Integration
// ============================================================================

/**
 * Step 1.1: Enable TypeScript decorators and reflection metadata
 * This is required for NodeBoot's dependency injection system to work properly.
 * The reflect-metadata polyfill must be imported before any decorators are used.
 */
import "reflect-metadata";

/**
 * Step 1.2: Import the core test framework integration
 * `useNodeBoot` is the main entry point that orchestrates the entire test setup.
 * It handles application lifecycle, dependency injection, and returns testing utilities.
 */
import {useNodeBoot} from "@nodeboot/jest";

/**
 * Step 1.3: Import additional HTTP testing utilities
 * - `pactum/spec` provides a fluent API for HTTP testing with built-in assertions
 * - `Container` from typedi is NodeBoot's default IoC container implementation
 */
import {spec} from "pactum";
import {Container} from "typedi";

/**
 * Step 1.4: Import NodeBoot core framework components
 * These are the building blocks for creating a NodeBoot application that we'll test.
 */
import {
    Body,
    Controller,
    Controllers,
    Get,
    NodeBoot,
    NodeBootApp,
    NodeBootApplication,
    NodeBootAppView,
    Post,
    Service,
} from "@nodeboot/core";

/**
 * Step 1.5: Import server and DI integration components
 * - ExpressServer: NodeBoot's Express.js integration
 * - EnableDI: Decorator to enable dependency injection in the application
 */
import {ExpressServer} from "@nodeboot/express-server";
import {EnableDI} from "@nodeboot/di";

/**
 * Step 1.6: Import serialization and utility components
 * - class-transformer: For request/response object transformation
 * - winston Logger: For application logging
 * - JsonObject: Type for configuration objects
 */
import {Exclude, Expose} from "class-transformer";
import {Logger} from "winston";
import {JsonObject} from "@nodeboot/context";

// ============================================================================
// STEP 2: Define Data Transfer Objects (DTOs) and Business Logic
// ============================================================================

/**
 * Step 2.1: Define a Data Transfer Object with transformation rules
 *
 * This demonstrates how NodeBoot handles request/response transformation.
 * The test framework allows you to test both transformed and raw data flows.
 *
 * @class UserModel
 * @example
 * // Input: { firstName: "John", lastName: "Doe", ssn: "123-45-6789" }
 * // Output: { firstName: "John" } (lastName and ssn excluded by default)
 */
@Exclude()
class UserModel {
    /**
     * Exposed field that will be included in API responses
     * @type {string}
     */
    @Expose()
    firstName: string;

    /**
     * Hidden field that won't be included in API responses by default
     * This demonstrates NodeBoot's built-in data transformation capabilities
     * @type {string}
     */
    lastName: string;
}

/**
 * Step 2.2: Define business logic function
 *
 * This simulates typical business logic that you might want to test.
 * The test framework allows you to test this logic both in isolation
 * and as part of the full HTTP request/response cycle.
 *
 * @param {UserModel} user - Input user data
 * @returns {UserModel} Processed user data with defaults applied
 */
function handler(user: UserModel) {
    const ret = new UserModel();
    ret.firstName = user.firstName;
    ret.lastName = user.lastName || "default";
    return ret;
}

// ============================================================================
// STEP 3: Define Injectable Services for Dependency Injection Testing
// ============================================================================

/**
 * Step 3.1: Define a service that will be mocked during tests
 *
 * Services marked with @Service() are automatically registered in NodeBoot's
 * IoC container and can be injected into controllers and other services.
 * The test framework can mock these services while keeping the DI system intact.
 *
 * @class ServiceA
 * @example
 * // In production: returns "Real ServiceA result"
 * // In tests: can be mocked to return "Mocked ServiceA result"
 */
@Service()
export class ServiceA {
    /**
     * Business method that will be mocked in tests
     * @returns {string} Service result
     */
    doSomething() {
        return "Real ServiceA result";
    }
}

/**
 * Step 3.2: Define a service that will remain unmocked during tests
 *
 * This demonstrates selective mocking - you can mock some services while
 * keeping others as real implementations to test integration scenarios.
 *
 * @class ServiceN
 */
@Service()
export class ServiceN {
    /**
     * Business method that will use real implementation in tests
     * @returns {string} Service result
     */
    doSomethingElse() {
        return "Real ServiceN result";
    }
}

/**
 * Step 3.3: Define a class that is NOT a service
 *
 * This demonstrates error handling - the test framework will throw
 * descriptive errors when trying to inject non-service classes.
 *
 * @class NotService
 */
export class NotService {
    /**
     * Method that won't be available through DI
     * @returns {string} Service result
     */
    doSomething() {
        return "Real NotService result";
    }
}

// ============================================================================
// STEP 4: Define REST Controllers with Dependency Injection
// ============================================================================

/**
 * Step 4.1: Define a REST controller with dependency injection
 *
 * This controller demonstrates:
 * - Constructor-based dependency injection
 * - Multiple HTTP endpoint types (GET, POST)
 * - Request/response transformation control
 * - Integration with NodeBoot's logging system
 *
 * The test framework can test all these endpoints without manual server setup.
 *
 * @class NoTransformResponseController
 * @route /test
 */
@Controller("/test")
class NoTransformResponseController {
    /**
     * Constructor injection of dependencies
     *
     * NodeBoot's DI container will automatically provide these dependencies.
     * The test framework preserves this injection while allowing selective mocking.
     *
     * @param {ServiceA} serviceA - Injected service (can be mocked in tests)
     * @param {ServiceN} serviceN - Injected service (real in tests)
     * @param {Logger} logger - Injected logger (provided by NodeBoot)
     */
    constructor(
        private readonly serviceA: ServiceA,
        private readonly serviceN: ServiceN,
        private readonly logger: Logger,
    ) {}

    /**
     * Step 4.2: Define a GET endpoint that uses injected services
     *
     * This endpoint demonstrates:
     * - Service method invocation
     * - Logging integration
     * - JSON response serialization
     *
     * @route GET /test/ping
     * @returns {object} Combined results from both services
     *
     * @example
     * // Test framework usage:
     * const {get} = useHttp();
     * const response = await get('/api/test/ping');
     * expect(response.data.serviceA).toBe('Mocked ServiceA result');
     */
    @Get("/ping")
    ping() {
        this.logger.info("Ping to services");
        return {
            serviceA: this.serviceA.doSomething(),
            serviceN: this.serviceN.doSomethingElse(),
        };
    }

    /**
     * Step 4.3: Define POST endpoints with different transformation settings
     *
     * These endpoints demonstrate NodeBoot's request/response transformation
     * capabilities, which the test framework can verify in different scenarios.
     */

    /**
     * Default transformation behavior (both request and response transformed)
     * @route POST /test/default
     * @param {UserModel} user - Request body automatically transformed to UserModel
     * @returns {UserModel} Response automatically transformed using class-transformer rules
     */
    @Post("/default")
    default(@Body() user: UserModel) {
        this.logger.info("Getting default");
        return handler(user);
    }

    /**
     * No transformation (raw objects in/out)
     * @route POST /test/noTransform
     * @param {UserModel} user - Raw request body object
     * @returns {UserModel} Raw response object
     */
    @Post("/noTransform", {transformRequest: false, transformResponse: false})
    noTransform(@Body() user: UserModel) {
        this.logger.info("call noTransform");
        return handler(user);
    }

    /**
     * Transform request only (response is raw)
     * @route POST /test/transformRequestOnly
     * @param {UserModel} user - Transformed request body
     * @returns {UserModel} Raw response object
     */
    @Post("/transformRequestOnly", {transformRequest: true, transformResponse: false})
    transformRequestOnly(@Body() user: UserModel) {
        this.logger.info("call transformRequestOnly");
        return handler(user);
    }

    /**
     * Transform response only (request is raw)
     * @route POST /test/transformResponseOnly
     * @param {UserModel} user - Raw request body
     * @returns {UserModel} Transformed response object
     */
    @Post("/transformResponseOnly", {transformRequest: false, transformResponse: true})
    transformResponseOnly(@Body() user: UserModel) {
        this.logger.info("call transformResponseOnly");
        return handler(user);
    }
}

// ============================================================================
// STEP 5: Define the Main Application Class
// ============================================================================

/**
 * Step 5.1: Create the main NodeBoot application
 *
 * This class represents a complete NodeBoot application that:
 * - Enables dependency injection with TypeDI container
 * - Registers REST controllers
 * - Uses Express.js as the HTTP server
 * - Can be started with custom configuration
 *
 * The test framework will automatically manage the lifecycle of this application,
 * starting it before tests and stopping it after tests complete.
 *
 * @class AppUnderTest
 * @implements {NodeBootApp}
 *
 * @example
 * // Manual usage (without test framework):
 * const app = new AppUnderTest();
 * const appView = await app.start({app: {port: 3000}});
 *
 * // Test framework usage (automatic lifecycle):
 * const hooks = useNodeBoot(AppUnderTest, setupCallback);
 */
@EnableDI(Container) // Enable dependency injection
@NodeBootApplication() // Mark as main application class
@Controllers([NoTransformResponseController]) // Register controllers
export class AppUnderTest implements NodeBootApp {
    /**
     * Application startup method
     *
     * This method is called by the test framework to start the application.
     * It merges any additional configuration and starts the Express server.
     *
     * @param {JsonObject} [additionalConfig] - Optional configuration overrides
     * @returns {Promise<NodeBootAppView>} Running application instance with server details
     */
    start(additionalConfig?: JsonObject): Promise<NodeBootAppView> {
        return NodeBoot.run(ExpressServer, additionalConfig);
    }
}

// ============================================================================
// STEP 6: Define the Test Suite with NodeBoot Test Framework Integration
// ============================================================================

/**
 * Step 6.1: Initialize the test framework with comprehensive setup
 *
 * The `useNodeBoot` function is the heart of the test framework integration.
 * It takes two parameters:
 * 1. The application class to test
 * 2. A setup callback that configures the test environment
 *
 * The setup callback receives "setup hooks" that configure the environment
 * before the application starts. The function returns "runtime hooks" that
 * provide testing utilities during test execution.
 *
 * @example
 * // Framework lifecycle:
 * 1. Setup hooks execute (useConfig, useMock, etc.)
 * 2. Application starts with test configuration
 * 3. Runtime hooks become available (useService, useHttp, etc.)
 * 4. Tests execute using runtime hooks
 * 5. Application stops and cleanup occurs
 */
describe("Sample Node-Boot Test", () => {
    /**
     * Step 6.2: Configure the test environment and extract runtime hooks
     *
     * This destructuring assignment extracts specific runtime hooks that will be
     * used in the test cases. The setup callback configures the test environment.
     */
    const {useHttp, useTimer, useService, useConfig} = useNodeBoot(
        AppUnderTest,

        /**
         * Step 6.3: Setup callback - configures test environment before app starts
         *
         * This callback receives setup hooks that configure how the application
         * will run during tests. Each hook serves a specific purpose:
         *
         * @param {object} setupHooks - Object containing all available setup hooks
         * @param {Function} setupHooks.useAppContext - Access app context after startup
         * @param {Function} setupHooks.useMock - Mock service implementations
         * @param {Function} setupHooks.useConfig - Override application configuration
         * @param {Function} setupHooks.useAddress - Access server address after startup
         * @param {Function} setupHooks.useEnv - Set environment variables
         * @param {Function} setupHooks.useCleanup - Register cleanup functions
         * @param {Function} setupHooks.usePactum - Enable Pactum HTTP testing
         */
        ({useAppContext, useMock, useConfig, useAddress, useEnv, useCleanup, usePactum}) => {
            /**
             * Step 6.4: Enable Pactum integration for HTTP testing
             *
             * Pactum provides a fluent API for HTTP testing. This hook automatically
             * configures Pactum with the application's base URL when it starts.
             *
             * @example
             * // After this setup, you can use Pactum in tests:
             * await spec().get('/api/test/ping').expectStatus(200);
             */
            usePactum();

            /**
             * Step 6.5: Mock service implementations
             *
             * This demonstrates selective service mocking. ServiceA will return
             * a mocked result, while ServiceN will use its real implementation.
             * The mock is automatically applied to the IoC container.
             *
             * @param {typeof ServiceA} ServiceA - The service class to mock
             * @param {Partial<ServiceA>} mockImplementation - Mock methods
             *
             * @example
             * // Alternative Jest mock syntax:
             * useMock(ServiceA, {
             *   doSomething: jest.fn(() => "Mocked ServiceA result")
             * });
             */
            useMock(ServiceA, {
                doSomething: () => "Mocked ServiceA result",
            });

            /**
             * Step 6.6: Set environment variables for the test session
             *
             * Environment variables set here are available during test execution
             * and are automatically restored after tests complete.
             *
             * @param {Record<string, string>} envVars - Environment variables to set
             */
            useEnv({NODE_ENV: "test", FEATURE_FLAG: "true"});

            /**
             * Step 6.7: Override application configuration
             *
             * This configuration is merged with the application's default configuration.
             * Using a specific port ensures tests don't conflict with running apps.
             *
             * @param {JsonObject} config - Configuration overrides
             *
             * @example
             * // You can override any configuration:
             * useConfig({
             *   app: { port: 40000 },
             *   database: { url: "sqlite::memory:" },
             *   logging: { level: "error" }
             * });
             */
            useConfig({
                app: {
                    port: 40000,
                },
            });

            /**
             * Step 6.8: Access the server address after startup
             *
             * This callback is executed after the application starts successfully.
             * It provides access to the actual server address for external integrations.
             *
             * @param {string} address - The server's listening address (e.g., "http://localhost:40000")
             *
             * @example
             * // Use for external service configuration:
             * useAddress(address => {
             *   configureExternalService({ callbackUrl: `${address}/webhook` });
             * });
             */
            useAddress(address => {
                console.log("SERVER ADDRESS:", address);
            });

            /**
             * Step 6.9: Access the application context after startup
             *
             * This provides access to the full application context including
             * configuration, logger, and other framework components.
             *
             * @param {NodeBootAppView} appContext - Complete application context
             *
             * @example
             * // Verify application state:
             * useAppContext(ctx => {
             *   expect(ctx.config.getNumber('app.port')).toBe(40000);
             *   expect(ctx.logger).toBeDefined();
             * });
             */
            useAppContext(appContext => {
                expect(appContext.appOptions).toBeDefined();
                expect(appContext.config).toBeDefined();
                expect(appContext.logger).toBeDefined();
            });

            /**
             * Step 6.10: Register cleanup functions
             *
             * Cleanup functions ensure proper resource cleanup after tests.
             * The framework provides hooks for different cleanup phases.
             *
             * @param {object} cleanupOptions - Cleanup configuration
             * @param {Function} [cleanupOptions.afterAll] - Run after all tests complete
             * @param {Function} [cleanupOptions.afterEach] - Run after each individual test
             *
             * @example
             * // Clean up database connections, temp files, etc.:
             * useCleanup({
             *   afterAll: () => database.close(),
             *   afterEach: () => database.clear()
             * });
             */
            useCleanup({
                afterAll: () => {
                    console.log("Running cleanup after tests...");
                    // Here you can reset mock states, close resources, etc.
                },
            });
        },
    );

    // ========================================================================
    // STEP 7: Test Cases - Using Runtime Hooks to Test the Application
    // ========================================================================

    /**
     * Step 7.1: Test dependency injection with real service instances
     *
     * This test demonstrates how the test framework preserves NodeBoot's
     * dependency injection while allowing selective mocking.
     *
     * Key concepts:
     * - `useService()` retrieves instances from the IoC container
     * - Mocked services return mock results (ServiceA)
     * - Unmocked services return real results (ServiceN)
     * - DI container remains fully functional
     *
     * @test Service injection and selective mocking
     */
    it("should use real service instances", () => {
        // Retrieve services from the IoC container (just like in production code)
        const serviceA = useService(ServiceA);
        const serviceN = useService(ServiceN);

        // ServiceA was mocked in setup, so it returns the mock result
        expect(serviceA.doSomething()).toBe("Real ServiceA result");

        // ServiceN was not mocked, so it returns the real result
        expect(serviceN.doSomethingElse()).toBe("Real ServiceN result");
    });

    /**
     * Step 7.2: Test error handling for non-service classes
     *
     * This demonstrates the framework's validation - it will throw descriptive
     * errors when attempting to inject classes not marked with @Service().
     *
     * @test Error handling for invalid service injection
     */
    it("should fail when not a service", () => {
        expect(() => useService(NotService)).toThrow("The class NotService is not decorated with @Service.");
    });

    /**
     * Step 7.3: Test configuration access during runtime
     *
     * This shows how to access the application's configuration during tests.
     * The configuration includes both default values and test overrides.
     *
     * @test Configuration access and validation
     */
    it("should retrieve app configs", () => {
        const config = useConfig();
        expect(config).toBeDefined();

        // This value was set in the useConfig() setup hook
        expect(config.getNumber("app.port")).toBe(40000);
    });

    /**
     * Step 7.4: Test environment variable setting
     *
     * This verifies that environment variables set during setup are
     * properly applied and available during test execution.
     *
     * @test Environment variable configuration
     */
    it("should retrieve env value", () => {
        // These values were set in the useEnv() setup hook
        expect(process.env["NODE_ENV"]).toBe("test");
        expect(process.env["FEATURE_FLAG"]).toBe("true");
    });

    /**
     * Step 7.5: Test HTTP endpoints using the HTTP client
     *
     * This demonstrates HTTP testing using the built-in HTTP client.
     * The client is automatically configured with the application's base URL.
     *
     * Key concepts:
     * - `useHttp()` returns a configured Axios instance
     * - Routes are automatically prefixed (e.g., "/api" + controller path)
     * - Responses include both status and data
     * - TypeScript types can be used for response data
     *
     * @test HTTP endpoint integration with dependency injection
     */
    it("should do http call", async () => {
        const {get} = useHttp();

        // Make HTTP request to the running application
        const result = await get<{serviceA: string; serviceN: string}>("/api/test/ping");

        expect(result.status).toBe(200);
        expect(result.data).toBeDefined();

        // ServiceA is mocked, ServiceN is real
        expect(result.data.serviceA).toBe("Real ServiceA result");
        expect(result.data.serviceN).toBe("Real ServiceN result");
    });

    /**
     * Step 7.6: Test HTTP endpoints using Pactum
     *
     * This shows alternative HTTP testing using Pactum's fluent API.
     * Pactum was configured in the setup phase with usePactum().
     *
     * Key concepts:
     * - `spec()` creates a new Pactum specification
     * - Fluent API for building and executing requests
     * - Built-in assertions with expectStatus()
     * - Direct access to response body with returns()
     *
     * @test HTTP endpoint testing with Pactum fluent API
     */
    it("should use pactum to http call", async () => {
        const response = await spec().get(`/api/test/ping`).expectStatus(200).returns("res.body");

        expect(response).toBeDefined();
        expect(response.serviceA).toBe("Real ServiceA result");
        expect(response.serviceN).toBe("Real ServiceN result");
    });

    // ========================================================================
    // STEP 8: Advanced Testing - Timer Control and Time Tracking
    // ========================================================================

    /**
     * Step 8.1: Test suite for Jest timer control
     *
     * The test framework includes Jest timer integration for testing
     * time-dependent code like setTimeout, setInterval, etc.
     *
     * @group Timer Control Tests
     */
    describe("TimeControl", () => {
        /**
         * Step 8.2: Test controlled time advancement
         *
         * This demonstrates how to test setTimeout callbacks by controlling
         * Jest's fake timers. No actual time passes during test execution.
         *
         * @test Controlled timer advancement
         */
        it("should advance time by the specified milliseconds", () => {
            const {control} = useTimer();

            let callbackCalled = false;
            setTimeout(() => (callbackCalled = true), 1000);

            // Initially, callback should not have executed
            expect(callbackCalled).toBe(false);

            // Advance fake timers by 1 second
            control().advanceTimeBy(1000);

            // Now callback should have executed
            expect(callbackCalled).toBe(true);
        });

        /**
         * Step 8.3: Test running all pending timers
         *
         * This shows how to execute all pending timers regardless of their delays.
         * Useful for testing complex timer interactions.
         *
         * @test Execute all pending timers
         */
        it("should run all pending timers", () => {
            const {control} = useTimer();

            let callback1Called = false;
            let callback2Called = false;

            setTimeout(() => (callback1Called = true), 500);
            setTimeout(() => (callback2Called = true), 1000);

            // Initially, no callbacks should have executed
            expect(callback1Called).toBe(false);
            expect(callback2Called).toBe(false);

            // Execute all pending timers immediately
            control().runAllTimers();

            // Both callbacks should now have executed
            expect(callback1Called).toBe(true);
            expect(callback2Called).toBe(true);
        });
    });

    /**
     * Step 8.4: Test suite for time tracking
     *
     * The framework provides utilities for measuring execution time
     * in tests, useful for performance testing and validation.
     *
     * @group Time Tracking Tests
     */
    describe("TimeTracking", () => {
        /**
         * Step 8.5: Test elapsed time calculation
         *
         * This demonstrates how to measure elapsed time in tests,
         * even when using Jest's fake timers.
         *
         * @test Time measurement accuracy
         */
        it("should track elapsed time correctly", () => {
            const {tracking} = useTimer();

            const tracker = tracking();
            tracker.start();

            // Simulate 2 seconds passing
            jest.advanceTimersByTime(2000);
            tracker.stop();

            const elapsedTime = tracker.calculateElapsedTime();
            expect(elapsedTime).toBeGreaterThanOrEqual(2000);
        });

        /**
         * Step 8.6: Test concurrent time tracking
         *
         * This shows how multiple time trackers can run simultaneously,
         * each maintaining their own timing state.
         *
         * @test Concurrent time tracking
         */
        it("should handle multiple concurrent tracking instances", () => {
            const {tracking} = useTimer();

            // Start first tracker
            const tracker1 = tracking();
            tracker1.start();

            // Advance 1 second
            jest.advanceTimersByTime(1000);

            // Start second tracker (1 second after first)
            const tracker2 = tracking();
            tracker2.start();

            // Advance 2 more seconds (3 total for tracker1, 2 for tracker2)
            jest.advanceTimersByTime(2000);

            tracker1.stop();
            tracker2.stop();

            // Verify each tracker measured its own duration correctly
            expect(tracker1.calculateElapsedTime()).toBeGreaterThanOrEqual(3000);
            expect(tracker2.calculateElapsedTime()).toBeGreaterThanOrEqual(2000);
        });
    });
});

/**
 * @summary Test Framework Integration Summary
 *
 * This file demonstrates the complete integration between the NodeBoot Test Framework
 * and NodeBoot applications. The key benefits include:
 *
 * 1. **Automatic Lifecycle Management**: No manual server start/stop
 * 2. **Dependency Injection Integration**: Access to real IoC container
 * 3. **Selective Mocking**: Mock some services while keeping others real
 * 4. **HTTP Testing Utilities**: Pre-configured Axios, Supertest, and Pactum
 * 5. **Configuration Override**: Easy test-specific configuration
 * 6. **Environment Management**: Automatic env var setup and cleanup
 * 7. **Timer Control**: Jest fake timer integration for time-dependent tests
 * 8. **Type Safety**: Full TypeScript support throughout
 *
 * The framework eliminates boilerplate while preserving the full power of
 * NodeBoot's architecture, making integration tests both powerful and maintainable.
 */
