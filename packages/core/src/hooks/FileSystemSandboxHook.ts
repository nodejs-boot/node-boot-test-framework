import {Hook} from "./Hook";
import fs from "fs";
import os from "os";
import path from "path";

export type FileSystemSandboxOptions = {
    baseDir?: string; // Optional base, defaults to OS tmpdir
    prefix?: string; // Prefix for directory name
    keep?: boolean; // If true, do not remove after test (manual debugging)
};

/**
 * Provides an isolated temporary directory per test for file system operations.
 */
export class FileSystemSandboxHook extends Hook {
    private options: FileSystemSandboxOptions = {};
    private currentDir?: string;
    private created: string[] = [];

    constructor() {
        super(1);
    }

    override beforeEachTest() {
        const base = this.options.baseDir || os.tmpdir();
        const prefix = this.options.prefix || "nb-sandbox-";
        this.currentDir = fs.mkdtempSync(path.join(base, prefix));
        this.created.push(this.currentDir);
    }

    override afterEachTest() {
        if (!this.options.keep && this.currentDir) {
            this.removeDirSafe(this.currentDir);
        }
        this.currentDir = undefined;
    }

    override afterTests() {
        // Cleanup any leftover (if keep was toggled mid-run)
        if (!this.options.keep) {
            for (const dir of this.created) this.removeDirSafe(dir);
        }
        this.created = [];
    }

    private removeDirSafe(dir: string) {
        try {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, {recursive: true, force: true});
            }
        } catch {
            /* ignore */
        }
    }

    call(options?: FileSystemSandboxOptions) {
        if (options) this.options = {...this.options, ...options};
    }

    use() {
        if (!this.currentDir) throw new Error("Sandbox directory not initialized yet");
        const root = this.currentDir;
        return {
            path: root,
            resolve: (...segments: string[]) => path.join(root, ...segments),
            writeText: (rel: string, content: string) => {
                const full = path.join(root, rel);
                fs.mkdirSync(path.dirname(full), {recursive: true});
                fs.writeFileSync(full, content, "utf8");
                return full;
            },
            readText: (rel: string) => fs.readFileSync(path.join(root, rel), "utf8"),
            exists: (rel: string) => fs.existsSync(path.join(root, rel)),
        };
    }
}
