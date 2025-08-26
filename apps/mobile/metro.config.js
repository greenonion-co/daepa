const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * <https://reactnative.dev/docs/metro>
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

// Enable SVG as React components
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(
  ext => ext !== 'svg',
);
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'svg',
];

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    unstable_enableSymlinks: true, // this enable the use of Symlinks
    unstable_enablePackageExports: true, // to support Export Maps which is a modern way to export content from a package
  },
  // this specifies the folder where are located the node_modules for the project
  watchFolders: [path.join(__dirname, '..', '..')],
};

module.exports = mergeConfig(defaultConfig, config);
