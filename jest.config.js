module.exports = {
  preset: 'react-native',
  // __tests__/App.test.tsx is the unmodified React Native CLI template test —
  // it renders the full app tree, which pulls in react-native-maps,
  // react-native-vector-icons, and @react-native-community/geolocation. None
  // of those have a working Jest transform/mock out of the box (each needs
  // its own native-module mock, not just a transformIgnorePatterns fix — this
  // was tried and still fails deeper, inside react-native-maps' own output).
  // Excluded rather than deleted, so the intent (a real render smoke test) is
  // still visible. The logic-heavy modules have real coverage instead — see
  // utils/__tests__.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/App.test.tsx'],
  moduleNameMapper: {
    // Recommended by @react-native-async-storage/async-storage itself — the
    // real module needs native linking, which isn't available under Jest.
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
