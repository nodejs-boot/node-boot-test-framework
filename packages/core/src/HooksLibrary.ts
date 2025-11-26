import {HookManager} from "./HookManager";
import {
    AddressHook,
    AppContextHook,
    ApplicationEventHook,
    ConfigHook,
    EnvHook,
    FileSystemSandboxHook,
    GenericContainerHook,
    GenericContainerRawHook,
    HttpClientHook,
    IocContainerHook,
    LifecycleHook,
    LogCaptureHook,
    LogMatchHook,
    MetricsHook,
    MockHook,
    MongoContainerHook,
    MongoMemoryServerHook,
    MongoMemoryReplSetHook,
    PactumHook,
    PerformanceBudgetHook,
    RepositoryHook,
    ResourceLeakDetectorHook,
    ServiceHook,
    SnapshotStateHook,
    SpyHook,
    SupertestHook,
    TimerHook,
} from "./hooks";

export type SetUpHooks = {
    useAppContext: AppContextHook["call"];
    useMock: MockHook["call"];
    useConfig: ConfigHook["call"];
    useAddress: AddressHook["call"];
    useEnv: EnvHook["call"];
    useTimer: TimerHook["call"];
    useLifecycle: LifecycleHook["call"];
    usePactum: PactumHook["call"];
    useMongoContainer: MongoContainerHook["call"];
    useMongoMemoryServer: MongoMemoryServerHook["call"];
    useMongoMemoryReplSet: MongoMemoryReplSetHook["call"];
    useGenericContainerRaw: GenericContainerRawHook["call"];
    useGenericContainer: GenericContainerHook["call"];
    useLogCapture: LogCaptureHook["call"];
    useLogMatch: LogMatchHook["call"];
    useFileSystemSandbox: FileSystemSandboxHook["call"];
    useResourceLeakDetector: ResourceLeakDetectorHook["call"];
    usePerformanceBudget: PerformanceBudgetHook["call"];
    useSnapshotState: SnapshotStateHook["call"];
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
    useMongoMemoryServer: MongoMemoryServerHook["use"];
    useMongoMemoryReplSet: MongoMemoryReplSetHook["use"];
    useGenericContainer: GenericContainerHook["use"];
    useLogCapture: LogCaptureHook["use"];
    useLogMatch: LogMatchHook["use"];
    useFileSystemSandbox: FileSystemSandboxHook["use"];
    useResourceLeakDetector: ResourceLeakDetectorHook["use"];
    usePerformanceBudget: PerformanceBudgetHook["use"];
    useSnapshotState: SnapshotStateHook["use"];
    useApplicationEvent: ApplicationEventHook["use"];
    useIocContainer: IocContainerHook["use"];
};

export class HooksLibrary {
    appContextHook = new AppContextHook();
    mockHook = new MockHook();
    spyHook = new SpyHook();
    configHook = new ConfigHook();
    envHook = new EnvHook();
    addressHook = new AddressHook();
    lifecycleHook = new LifecycleHook();
    pactumHook = new PactumHook();
    httpClientHook = new HttpClientHook();
    serviceHook = new ServiceHook();
    repositoryHook = new RepositoryHook();
    supertestHook = new SupertestHook();
    genericContainerRawHook = new GenericContainerRawHook();
    metricsHook = new MetricsHook();
    mongoContainerHook = new MongoContainerHook();
    mongoMemoryServerHook = new MongoMemoryServerHook();
    mongoMemoryReplSetHook = new MongoMemoryReplSetHook();
    genericContainerHook = new GenericContainerHook();
    timerHook = new TimerHook();
    logCaptureHook = new LogCaptureHook();
    logMatchHook = new LogMatchHook();
    fileSystemSandboxHook = new FileSystemSandboxHook();
    resourceLeakDetectorHook = new ResourceLeakDetectorHook();
    performanceBudgetHook = new PerformanceBudgetHook();
    snapshotStateHook = new SnapshotStateHook();
    applicationEventHook = new ApplicationEventHook();
    iocContainerHook = new IocContainerHook();

    registerHooks(hookManager: HookManager) {
        hookManager.addHook(this.appContextHook);
        hookManager.addHook(this.mockHook);
        hookManager.addHook(this.spyHook);
        hookManager.addHook(this.configHook);
        hookManager.addHook(this.envHook);
        hookManager.addHook(this.addressHook);
        hookManager.addHook(this.lifecycleHook);
        hookManager.addHook(this.pactumHook);
        hookManager.addHook(this.httpClientHook);
        hookManager.addHook(this.serviceHook);
        hookManager.addHook(this.repositoryHook);
        hookManager.addHook(this.genericContainerRawHook);
        hookManager.addHook(this.supertestHook);
        hookManager.addHook(this.metricsHook);
        hookManager.addHook(this.mongoContainerHook);
        hookManager.addHook(this.mongoMemoryServerHook);
        hookManager.addHook(this.mongoMemoryReplSetHook);
        hookManager.addHook(this.genericContainerHook);
        hookManager.addHook(this.timerHook);
        hookManager.addHook(this.logCaptureHook);
        hookManager.addHook(this.logMatchHook);
        hookManager.addHook(this.fileSystemSandboxHook);
        hookManager.addHook(this.resourceLeakDetectorHook);
        hookManager.addHook(this.performanceBudgetHook);
        hookManager.addHook(this.snapshotStateHook);
        hookManager.addHook(this.applicationEventHook);
        hookManager.addHook(this.iocContainerHook);
    }

    getSetupHooks(): SetUpHooks {
        return {
            useAppContext: this.appContextHook.call.bind(this.appContextHook),
            useMock: this.mockHook.call.bind(this.mockHook),
            useConfig: this.configHook.call.bind(this.configHook),
            useEnv: this.envHook.call.bind(this.envHook),
            useTimer: this.timerHook.call.bind(this.timerHook),
            useGenericContainerRaw: this.genericContainerRawHook.call.bind(this.genericContainerRawHook),
            useAddress: this.addressHook.call.bind(this.addressHook),
            useLifecycle: this.lifecycleHook.call.bind(this.lifecycleHook),
            usePactum: this.pactumHook.call.bind(this.pactumHook),
            useMongoContainer: this.mongoContainerHook.call.bind(this.mongoContainerHook),
            useMongoMemoryServer: this.mongoMemoryServerHook.call.bind(this.mongoMemoryServerHook),
            useMongoMemoryReplSet: this.mongoMemoryReplSetHook.call.bind(this.mongoMemoryReplSetHook),
            useGenericContainer: this.genericContainerHook.call.bind(this.genericContainerHook),
            useLogCapture: this.logCaptureHook.call.bind(this.logCaptureHook),
            useLogMatch: this.logMatchHook.call.bind(this.logMatchHook),
            useFileSystemSandbox: this.fileSystemSandboxHook.call.bind(this.fileSystemSandboxHook),
            useResourceLeakDetector: this.resourceLeakDetectorHook.call.bind(this.resourceLeakDetectorHook),
            usePerformanceBudget: this.performanceBudgetHook.call.bind(this.performanceBudgetHook),
            useSnapshotState: this.snapshotStateHook.call.bind(this.snapshotStateHook),
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
            useMongoMemoryServer: this.mongoMemoryServerHook.use.bind(this.mongoMemoryServerHook),
            useMongoMemoryReplSet: this.mongoMemoryReplSetHook.use.bind(this.mongoMemoryReplSetHook),
            useGenericContainer: this.genericContainerHook.use.bind(this.genericContainerHook),
            useGenericContainerRaw: this.genericContainerRawHook.use.bind(this.genericContainerRawHook),
            useLogCapture: this.logCaptureHook.use.bind(this.logCaptureHook),
            useLogMatch: this.logMatchHook.use.bind(this.logMatchHook),
            useFileSystemSandbox: this.fileSystemSandboxHook.use.bind(this.fileSystemSandboxHook),
            useResourceLeakDetector: this.resourceLeakDetectorHook.use.bind(this.resourceLeakDetectorHook),
            usePerformanceBudget: this.performanceBudgetHook.use.bind(this.performanceBudgetHook),
            useSnapshotState: this.snapshotStateHook.use.bind(this.snapshotStateHook),
            useIocContainer: this.iocContainerHook.use.bind(this.iocContainerHook),
            useApplicationEvent: this.applicationEventHook.use.bind(this.applicationEventHook),
        };
    }
}
