const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Required for modern packages (e.g., axios, better-auth) that rely on package exports.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
