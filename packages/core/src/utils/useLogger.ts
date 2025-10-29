import winston, {Logger} from "winston";
import {NodeBootAppView} from "@nodeboot/core";

let logger: Logger | undefined = undefined;

export function useLogger() {
    if (!logger) {
        logger = winston.createLogger({
            level: process.env["LOG_LEVEL"] || "debug",
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({level, message, timestamp}) => {
                    return `[${timestamp}] ${level}: ${message}`;
                }),
            ),
            transports: [new winston.transports.Console()],
        });
    }
    return logger;
}

export function binAppLogger(appView: NodeBootAppView) {
    try {
        const logger = appView.logger;
        if (logger instanceof winston.Logger) {
            // Remove all existing transports
            logger.clear();

            // Add a Console transport
            logger.add(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp(),
                        winston.format.printf(({level, message, timestamp}) => {
                            return `[${timestamp}] ${level}: ${message}`;
                        }),
                    ),
                    level: process.env["LOG_LEVEL"] || "debug",
                }),
            );
        }
    } catch {
        // ignore
    }
}
