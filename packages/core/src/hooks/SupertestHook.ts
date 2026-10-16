import type {NodeBootAppView} from "@nodeboot/core";
import {Hook} from "./Hook";
import type TestAgent from "supertest/lib/agent";
import {requireOptional} from "../utils/optional-dependency";

export class SupertestHook extends Hook {
    private appView?: NodeBootAppView = undefined;

    /**
     * Initializes the Supertest hook with the server instance from NodeBootAppView.
     * @param appView The application view returned after starting the application.
     */
    override afterStart(appView: NodeBootAppView): Promise<void> | void {
        this.appView = appView;
    }

    /**
     * Cleanup logic to reset the hook state after tests.
     */
    override afterTests() {
        this.appView = undefined;
    }

    /**
     * Returns a Supertest request object to interact with the server.
     */
    use(): TestAgent {
        if (!this.appView?.server) {
            throw new Error(
                "SupertestHook: Server instance not available. Make sure the application is started and SupertestHook is properly initialized.",
            );
        }
        const request = requireOptional("supertest", "useSupertest");
        return (request.default ?? request)(this.appView.server.getHttpServer());
    }
}
