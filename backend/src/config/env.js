const MIN_JWT_SECRET_LENGTH = 64;

const normalizeNodeEnv = () => {
  const raw = String(process.env.NODE_ENV || "")
    .trim()
    .toLowerCase();
  if (raw === "production" || raw === "development" || raw === "test") {
    return raw;
  }

  const runningOnCloud = Boolean(
    process.env.RENDER ||
    process.env.VERCEL ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.K_SERVICE,
  );

  return runningOnCloud ? "production" : "development";
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBoolean = (value, fallback) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
};

const nodeEnv = normalizeNodeEnv();
const isProduction = nodeEnv === "production";
const isDevelopment = nodeEnv === "development";

const APP_ENV = {
  nodeEnv,
  isProduction,
  isDevelopment,
  logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  cache: {
    enabled: toBoolean(process.env.CACHE_ENABLED, isProduction),
    mode: process.env.CACHE_MODE || (isProduction ? "full" : "minimal"),
  },
  rateLimit: {
    auth: {
      max: toNumber(process.env.RATE_LIMIT_AUTH_MAX, isProduction ? 10 : 50),
      windowSeconds: toNumber(
        process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS,
        15 * 60,
      ),
    },
    read: {
      max: toNumber(process.env.RATE_LIMIT_READ_MAX, isProduction ? 200 : 1000),
      windowSeconds: toNumber(
        process.env.RATE_LIMIT_READ_WINDOW_SECONDS,
        15 * 60,
      ),
    },
    write: {
      max: toNumber(process.env.RATE_LIMIT_WRITE_MAX, isProduction ? 50 : 300),
      windowSeconds: toNumber(
        process.env.RATE_LIMIT_WRITE_WINDOW_SECONDS,
        15 * 60,
      ),
    },
    ai: {
      max: toNumber(process.env.RATE_LIMIT_AI_MAX, isProduction ? 20 : 80),
      windowSeconds: toNumber(
        process.env.RATE_LIMIT_AI_WINDOW_SECONDS,
        60 * 60,
      ),
    },
  },
  jwtSecretMinLength: MIN_JWT_SECRET_LENGTH,
  security: {
    helmet: {
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "blob:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      hsts: isProduction
        ? {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    },
  },
};

module.exports = {
  APP_ENV,
  MIN_JWT_SECRET_LENGTH,
};
