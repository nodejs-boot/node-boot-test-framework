import type {Logger} from "winston";
import {Hook} from "./Hook";
import {useLogger as getLogger} from "../utils/useLogger";

/**
 * Exposes the shared Winston logger instance through the hooks system.
 */
export class LoggerHook extends Hook {
    constructor() {
        // Neutral priority; no lifecycle behavior required
        super(0);
    }

    use(): Logger {
        // Return the shared logger instance
        return getLogger();
    }
}
