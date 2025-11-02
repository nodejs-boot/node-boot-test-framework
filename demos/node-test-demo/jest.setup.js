//jest.setTimeout(30000);

require("reflect-metadata");

jest.useRealTimers();

process.on("beforeExit", () => {
    console.log(">>> beforeExit fired");
    console.log("Active handles:", process._getActiveHandles());
});
