const logger = require("../utils/logger");

class LRUMemoryCache {
  constructor(maxSize = 2000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
    return this;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  keys() {
    return this.cache.keys();
  }

  entries() {
    return this.cache.entries();
  }
}

// In-memory cache store bounded to max 2000 keys
const memoryCache = new LRUMemoryCache(2000);

// Periodic cleanup of expired keys (every 60s)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt && entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

// Unref to avoid keeping the process alive in tests or scripts
if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

const getCache = async (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.value;
};

const setCache = async (key, value, ttl = 3600) => {
  memoryCache.set(key, {
    value,
    expiresAt: ttl ? Date.now() + ttl * 1000 : null
  });
  return true;
};

const deleteCache = async (key) => {
  return memoryCache.delete(key);
};

const deleteCacheByPattern = async (pattern) => {
  let deletedCount = 0;
  // Convert glob pattern user:* to simple prefix/regex match
  const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  
  for (const key of memoryCache.keys()) {
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
      deletedCount++;
    }
  }
  
  return deletedCount;
};

const setSession = async (sessionId, sessionData, ttl = 604800) => {
  return setCache(`session:${sessionId}`, sessionData, ttl);
};

const getSession = async (sessionId) => {
  return getCache(`session:${sessionId}`);
};

const deleteSession = async (sessionId) => {
  return deleteCache(`session:${sessionId}`);
};

const setOTP = async (identifier, otp, ttl = 300) => {
  return setCache(`otp:${identifier}`, { otp, createdAt: new Date().toISOString() }, ttl);
};

const getOTP = async (identifier) => {
  return getCache(`otp:${identifier}`);
};

const deleteOTP = async (identifier) => {
  return deleteCache(`otp:${identifier}`);
};

const checkRateLimit = async (identifier, maxRequests = 100, windowSeconds = 60) => {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  let entry = memoryCache.get(key);
  if (!entry || (entry.expiresAt && entry.expiresAt < now)) {
    entry = {
      count: 0,
      expiresAt: now + windowMs
    };
  }
  
  entry.count += 1;
  memoryCache.set(key, entry);
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetInSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
  
  return { allowed, remaining, resetInSeconds, current: entry.count };
};

const blacklistToken = async (token, ttl = 2592000) => {
  return setCache(`blacklist:${token}`, { blacklistedAt: new Date().toISOString() }, ttl);
};

const isTokenBlacklisted = async (token) => {
  const data = await getCache(`blacklist:${token}`);
  return data !== null;
};

const connectCache = async () => {
  logger.info("🧩 Cache initialization: Bounded In-Memory Cache Active");
  return null;
};

const closeCache = async () => {
  clearInterval(cleanupInterval);
};

module.exports = {
  connectCache,
  closeCache,
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  setSession,
  getSession,
  deleteSession,
  setOTP,
  getOTP,
  deleteOTP,
  checkRateLimit,
  blacklistToken,
  isTokenBlacklisted,
};
