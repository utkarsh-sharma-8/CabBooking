import apiClient from './apiClient';
import {getRefreshToken} from './authStorage';
import {endSession} from './session';

// User-initiated logout: revoke the refresh token server-side, then tear the
// session down locally regardless — a failed request must never leave the
// user stuck signed in. Kept out of session.js because apiClient already
// imports session (it calls endSession on a failed refresh).
export async function logout() {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/auth/logout', {refreshToken});
    }
  } catch (error) {
    console.log(`Logout request failed (continuing local logout): ${error}`);
  } finally {
    await endSession();
  }
}
