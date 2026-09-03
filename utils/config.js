// Single source of truth for the backend's location. Previously this was
// hardcoded in three different places (utils/constants.js, utils/socket.js, and
// directly inside AuthScreenApi.js) with three different values that could drift
// out of sync. Change it here only.
//
// This is a plain LAN IP for local development against a backend running on your
// machine — update it to match your machine's LAN IP (or a real host once
// deployed). Deliberately not using react-native-config here to avoid adding a
// second native-linking dependency on top of this app's existing native modules.
const HOST = '192.168.31.183';
const PORT = 3000;

export const API_BASE_URL = `http://${HOST}:${PORT}/api`;
export const SOCKET_URL = `http://${HOST}:${PORT}`;
