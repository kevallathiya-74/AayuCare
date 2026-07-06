module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/config/postgres.js",
    "!src/config/env.js",
    "!src/lib/auth.js",
    "!src/modules/**/*.module.js",
    "!src/modules/**/*.routes.js",
    "!server.js",
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  verbose: true,
};
