// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // eslint-config-expo 56 bundles eslint-plugin-react-hooks 6, which enables
    // the React Compiler rule set by default. These flag patterns this codebase
    // relies on intentionally (notably the "latest ref" idiom: assigning
    // ref.current during render). The app does not use the React Compiler, so
    // these rules are opted out to preserve the project's existing standard.
    // Revisit if/when adopting the React Compiler.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]);
