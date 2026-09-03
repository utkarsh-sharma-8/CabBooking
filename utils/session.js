import {clearTokens} from './authStorage';
import {disconnectSocket} from './socket';
import {resetToAuth} from './navigationRef';

// Single place that tears down a session: disconnect the socket, clear stored
// tokens, and return to Auth — always in that order. Every "the session is
// over" call site (a failed token refresh, manual logout, a failed
// session-bootstrap at app launch) should call this instead of hand-rolling
// its own cleanup, so they can't drift out of sync with each other.
//
// Each step is isolated so a failure in one (e.g. AsyncStorage.multiRemove
// rejecting) can't prevent the others from running — in particular, the user
// must always end up back on the Auth screen, even if cleanup was partial.
export async function endSession() {
  try {
    disconnectSocket();
  } catch (error) {
    console.log(`endSession: disconnectSocket failed: ${error}`);
  }
  try {
    await clearTokens();
  } catch (error) {
    console.log(`endSession: clearTokens failed: ${error}`);
  }
  resetToAuth();
}
