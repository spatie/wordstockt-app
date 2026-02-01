// Jest setup file

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Zustand persist middleware for tests (avoids async storage issues)
jest.mock('zustand/middleware', () => ({
  ...jest.requireActual('zustand/middleware'),
  persist: (config) => config,
}));

// Mock react-native-worklets for tests
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock')
);

// Mock @expo/vector-icons (depends on expo-font/expo-asset which aren't available in tests)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const createMockIcon = (name) => {
    const Icon = ({ name: iconName, size, color, style, ...props }) =>
      React.createElement(Text, { style, ...props }, iconName || name);
    Icon.displayName = name;
    return Icon;
  };
  return {
    Ionicons: createMockIcon('Ionicons'),
    MaterialIcons: createMockIcon('MaterialIcons'),
    FontAwesome: createMockIcon('FontAwesome'),
    Feather: createMockIcon('Feather'),
    AntDesign: createMockIcon('AntDesign'),
  };
});
