const Redis = require("ioredis");
const logger = require("../utils/logger");

const extractRedisUrl = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Handle mistakenly pasted CLI command, e.g.
  // "redis-cli --tls -u redis://..."
  const token = trimmed
    .split(/\s+/)
    .find((part) => part.startsWith("redis://") || part.startsWith("rediss://"));

  return token || (trimmed.startsWith("redis://") || trimmed.startsWith("rediss://") ? trimmed : null);
};

const redisUrl = extractRedisUrl(process.env.REDIS_URL);

// In development, prefer local Redis unless explicitly disabled.
// Set REDIS_USE_LOCAL=false to force REDIS_URL in dev.
const shouldUseLocalRedis =
  process.env.REDIS_USE_LOCAL === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.REDIS_USE_LOCAL !== "false");

// Redis client configuration
// Supports REDIS_URL (Upstash/cloud) or individual REDIS_HOST/PORT/PASSWORD (local)
const buildRedisConfig = () => {
  const base = {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };
  if (!shouldUseLocalRedis && redisUrl) {
    return { ...base, url: redisUrl, tls: {} };
  }
  return {
    ...base,
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  };
};

const redisConfig = buildRedisConfig();

// Create Redis client — ioredis accepts a URL string or config object
const redisClient = !shouldUseLocalRedis && redisUrl
  ? new Redis(redisUrl)
  : new Redis(redisConfig);

if (shouldUseLocalRedis) {
  logger.info(`🧩 Redis mode: local (${redisConfig.host}:${redisConfig.port}, db ${redisConfig.db})`);
} else {
  logger.info("🧩 Redis mode: url");
}

// Connection event handlers
redisClient.on("connect", () => {
  logger.info("✅ Redis client connecting...");
});

redisClient.on("ready", () => {
  logger.info("✅ Redis client ready");
  logger.info(`📊 Redis DB: ${process.env.REDIS_DB || 0}`);
});

redisClient.on("error", (err) => {
  logger.error(`❌ Redis client error: ${err.message}`);
});

redisClient.on("close", () => {
  logger.warn("⚠️  Redis connection closed");
});

redisClient.on("reconnecting", () => {
  logger.info("🔄 Redis client reconnecting...");
});

/**
 * Initialize Redis connection
 */
const connectRedis = async () => {
  try {
    await redisClient.ping();
    logger.info("✅ Redis Connected Successfully");
    return redisClient;
  } catch (error) {
    logger.error(`❌ Redis connection failed: ${error.message}`);
    logger.warn("⚠️  Application will continue without Redis caching");
    // Don't throw - allow app to run without Redis
    return null;
  }
};

/**
 * Cache Helper Functions
 */

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error("Redis GET error:", error.message);
    return null;
  }
};

/**
 * Set cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 * @returns {Promise<boolean>} Success status
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.error("Redis SET error:", error.message);
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error("Redis DEL error:", error.message);
    return false;
  }
};

/**
 * Delete multiple cache keys by pattern
 * Uses SCAN for production-safe iteration (non-blocking, O(1) per call)
 * ioredis scan() returns [nextCursorString, keysArray] — NOT an object with .cursor/.keys
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
const deleteCacheByPattern = async (pattern) => {
  try {
    const keys = [];
    let cursor = "0";

    // ioredis SCAN signature: scan(cursor, 'MATCH', pattern, 'COUNT', count)
    // returns [nextCursorString, keysArray]
    do {
      const [nextCursor, batch] = await redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (batch.length > 0) {
        keys.push(...batch);
      }
    } while (cursor !== "0");

    if (keys.length === 0) return 0;

    // Delete in batches of 100 to avoid blocking Redis
    const batchSize = 100;
    let deleted = 0;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize);
      await redisClient.del(...batchKeys);
      deleted += batchKeys.length;
    }

    logger.debug(`Redis: deleted ${deleted} keys matching "${pattern}"`);
    return deleted;
  } catch (error) {
    logger.error("Redis pattern delete error:", error.message);
    return 0;
  }
};

/**
 * Session Management Functions
 */

/**
 * Store session data
 * @param {string} sessionId - Session identifier
 * @param {object} sessionData - Session data
 * @param {number} ttl - Time to live in seconds (default: 7 days)
 */
const setSession = async (sessionId, sessionData, ttl = 604800) => {
  const key = `session:${sessionId}`;
  return await setCache(key, sessionData, ttl);
};

/**
 * Get session data
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object|null>} Session data or null
 */
const getSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  return await getCache(key);
};

/**
 * Delete session
 * @param {string} sessionId - Session identifier
 */
const deleteSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  return await deleteCache(key);
};

/**
 * OTP Management Functions
 */

/**
 * Store OTP
 * @param {string} identifier - User identifier (phone/email)
 * @param {string} otp - OTP code
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
const setOTP = async (identifier, otp, ttl = 300) => {
  const key = `otp:${identifier}`;
  return await setCache(key, { otp, createdAt: new Date().toISOString() }, ttl);
};

/**
 * Get OTP
 * @param {string} identifier - User identifier
 * @returns {Promise<object|null>} OTP data or null
 */
const getOTP = async (identifier) => {
  const key = `otp:${identifier}`;
  return await getCache(key);
};

/**
 * Delete OTP after verification
 * @param {string} identifier - User identifier
 */
const deleteOTP = async (identifier) => {
  const key = `otp:${identifier}`;
  return await deleteCache(key);
};

/**
 * Rate Limiting Helper
 */

/**
 * Check and increment rate limit counter
 * @param {string} identifier - Request identifier (IP, userId, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
const checkRateLimit = async (
  identifier,
  maxRequests = 100,
  windowSeconds = 60
) => {
  try {
    const key = `ratelimit:${identifier}`;
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    return { allowed, remaining, current };
  } catch (error) {
    logger.error("Rate limit check error:", error.message);
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: maxRequests, current: 0 };
  }
};

/**
 * Token Blacklist Management
 */

/**
 * Blacklist a token (for logout/revocation)
 * @param {string} token - JWT token
 * @param {number} ttl - Time to live (should match token expiry)
 */
const blacklistToken = async (token, ttl = 2592000) => {
  const key = `blacklist:${token}`;
  return await setCache(key, { blacklistedAt: new Date().toISOString() }, ttl);
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if blacklisted
 */
const isTokenBlacklisted = async (token) => {
  const key = `blacklist:${token}`;
  const data = await getCache(key);
  return data !== null;
};

/**
 * Graceful shutdown
 */
const closeRedis = async () => {
  try {
    await redisClient.quit();
    logger.info("✅ Redis connection closed gracefully");
  } catch (error) {
    logger.error("❌ Error closing Redis connection:", error.message);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  closeRedis,

  // Cache operations
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,

  // Session management
  setSession,
  getSession,
  deleteSession,

  // OTP management
  setOTP,
  getOTP,
  deleteOTP,

  // Rate limiting
  checkRateLimit,

  // Token blacklist
  blacklistToken,
  isTokenBlacklisted,
};
