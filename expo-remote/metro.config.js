const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure resolution uses the expo-remote node_modules only
config.resolver.nodeModulesPaths = [
  `${__dirname}/node_modules`
];

// Don't look up in parent directories for node_modules
config.resolver.disableHierarchicalLookup = true;

module.exports = config; 