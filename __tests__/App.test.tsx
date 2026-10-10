/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// NOTE: this file is excluded from the test run — see the comment on
// testPathIgnorePatterns in jest.config.js for why (rendering the full app
// tree needs native-module mocks this project doesn't have yet). The
// logic-heavy modules have real coverage under utils/__tests__ instead.
it('renders correctly', () => {
  renderer.create(<App />);
});
