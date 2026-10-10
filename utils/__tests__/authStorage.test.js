import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  setUser,
  getUser,
  hasStoredSession,
  clearTokens,
} from '../authStorage';

// The access token is deliberately kept only in an in-memory module variable
// (see authStorage.js's comment on why — never written to disk), which means
// it does NOT survive between test files, but DOES persist across tests
// within this one file unless explicitly cleared — hence clearing it here.
afterEach(async () => {
  await clearTokens();
  await AsyncStorage.clear();
});

describe('authStorage', () => {
  test('access token starts unset', () => {
    expect(getAccessToken()).toBeNull();
  });

  test('setTokens stores the access token in memory and the refresh token in AsyncStorage', async () => {
    await setTokens({accessToken: 'access-123', refreshToken: 'refresh-456'});

    expect(getAccessToken()).toBe('access-123');
    await expect(getRefreshToken()).resolves.toBe('refresh-456');
  });

  test('setTokens with only an access token leaves a previously-stored refresh token untouched', async () => {
    await setTokens({accessToken: 'access-1', refreshToken: 'refresh-1'});
    await setTokens({accessToken: 'access-2'});

    expect(getAccessToken()).toBe('access-2');
    await expect(getRefreshToken()).resolves.toBe('refresh-1');
  });

  test('setUser/getUser round-trip through AsyncStorage as JSON', async () => {
    const user = {id: '1', phone: '+911234567890', name: 'Test User', isDriver: false};
    await setUser(user);
    await expect(getUser()).resolves.toEqual(user);
  });

  test('getUser resolves null when nothing was ever stored', async () => {
    await expect(getUser()).resolves.toBeNull();
  });

  test('hasStoredSession reflects whether a refresh token is present', async () => {
    await expect(hasStoredSession()).resolves.toBe(false);
    await setTokens({accessToken: 'a', refreshToken: 'r'});
    await expect(hasStoredSession()).resolves.toBe(true);
  });

  test('clearTokens wipes the in-memory access token and stored refresh token/user', async () => {
    await setTokens({accessToken: 'a', refreshToken: 'r'});
    await setUser({id: '1'});

    await clearTokens();

    expect(getAccessToken()).toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
    await expect(getUser()).resolves.toBeNull();
  });
});
