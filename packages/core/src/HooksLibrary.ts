import {HookManager} from "./HookManager";
import {
    AddressHook,
    AppContextHook,
    CleanupHook,
    ConfigHook,
    EnvHook,
    GenericContainerHook,
    GenericContainerRawHook,
    HttpClientHook,
    MetricsHook,
    MockHook,
    MongoContainerHook,
    PactumHook,
    RepositoryHook,
    ServiceHook,
    SpyHook,
    TimerHook,
} from "./hooks";
import {SupertestHook} from "./hooks/SupertestHook";

export type SetUpHooks = {
    useAppContext: AppContextHook["call"];
    useMock: MockHook["call"];
    useConfig: ConfigHook["call"];
    useAddress: AddressHook["call"];
    useEnv: EnvHook["call"];
    useCleanup: CleanupHook["call"];
    usePactum: PactumHook["call"];
    useMongoContainer: MongoContainerHook["call"];
    useGenericContainerRaw: GenericContainerRawHook["call"];
    useGenericContainer: GenericContainerHook["call"];
};

export type ReturnHooks = {
    useConfig: ConfigHook["use"];
    useHttp: HttpClientHook["use"];
    useAppContext: AppContextHook["use"];
    useMock: MockHook["use"];
    useSpy: SpyHook["use"];
    useTimer: TimerHook["use"];
    useService: ServiceHook["use"];
    useRepository: RepositoryHook["use"];
    useSupertest: SupertestHook["use"];
    useMetrics: MetricsHook["use"];
    useGenericContainerRaw: GenericContainerRawHook["use"];
    useMongoContainer: MongoContainerHook["use"];
    useGenericContainer: GenericContainerHook["use"];
};

export class HooksLibrary {
    appContextHook = new AppContextHook();
    mockHook = new MockHook();
    spyHook = new SpyHook();
    configHook = new ConfigHook();
    envHook = new EnvHook();
    addressHook = new AddressHook();
    cleanupHook = new CleanupHook();
    pactumHook = new PactumHook();
    httpClientHook = new HttpClientHook();
    serviceHook = new ServiceHook();
    repositoryHook = new RepositoryHook();
    supertestHook = new SupertestHook();
    genericContainerRawHook = new GenericContainerRawHook();
    metricsHook = new MetricsHook();
    mongoContainerHook = new MongoContainerHook();
    genericContainerHook = new GenericContainerHook();
    timerHook = new TimerHook();

    registerHooks(hookManager: HookManager) {
        hookManager.addHook(this.appContextHook);
        hookManager.addHook(this.mockHook);
        hookManager.addHook(this.spyHook);
        hookManager.addHook(this.configHook);
        hookManager.addHook(this.envHook);
        hookManager.addHook(this.addressHook);
        hookManager.addHook(this.cleanupHook);
        hookManager.addHook(this.pactumHook);
        hookManager.addHook(this.httpClientHook);
        hookManager.addHook(this.serviceHook);
        hookManager.addHook(this.repositoryHook);
        hookManager.addHook(this.genericContainerRawHook);
        hookManager.addHook(this.supertestHook);
        hookManager.addHook(this.metricsHook);
        hookManager.addHook(this.mongoContainerHook);
        hookManager.addHook(this.genericContainerHook);
        hookManager.addHook(this.timerHook);
    }

    getSetupHooks(): SetUpHooks {
        return {
            useAppContext: this.appContextHook.call.bind(this.appContextHook),
            useMock: this.mockHook.call.bind(this.mockHook),
            useConfig: this.configHook.call.bind(this.configHook),
            useEnv: this.envHook.call.bind(this.envHook),
            useGenericContainerRaw: this.genericContainerRawHook.call.bind(this.genericContainerRawHook),
            useAddress: this.addressHook.call.bind(this.addressHook),
            useCleanup: this.cleanupHook.call.bind(this.cleanupHook),
            usePactum: this.pactumHook.call.bind(this.pactumHook),
            useMongoContainer: this.mongoContainerHook.call.bind(this.mongoContainerHook),
            useGenericContainer: this.genericContainerHook.call.bind(this.genericContainerHook),
        };
    }

    getReturnHooks(): ReturnHooks {
        return {
            useConfig: this.configHook.use.bind(this.configHook),
            useHttp: this.httpClientHook.use.bind(this.httpClientHook),
            useAppContext: this.appContextHook.use.bind(this.appContextHook),
            useMock: this.mockHook.use.bind(this.mockHook),
            useSpy: this.spyHook.use.bind(this.spyHook),
            useTimer: this.timerHook.use.bind(this.timerHook),
            useService: this.serviceHook.use.bind(this.serviceHook),
            useRepository: this.repositoryHook.use.bind(this.repositoryHook),
            useSupertest: this.supertestHook.use.bind(this.supertestHook),
            useMetrics: this.metricsHook.use.bind(this.metricsHook),
            useMongoContainer: this.mongoContainerHook.use.bind(this.mongoContainerHook),
            useGenericContainer: this.genericContainerHook.use.bind(this.genericContainerHook),
            useGenericContainerRaw: this.genericContainerRawHook.use.bind(this.genericContainerRawHook),
        };
    }
}
