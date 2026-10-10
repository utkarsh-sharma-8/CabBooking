import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage strategy: the access token is short-lived (15m) and is kept ONLY
// in memory (this module-level variable) — it is never written to disk, so it
// can't be read off the device even if AsyncStorage's unencrypted store is
// compromised. The refresh token is longer-lived but is rotated and revocable
// server-side (see be/cab_booking_be controller/authController.js), so a leaked
// copy has a bounded blast radius; it lives in AsyncStorage for now.
//
// For a real production deployment, swap the refresh-token AsyncStorage calls
// below for react-native-keychain (OS-level Keychain/Keystore) — that requires
// native linking/a rebuild, which wasn't done here to avoid an unverifiable
// native-build change.

const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const USER_KEY = 'auth.user';

let inMemoryAccessToken = null;

export function getAccessToken() {
  return inMemoryAccessToken;
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens({accessToken, refreshToken}) {
  inMemoryAccessToken = accessToken ?? inMemoryAccessToken;
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function setUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function hasStoredSession() {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return Boolean(refreshToken);
}

export async function clearTokens() {
  inMemoryAccessToken = null;
  await AsyncStorage.multiRemove([REFRESH_TOKEN_KEY, USER_KEY]);
}
