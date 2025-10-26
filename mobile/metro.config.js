const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Allow the React Native bundle to consume files from the shared folder in the
 * root of the repository (used for cross-platform AI services).
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [path.resolve(__dirname, '..', 'shared')],
  resolver: {
    ...defaultConfig.resolver,
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..', 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
