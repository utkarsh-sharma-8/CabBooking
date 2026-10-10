import {getErrorMessage} from '../errorMessage';

describe('getErrorMessage', () => {
  test('returns the server-provided message when present', () => {
    const error = {response: {data: {message: 'Phone already registered'}}};
    expect(getErrorMessage(error, 'fallback')).toBe('Phone already registered');
  });

  test('falls back when there is no response (e.g. network error)', () => {
    const error = new Error('Network Error');
    expect(getErrorMessage(error, 'Could not connect. Please try again.')).toBe(
      'Could not connect. Please try again.',
    );
  });

  test('falls back when the response body has no message field', () => {
    const error = {response: {data: {}}};
    expect(getErrorMessage(error, 'fallback')).toBe('fallback');
  });

  test('falls back on a nullish error', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
