import axios from 'axios';
import {API_BASE_URL} from './config';
import {getAccessToken, getRefreshToken, setTokens} from './authStorage';
import {endSession} from './session';

// Endpoints that don't need (and, for request-otp/verify-otp, don't yet have) an
// access token attached.
const PUBLIC_PATHS = ['/auth/request-otp', '/auth/verify-otp', '/auth/refresh'];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {'Content-Type': 'application/json'},
});

const isPublicPath = url => PUBLIC_PATHS.some(path => url?.startsWith(path));

apiClient.interceptors.request.use(requestConfig => {
  if (!isPublicPath(requestConfig.url)) {
    const token = getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
  }
  return requestConfig;
});

async function performRefresh() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {refreshToken});
  const {accessToken, refreshToken: newRefreshToken} = response.data;
  await setTokens({accessToken, refreshToken: newRefreshToken});
  return accessToken;
}

// Guards against multiple concurrent refresh triggers — an HTTP 401, a
// socket connect_error, and the app-boot bootstrapSession() call can all
// happen close together, and the backend rotates refresh tokens on every use
// (a stale one is rejected), so any two of these firing independently would
// race and spuriously log the user out. Every refresh trigger in the app
// must go through this single in-flight promise instead of calling
// performRefresh() directly.
let refreshPromise = null;

function getOrCreateRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Called at app boot (see Splash.js) and by socket.js on an auth connect_error
// to exchange a stored refresh token for a fresh in-memory access token.
// Returns false (rather than throwing) on any failure so callers can fall
// back to the Auth screen without a try/catch.
export async function bootstrapSession() {
  try {
    await getOrCreateRefreshPromise();
    return true;
  } catch (error) {
    return false;
  }
}

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !isPublicPath(originalRequest.url) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await getOrCreateRefreshPromise();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await endSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
