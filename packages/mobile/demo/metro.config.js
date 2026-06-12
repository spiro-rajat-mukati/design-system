const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../../..");
const config = getDefaultConfig(__dirname);

// Watch all workspace packages so changes to @kijani/mobile and @kijani/tokens hot-reload
config.watchFolders = [repoRoot];

// Resolve modules from root node_modules first (where workspaces are hoisted)
config.resolver.nodeModulesPaths = [
  path.resolve(repoRoot, "node_modules"),
  path.resolve(__dirname, "node_modules"),
];

module.exports = config;
