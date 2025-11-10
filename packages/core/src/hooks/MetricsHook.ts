import {Hook} from "./Hook";
import {useLogger} from "../utils/useLogger";

/**
 * A hook for collecting and reporting test metrics and performance data.
 *
 * This hook automatically tracks test execution duration and provides utilities
 * for recording custom metrics. It runs with priority 40 to capture metrics
 * from other hooks that may have run earlier.
 *
 * @example
 * ```typescript
 * // In your test setup
 * const {useMetrics} = useNodeBoot(MyApp);
 * const { recordMetric, startTimer, getMetrics } = useMetrics();
 *
 * // Record a custom metric
 * recordMetric('apiCalls', 5);
 *
 * // Use a timer for performance measurement
 * const timer = startTimer('databaseQuery');
 * // ... perform operation
 * const duration = timer.end();
 *
 * // Get recorded metrics
 * const allMetrics = getMetrics();
 * const testDurations = getMetrics('testDuration');
 * ```
 */
export class MetricsHook extends Hook {
    /**
     * Storage for all recorded metrics, organized by metric name.
     * Each metric name maps to an array of recorded values.
     */
    private metrics: Map<string, unknown[]> = new Map();

    /**
     * Creates a new MetricsHook instance.
     * Sets priority to 40 to run late and capture metrics from other hooks.
     */
    constructor() {
        super(40); // Run late to capture all other hook metrics
    }

    /**
     * Hook executed before each test starts.
     * Records the test start time for duration calculation.
     */
    override async beforeEachTest() {
        this.setState("testStartTime", Date.now());
    }

    /**
     * Hook executed after each test completes.
     * Calculates and records the test execution duration.
     */
    override async afterEachTest() {
        const startTime = this.getState<number>("testStartTime");
        if (startTime) {
            const duration = Date.now() - startTime;
            this.recordMetric("testDuration", duration);
        }
    }

    /**
     * Hook executed after all tests complete.
     * Generates and displays the final metrics report.
     */
    override async afterTests() {
        this.generateReport();
    }

    /**
     * Returns the public API for interacting with the metrics system.
     *
     * @returns An object containing methods for recording and retrieving metrics
     */
    use() {
        return {
            /**
             * Records a metric value for the specified metric name.
             *
             * @param name - The name of the metric to record
             * @param value - The value to record (can be any type)
             *
             * @example
             * ```typescript
             * const {useMetrics} = useNodeBoot(MyApp);
             * const { recordMetric } = useMetrics();
             *
             * recordMetric('apiResponseTime', 150);
             * recordMetric('errorCount', 1);
             * recordMetric('userAction', 'login');
             * ```
             */
            recordMetric: (name: string, value: any) => {
                this.recordMetric(name, value);
            },

            /**
             * Retrieves recorded metrics, either for a specific metric or all metrics.
             *
             * @param name - Optional metric name to filter by
             * @returns Array of values for the specified metric, or object with all metrics
             *
             * @example
             * ```typescript
             * // Get all metrics
             * const {useMetrics} = useNodeBoot(MyApp);
             * const { getMetrics } = useMetrics();
             *
             * const allMetrics = getMetrics();
             *
             * // Get specific metric values
             * const durations = getMetrics('testDuration');
             * ```
             */
            getMetrics: (name?: string) => {
                if (name) {
                    return this.metrics.get(name) || [];
                }
                return Object.fromEntries(this.metrics);
            },

            /**
             * Starts a timer for measuring operation duration.
             *
             * @param name - The name of the timing metric
             * @returns An object with an `end()` method to stop the timer
             *
             * @example
             * ```typescript
             * const {useMetrics} = useNodeBoot(MyApp);
             * const { startTimer } = useMetrics();
             *
             * const timer = startTimer('databaseQuery');
             * await performDatabaseQuery();
             * const duration = timer.end(); // Automatically records the metric
             * ```
             */
            startTimer: (name: string) => {
                const timerName = `${name}_timer`;
                this.setState(timerName, Date.now());
                return {
                    /**
                     * Stops the timer and records the duration metric.
                     *
                     * @returns The measured duration in milliseconds
                     */
                    end: () => {
                        const startTime = this.getState<number>(timerName);
                        if (startTime) {
                            const duration = Date.now() - startTime;
                            this.recordMetric(name, duration);
                            return duration;
                        }
                        return 0;
                    },
                };
            },
        };
    }

    /**
     * Records a metric value internally.
     * Creates a new metric array if the metric name doesn't exist.
     *
     * @param name - The metric name
     * @param value - The value to record
     */
    private recordMetric(name: string, value: unknown) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    /**
     * Generates and displays a comprehensive metrics report.
     * Shows average, minimum, and maximum values for numeric metrics.
     */
    private generateReport() {
        const logger = useLogger();
        logger.debug("=== Test Metrics Report ===");
        for (const [name, values] of this.metrics) {
            const numericValues = values.filter(v => typeof v === "number") as number[];
            if (numericValues.length === values.length && numericValues.length) {
                const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                const min = Math.min(...numericValues);
                const max = Math.max(...numericValues);
                logger.debug(`${name}: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms`);
            } else {
                logger.debug(`${name}: count=${values.length}`);
            }
        }
        logger.debug("===========================");
    }
}
