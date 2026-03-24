/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from 'axios';
import appStorage from '../utils/appStorage';
import { STORAGE_KEYS } from '../utils/constants';
import { APP_CONFIG } from '../config/appConfig';
import { queryClient } from '../config/reactQueryConfig';

// Runtime guard: Ensure appStorage is properly wired
if (!appStorage || typeof appStorage.getItem !== 'function') {
  if (__DEV__) {
    console.error('[API] CRITICAL: appStorage module not properly loaded!');
    console.error('[API] appStorage:', appStorage);
  }
  throw new Error('appStorage module is not properly initialized');
}

// Create axios instance using centralized configuration
const apiBaseV1 = APP_CONFIG.api.baseURL.endsWith('/v1')
  ? APP_CONFIG.api.baseURL
  : `${APP_CONFIG.api.baseURL}/v1`;

const api = axios.create({
  baseURL: apiBaseV1,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lightweight in-memory cache + in-flight dedupe for GET requests.
// Improves perceived performance across the app without backend changes.
const DEFAULT_GET_CACHE_TTL_MS = 15000;
const getResponseCache = new Map();
const inFlightGetRequests = new Map();

const buildGetCacheKey = (url = '', config = {}) => {
  const params = config?.params || {};
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  return JSON.stringify({
    baseURL: config?.baseURL || apiBaseV1,
    url,
    params: sortedParams,
    headers: {
      acceptLanguage: config?.headers?.['Accept-Language'] || config?.headers?.acceptLanguage || '',
    },
  });
};

const shouldBypassGetCache = (url = '', config = {}) => {
  if (config?.useCache !== true) return true;
  if (config?.skipCache === true) return true;
  if (config?.headers?.['x-skip-cache'] === true) return true;
  if (String(url).includes('/auth/')) return true;
  return false;
};

const cloneAxiosResponse = (response) => ({
  ...response,
  data: response?.data,
  headers: response?.headers,
  status: response?.status,
  statusText: response?.statusText,
  config: response?.config,
  request: response?.request,
});

const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  if (shouldBypassGetCache(url, config)) {
    return rawGet(url, config);
  }

  const cacheKey = buildGetCacheKey(url, config);
  const cacheTTL = Number(config?.cacheTTL ?? DEFAULT_GET_CACHE_TTL_MS);
  const now = Date.now();

  const cachedEntry = getResponseCache.get(cacheKey);
  if (cachedEntry && now - cachedEntry.timestamp < cacheTTL) {
    return Promise.resolve(cloneAxiosResponse(cachedEntry.response));
  }

  const inFlightPromise = inFlightGetRequests.get(cacheKey);
  if (inFlightPromise) {
    return inFlightPromise;
  }

  const requestPromise = rawGet(url, config)
    .then((response) => {
      getResponseCache.set(cacheKey, {
        response: cloneAxiosResponse(response),
        timestamp: Date.now(),
      });
      return response;
    })
    .finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

  inFlightGetRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

let isHandlingAuthExpiry = false;

// Log API URL for debugging (dev only)
if (__DEV__) {
  console.log('[API] API Base URL:', apiBaseV1);
  console.log('[API] Environment:', APP_CONFIG.env.isDevelopment ? 'Development' : 'Production');
  console.log('[API] Expo Go:', APP_CONFIG.env.isExpoGo);
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('[TOKEN] Authorization header set');
        }
      } else {
        if (__DEV__) {
          console.log('⚠️ No auth token found in storage');
        }
      }

      if (__DEV__) {
        console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      if (__DEV__) {
        console.error('[ERROR] Error getting auth token:', error);
      }
      return config;
    }
  },
  (error) => {
    if (__DEV__) {
      console.error('[ERROR] Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    const method = String(response?.config?.method || '').toLowerCase();
    const isMutationMethod = ['post', 'put', 'patch', 'delete'].includes(method);

    // Root-cause fix: clear cached GET snapshots after successful writes so lists reflect backend state.
    if (isMutationMethod && response?.config?.skipCacheInvalidation !== true) {
      getResponseCache.clear();
      inFlightGetRequests.clear();
      
      // Global React Query invalidation to ensure UI reactivity
      try {
        if (queryClient && typeof queryClient.invalidateQueries === 'function') {
          queryClient.invalidateQueries();
          if (__DEV__) console.log('[API] Invalidated all React Query caches after successful mutation');
        }
      } catch (e) {
        if (__DEV__) console.error('[API] Failed to invalidate React Query caches', e);
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/sign-in') || 
                           originalRequest.url?.includes('/auth/sign-up') ||
                           originalRequest.url?.includes('/auth/refresh');

    // Handle 401 Unauthorized - Session expired (Better Auth uses session tokens, not refresh tokens)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isHandlingAuthExpiry) {
        const authError = new Error('Session expired. Please login again.');
        authError.code = 'AUTH_EXPIRED';
        return Promise.reject(authError);
      }

      isHandlingAuthExpiry = true;

      if (__DEV__) {
        console.log('[API] 401 error - Session expired, clearing storage');
      }
      
      // Better Auth doesn't use refresh tokens - session is managed server-side
      // Clear storage and force re-login
      await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
      await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);

      // Dispatch logout to Redux so UI state is also cleared
      try {
        const store = require('../store/store').default;
        const { logoutUser } = require('../store/slices/authSlice');
        store.dispatch(logoutUser());
      } catch (storeErr) {
        if (__DEV__) {
          console.warn('[API] Could not dispatch logoutUser to Redux store:', storeErr);
        }
      }
      
      const authError = new Error('Session expired. Please login again.');
      authError.code = 'AUTH_EXPIRED';
      isHandlingAuthExpiry = false;
      return Promise.reject(authError);
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Unable to connect to server. Please check your internet connection and try again.');
      if (__DEV__) {
        console.error('[NETWORK] Network Error');
        console.error('[INFO] Attempted URL:', error.config?.baseURL + error.config?.url);
        console.error('[INFO] API Base URL:', APP_CONFIG.api.baseURL);
      }
      return Promise.reject(networkError);
    }

    // Extract error message from response
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';
    if (__DEV__) {
      console.error('[ERROR] API Error:', errorMessage);
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// Test API connectivity (useful for debugging)
export default api;

