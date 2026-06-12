/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@kijani/tokens$": "<rootDir>/../tokens/tokens.native.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
};
