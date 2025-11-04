import {useLogger} from "./useLogger";
import {execSync} from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

type ContainerRuntime = "docker" | "podman" | "colima" | "rancher-desktop";

interface RuntimeConfig {
    dockerHost?: string;
    socketOverride?: string;
    ryukDisabled?: boolean;
    ryukPrivileged?: boolean;
    nodeOptions?: string;
}

/**
 * Detects the available container runtime and returns appropriate configuration
 */
export function detectContainerRuntime(): {runtime: ContainerRuntime; config: RuntimeConfig} {
    const logger = useLogger();
    const home = os.homedir();
    const platform = os.platform();

    // Check if DOCKER_HOST is already set (user override)
    if (process.env["DOCKER_HOST"]) {
        logger.debug(`[ContainerRuntime] Using existing DOCKER_HOST: ${process.env["DOCKER_HOST"]}`);
        return {runtime: "docker", config: {}};
    }

    try {
        // On macOS, check for alternative runtimes first before Docker
        if (platform === "darwin") {
            // Check for Colima first (common on macOS)
            const colimaSocket = path.join(home, ".colima/default/docker.sock");
            if (fs.existsSync(colimaSocket)) {
                // Additional check: see if Colima is actually running
                try {
                    if (isCommandAvailable("colima")) {
                        const colimaStatus = execSync("colima status", {encoding: "utf8", stdio: "pipe"});
                        if (colimaStatus.includes("Running")) {
                            logger.debug("[ContainerRuntime] Detected Colima runtime (verified running)");
                            return {
                                runtime: "colima",
                                config: {
                                    dockerHost: `unix://${colimaSocket}`,
                                    socketOverride: "/var/run/docker.sock",
                                    ryukDisabled: true,
                                    nodeOptions: "--dns-result-order=ipv4first",
                                },
                            };
                        }
                    }
                } catch {
                    // If colima command fails, still try socket-based detection
                }

                // Fallback: if socket exists, assume Colima is running
                logger.debug("[ContainerRuntime] Detected Colima runtime (socket exists)");
                return {
                    runtime: "colima",
                    config: {
                        dockerHost: `unix://${colimaSocket}`,
                        socketOverride: "/var/run/docker.sock",
                        ryukDisabled: true,
                        nodeOptions: "--dns-result-order=ipv4first",
                    },
                };
            }

            // Check for Rancher Desktop (macOS)
            const rancherSocket = path.join(home, ".rd/docker.sock");
            if (fs.existsSync(rancherSocket)) {
                logger.debug("[ContainerRuntime] Detected Rancher Desktop runtime");
                return {
                    runtime: "rancher-desktop",
                    config: {
                        dockerHost: `unix://${rancherSocket}`,
                        socketOverride: "/var/run/docker.sock",
                    },
                };
            }
        }

        // Try native Docker (most common on Linux, fallback for macOS)
        if (isCommandAvailable("docker")) {
            try {
                execSync("docker info", {stdio: "ignore"});

                // On macOS, if we reach here and docker info works but no alternative runtime was found,
                // it might still be Docker Desktop or another setup
                if (platform === "darwin") {
                    // Check if this is actually Docker Desktop by looking for its socket
                    const dockerDesktopSocket = "/var/run/docker.sock";
                    if (fs.existsSync(dockerDesktopSocket)) {
                        logger.debug("[ContainerRuntime] Detected Docker Desktop runtime on macOS");
                    } else {
                        logger.debug("[ContainerRuntime] Detected Docker runtime on macOS (unknown setup)");
                    }
                } else {
                    logger.debug("[ContainerRuntime] Detected Docker runtime");
                }

                return {runtime: "docker", config: {}};
            } catch {
                // Docker command exists but daemon not running, continue checking other runtimes
            }
        }

        // Check for Podman
        if (isCommandAvailable("podman")) {
            try {
                execSync("podman info", {stdio: "ignore"});
                logger.debug("[ContainerRuntime] Detected Podman runtime");

                if (platform === "darwin") {
                    // macOS Podman
                    try {
                        const socketPath = execSync(
                            'podman machine inspect --format "{{.ConnectionInfo.PodmanSocket.Path}}"',
                            {encoding: "utf8"},
                        ).trim();
                        return {
                            runtime: "podman",
                            config: {
                                dockerHost: `unix://${socketPath}`,
                                socketOverride: "/var/run/docker.sock",
                                ryukDisabled: true,
                            },
                        };
                    } catch {
                        // Fallback for macOS Podman
                        return {
                            runtime: "podman",
                            config: {
                                ryukDisabled: true,
                            },
                        };
                    }
                } else {
                    // Linux Podman
                    try {
                        const socketPath = execSync('podman info --format "{{.Host.RemoteSocket.Path}}"', {
                            encoding: "utf8",
                        }).trim();
                        const isRootless = !socketPath.includes("/run/podman/");

                        return {
                            runtime: "podman",
                            config: {
                                dockerHost: `unix://${socketPath}`,
                                ryukDisabled: isRootless,
                                ryukPrivileged: !isRootless,
                            },
                        };
                    } catch {
                        // Fallback for Linux Podman
                        return {
                            runtime: "podman",
                            config: {
                                ryukDisabled: true,
                            },
                        };
                    }
                }
            } catch {
                // Podman command exists but not running
            }
        }

        // Fallback to Docker (might work with default settings)
        logger.warn("[ContainerRuntime] No container runtime detected, falling back to Docker");
        return {runtime: "docker", config: {}};
    } catch (error) {
        logger.warn(`[ContainerRuntime] Error detecting container runtime: ${error}`);
        return {runtime: "docker", config: {}};
    }
}

/**
 * Checks if a command is available in the system PATH
 */
function isCommandAvailable(command: string): boolean {
    try {
        const whichCommand = os.platform() === "win32" ? `where ${command}` : `which ${command}`;
        execSync(whichCommand, {stdio: "ignore"});
        return true;
    } catch {
        return false;
    }
}

/**
 * Configures environment variables for the detected container runtime
 */
export function configureContainerRuntime(config: RuntimeConfig): void {
    const logger = useLogger();

    if (config.dockerHost) {
        process.env["DOCKER_HOST"] = config.dockerHost;
        logger.debug(`[ContainerRuntime] Set DOCKER_HOST=${config.dockerHost}`);
    }

    if (config.socketOverride) {
        process.env["TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE"] = config.socketOverride;
        logger.debug(`[ContainerRuntime] Set TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=${config.socketOverride}`);
    }

    if (config.ryukDisabled) {
        process.env["TESTCONTAINERS_RYUK_DISABLED"] = "true";
        logger.debug("[ContainerRuntime] Disabled Ryuk resource reaper");
    }

    if (config.ryukPrivileged) {
        process.env["TESTCONTAINERS_RYUK_PRIVILEGED"] = "true";
        logger.debug("[ContainerRuntime] Enabled privileged Ryuk resource reaper");
    }

    if (config.nodeOptions) {
        const existingOptions = process.env["NODE_OPTIONS"] || "";
        const newOptions = existingOptions ? `${existingOptions} ${config.nodeOptions}` : config.nodeOptions;
        process.env["NODE_OPTIONS"] = newOptions;
        logger.debug(`[ContainerRuntime] Set NODE_OPTIONS=${newOptions}`);
    }
}
