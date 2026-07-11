const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "web.js",
  "web.jsx",
  "web.ts",
  "web.tsx",
];
// Required for modern packages (e.g., axios, better-auth) that rely on package exports.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
