/**
 * AayuCare - API Service Configuration
 * Production-ready Axios instance with interceptors and offline support
 */

import axios from "axios";
import appStorage from "../utils/appStorage";
import { STORAGE_KEYS } from "../utils/constants";
import { APP_CONFIG } from "../config/appConfig";
import { parseError } from "../utils/errorHandler";

// Runtime guard: Ensure appStorage is properly wired
if (!appStorage || typeof appStorage.getItem !== "function") {
  if (__DEV__) {
    console.error("[API] CRITICAL: appStorage module not properly loaded!");
    console.error("[API] appStorage:", appStorage);
  }
  throw new Error("appStorage module is not properly initialized");
}

// Create axios instance using centralized configuration.
// Guard against malformed runtime config values to avoid startup crashes.
const normalizedBaseUrl = String(APP_CONFIG?.api?.baseURL ?? "")
  .trim()
  .replace(/\/+$/, "");
if (!normalizedBaseUrl) {
  throw new Error(
    "CRITICAL: No API base URL configured. Set EXPO_PUBLIC_API_BASE_URL.",
  );
}
const apiBaseV1 = normalizedBaseUrl.endsWith("/v1")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/v1`;

const api = axios.create({
  baseURL: apiBaseV1,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lightweight in-memory cache + in-flight dedupe for GET requests.
// Improves perceived performance across the app without backend changes.
const DEFAULT_GET_CACHE_TTL_MS = 15000;
const MAX_GET_CACHE_SIZE = 100;
const getResponseCache = new Map();
const inFlightGetRequests = new Map();

const buildGetCacheKey = (url = "", config = {}) => {
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
      acceptLanguage:
        config?.headers?.["Accept-Language"] ||
        config?.headers?.acceptLanguage ||
        "",
    },
  });
};

const shouldBypassGetCache = (url = "", config = {}) => {
  if (config?.useCache !== true) return true;
  if (config?.skipCache === true) return true;
  if (config?.headers?.["x-skip-cache"] === true) return true;
  if (String(url).includes("/auth/")) return true;
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
      if (getResponseCache.size > MAX_GET_CACHE_SIZE) {
        const oldest = getResponseCache.keys().next().value;
        if (oldest) getResponseCache.delete(oldest);
      }
      return response;
    })
    .finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

  inFlightGetRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

let isHandlingAuthExpiry = false;

const resetAuthExpiryFlag = () => {
  isHandlingAuthExpiry = false;
};


const ENDPOINT_ROLE_RULES = [
  {
    pattern: /^\/admin(\/|$)/i,
    allowedRoles: ["admin", "super_admin"],
  },
];

const getCurrentUserRole = () => {
  try {
    const store = require("../store/store").default;
    const role = store?.getState?.()?.auth?.user?.role;
    return role ? String(role).toLowerCase() : null;
  } catch {
    return null;
  }
};

const normalizeRequestPath = (url = "") => {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      const normalizedAbsolutePath = `/${String(parsed.pathname || "").replace(
        /^\/+/,
        "",
      )}`;
      return normalizedAbsolutePath.replace(/^\/api\/v1/i, "") || "/";
    }
  } catch {
    // Fall through to relative path normalization.
  }

  let path = raw;
  const normalizedBase = apiBaseV1.replace(/\/+$/, "");
  if (path.startsWith(normalizedBase)) {
    path = path.slice(normalizedBase.length);
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return path.replace(/^\/api\/v1/i, "") || "/";
};

const getAllowedRolesForPath = (path = "") => {
  const matchedRule = ENDPOINT_ROLE_RULES.find((rule) =>
    rule.pattern.test(path),
  );
  return matchedRule?.allowedRoles || null;
};

const createRoleAccessError = ({ path, role, allowedRoles }) => {
  const safeRole = role || "unknown";
  const error = new Error(
    `Access denied: role ${safeRole} cannot call ${path}.`,
  );
  error.code = "ROLE_ACCESS_DENIED";
  error.status = 403;
  error.meta = { path, role: safeRole, allowedRoles };
  return error;
};

// Log API URL for debugging (dev only)
if (__DEV__) {
  console.warn("[API] API Base URL:", apiBaseV1);
  console.warn(
    "[API] Environment:",
    APP_CONFIG.env.isDevelopment ? "Development" : "Production",
  );
  console.warn("[API] Expo Go:", APP_CONFIG.env.isExpoGo);
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const requestPath = normalizeRequestPath(config?.url);
      const allowedRoles = getAllowedRolesForPath(requestPath);
      const role = await getCurrentUserRole();

      if (
        config?.skipRoleGuard !== true &&
        role &&
        Array.isArray(allowedRoles) &&
        !allowedRoles.includes(role)
      ) {
        if (__DEV__) {
          console.warn(
            `[API] Blocked disallowed role endpoint call: role=${role} path=${requestPath}`,
          );
        }
        return Promise.reject(
          createRoleAccessError({ path: requestPath, role, allowedRoles }),
        );
      }

      const token = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const localConfig = config;
      const headers = localConfig.headers || {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        localConfig.headers = headers;
        if (__DEV__) {
          console.warn("[TOKEN] Authorization header set");
        }
      } else {
        if (__DEV__) {
          console.warn("⚠️ No auth token found in storage");
        }
      }

      if (__DEV__) {
        console.warn(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      if (__DEV__) {
        console.error("[ERROR] Error getting auth token:", error);
      }
      return config;
    }
  },
  (error) => {
    if (__DEV__) {
      console.error("[ERROR] Request interceptor error:", error);
    }
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    const method = String(response?.config?.method || "").toLowerCase();
    const isMutationMethod = ["post", "put", "patch", "delete"].includes(
      method,
    );

    // Clear in-memory GET caches after successful writes.
    // React Query invalidation is handled by each screen/useMutation onSuccess.
    if (isMutationMethod && response?.config?.skipCacheInvalidation !== true) {
      getResponseCache.clear();
      inFlightGetRequests.clear();
    }

    // Normalize response shape
    if (response?.data?.data !== undefined && response?.data?.success) {
      response.data = response.data.data;
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register)
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/sign-in") ||
      originalRequest.url?.includes("/auth/sign-up") ||
      originalRequest.url?.includes("/auth/refresh");

    // Handle 401 Unauthorized - Session expired (Better Auth uses session tokens, not refresh tokens)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (isHandlingAuthExpiry) {
        const authError = new Error("Session expired. Please login again.");
        authError.code = "AUTH_EXPIRED";
        return Promise.reject(authError);
      }

      isHandlingAuthExpiry = true;

      try {
        if (__DEV__) {
          console.warn("[API] 401 error - Session expired, clearing storage");
        }

        // Better Auth doesn't use refresh tokens - session is managed server-side
        // Clear storage and force re-login
        await appStorage.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
        await appStorage.deleteItem(STORAGE_KEYS.USER_DATA);

        const authError = new Error("Session expired. Please login again.");
        authError.code = "AUTH_EXPIRED";
        return Promise.reject(authError);
      } finally {
        resetAuthExpiryFlag();
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error(
        "Unable to connect to server. Please check your internet connection and try again.",
      );
      if (__DEV__) {
        console.warn("[NETWORK] Network Error");
        console.warn(
          "[INFO] Attempted URL:",
          error.config?.baseURL + error.config?.url,
        );
        console.warn("[INFO] API Base URL:", APP_CONFIG.api.baseURL);
      }
      return Promise.reject(networkError);
    }

    const errorMessage = parseError(error);
    if (__DEV__) {
      console.error("[ERROR] API Error:", errorMessage);
      if (error.response?.data?.message) {
        console.warn(
          "[ERROR] Raw server message:",
          error.response.data.message,
        );
      }
    }

    const safeError = new Error(errorMessage);
    safeError.code = error.response?.data?.code || error.code;
    safeError.status = error.response?.status;
    return Promise.reject(safeError);
  },
);

// Test API connectivity (useful for debugging)
export default api;
