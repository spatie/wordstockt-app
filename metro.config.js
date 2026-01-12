const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix import.meta error on web by using CJS builds instead of ESM
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
];

// Alias react-native-linear-gradient to expo-linear-gradient for web compatibility
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-linear-gradient': require.resolve('expo-linear-gradient'),
};

module.exports = config;
