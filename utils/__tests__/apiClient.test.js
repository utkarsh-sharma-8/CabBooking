import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient, {bootstrapSession} from '../apiClient';
import {setTokens, clearTokens, getAccessToken} from '../authStorage';

// apiClient.js makes two distinct kinds of HTTP call: `apiClient.get/post`
// (goes through the request/response interceptors under test) and a plain
// `axios.post` for the raw token-refresh call (performRefresh deliberately
// bypasses apiClient itself, since that request must never recurse into the
// 401-retry interceptor it's part of implementing) — both need their own
// mock adapter.
const apiMock = new MockAdapter(apiClient);
const globalMock = new MockAdapter(axios);

afterEach(async () => {
  apiMock.reset();
  globalMock.reset();
  await clearTokens();
});

afterAll(() => {
  apiMock.restore();
  globalMock.restore();
});

describe('request interceptor', () => {
  test('does not attach Authorization to public auth paths', async () => {
    await setTokens({accessToken: 'secret-token', refreshToken: 'r'});
    apiMock.onPost('/auth/request-otp').reply(config => {
      expect(config.headers.Authorization).toBeUndefined();
      return [202, {success: true}];
    });

    await apiClient.post('/auth/request-otp', {phone: '+911234567890'});
  });

  test('attaches Authorization: Bearer <token> to protected paths', async () => {
    await setTokens({accessToken: 'secret-token', refreshToken: 'r'});
    apiMock.onGet('/trips/active').reply(config => {
      expect(config.headers.Authorization).toBe('Bearer secret-token');
      return [200, {success: true, data: null}];
    });

    await apiClient.get('/trips/active');
  });

  test('sends no Authorization header when there is no access token', async () => {
    apiMock.onGet('/trips/active').reply(config => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, {success: true, data: null}];
    });

    await apiClient.get('/trips/active');
  });
});

describe('401 refresh-and-retry', () => {
  test('on a 401, refreshes the token once and retries the original request with it', async () => {
    await setTokens({accessToken: 'expired-token', refreshToken: 'valid-refresh'});

    let attempt = 0;
    apiMock.onGet('/trips/active').reply(config => {
      attempt += 1;
      if (attempt === 1) {
        expect(config.headers.Authorization).toBe('Bearer expired-token');
        return [401, {success: false, message: 'Token expired'}];
      }
      expect(config.headers.Authorization).toBe('Bearer fresh-token');
      return [200, {success: true, data: {tripId: 't1'}}];
    });
    globalMock.onPost(/\/auth\/refresh$/).reply(200, {
      accessToken: 'fresh-token',
      refreshToken: 'new-refresh',
    });

    const response = await apiClient.get('/trips/active');

    expect(response.data.data.tripId).toBe('t1');
    expect(attempt).toBe(2);
    expect(getAccessToken()).toBe('fresh-token');
  });

  test('two concurrent 401s only trigger a single refresh call (single-flight guard)', async () => {
    await setTokens({accessToken: 'expired-token', refreshToken: 'valid-refresh'});

    const attempts = {a: 0, b: 0};
    apiMock.onGet('/endpoint-a').reply(() => {
      attempts.a += 1;
      return attempts.a === 1 ? [401] : [200, {success: true, data: 'a'}];
    });
    apiMock.onGet('/endpoint-b').reply(() => {
      attempts.b += 1;
      return attempts.b === 1 ? [401] : [200, {success: true, data: 'b'}];
    });

    let refreshCalls = 0;
    globalMock.onPost(/\/auth\/refresh$/).reply(() => {
      refreshCalls += 1;
      return [200, {accessToken: 'fresh-token', refreshToken: 'new-refresh'}];
    });

    const [resA, resB] = await Promise.all([
      apiClient.get('/endpoint-a'),
      apiClient.get('/endpoint-b'),
    ]);

    expect(resA.data.data).toBe('a');
    expect(resB.data.data).toBe('b');
    expect(refreshCalls).toBe(1);
  });

  test('a request is only retried once — a second 401 (bad refresh token) rejects instead of looping', async () => {
    await setTokens({accessToken: 'expired-token', refreshToken: 'also-bad'});

    let attempt = 0;
    apiMock.onGet('/trips/active').reply(() => {
      attempt += 1;
      return [401, {success: false}];
    });
    globalMock.onPost(/\/auth\/refresh$/).reply(200, {
      accessToken: 'still-bad-token',
      refreshToken: 'still-bad-refresh',
    });

    await expect(apiClient.get('/trips/active')).rejects.toBeDefined();
    // Exactly the original attempt + one retry — no infinite loop.
    expect(attempt).toBe(2);
  });

  test('bootstrapSession returns false and leaves no access token when there is no stored refresh token', async () => {
    await clearTokens();
    await expect(bootstrapSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  test('bootstrapSession returns true and stores a fresh access token on success', async () => {
    await setTokens({refreshToken: 'valid-refresh'});
    globalMock.onPost(/\/auth\/refresh$/).reply(200, {
      accessToken: 'booted-token',
      refreshToken: 'rotated-refresh',
    });

    await expect(bootstrapSession()).resolves.toBe(true);
    expect(getAccessToken()).toBe('booted-token');
  });
});
