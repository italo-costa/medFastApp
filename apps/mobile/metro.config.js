const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'bin'],
    nodeModulesPaths: [
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, 'node_modules'),
    ],
  },
  watchFolders: [
    path.resolve(__dirname, '../node_modules'),
  ],
};

module.exports = mergeConfig(defaultConfig, config);