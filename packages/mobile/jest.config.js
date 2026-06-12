const path = require("path");
const repoRoot = path.resolve(__dirname, "../..");
const localModules = path.join(__dirname, "node_modules");
const tokensPath = path.join(repoRoot, "packages/tokens/tokens.native.ts");

/** @type {import('jest').Config} */
module.exports = {
  preset: "react-native",
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@kijani/tokens$": tokensPath,
    // Pin to mobile-local packages to avoid workspace React 19 / missing react-native conflicts.
    "^react$": path.join(localModules, "react"),
    "^react/(.*)$": path.join(localModules, "react", "$1"),
    "^react-native$": path.join(localModules, "react-native"),
    "^react-native/(.*)$": path.join(localModules, "react-native", "$1"),
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(-modules-core)?)/)",
  ],
};
