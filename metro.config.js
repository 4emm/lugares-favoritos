const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite imports its WebAssembly database when Expo Router builds web routes.
config.resolver.assetExts.push("wasm");

module.exports = config;
