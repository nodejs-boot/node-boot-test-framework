module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverageFrom: ["src/**/*.ts", "!src/**/index.ts"],
    globals: {},
    setupFilesAfterEnv: ["./jest.setup.js"],
    transformIgnorePatterns: ["node_modules/(?!mongodb|bson|typeorm)"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {tsconfig: "./tsconfig.spec.json"}],
    },
};
