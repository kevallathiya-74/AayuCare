const { getCache, setCache, deleteCacheByPattern } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Redis Cache Middleware
 * Cache GET request responses with configurable TTL
 * Version: 1.0 - All cache keys are versioned to prevent stale data after API updates
 */

// API version for cache key namespacing
const API_VERSION = 'v1';

/**
 * Create cache middleware for GET endpoints
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @param {Function} keyGenerator - Function to generate cache key from req
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 60, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      // Generate cache key with API version prefix
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === "function") {
        cacheKey = `${API_VERSION}:${keyGenerator(req)}`;
      } else {
        // Default key: version + route + query params + user role + hospital
        const userId = req.user?.id || "anonymous";
        const role = req.user?.role || "guest";
        const hospitalId = req.hospitalId || "none";
        const queryString = JSON.stringify(req.query);
        cacheKey = `${API_VERSION}:cache:${req.originalUrl}:${userId}:${role}:${hospitalId}:${queryString}`;
      }

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.status(200).json(cachedData);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          setCache(cacheKey, data, ttl).catch((err) => {
            logger.error("Failed to cache response:", err.message);
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error.message);
      // Don't break the request if cache fails
      next();
    }
  };
};

/**
 * Cache doctor availability (60 seconds)
 */
const cacheDoctorAvailability = cacheMiddleware(60, (req) => {
  const doctorId = req.params.id || req.params.doctorId;
  const date = req.query.date || "today";
  return `cache:doctor:${doctorId}:availability:${date}`;
});

/**
 * Cache doctor list (5 minutes)
 */
const cacheDoctorList = cacheMiddleware(300, (req) => {
  const hospitalId = req.hospitalId || "all";
  const specialization = req.query.specialization || "all";
  const search = (req.query.search || req.query.q || "").toString().trim().toLowerCase();
  const includeInactive = (req.query.includeInactive || "false").toString().toLowerCase();
  const page = (req.query.page || "1").toString();
  const limit = (req.query.limit || "20").toString();

  return `cache:doctors:${hospitalId}:${specialization}:${search}:${includeInactive}:${page}:${limit}`;
});

/**
 * Cache patient appointments (30 seconds)
 */
const cachePatientAppointments = cacheMiddleware(30, (req) => {
  const patientId = req.user?.id;
  const status = req.query.status || "all";
  const startDate = req.query.startDate || "";
  const endDate = req.query.endDate || "";
  const doctorId = req.query.doctorId || "";
  const page = req.query.page || "1";
  const limit = req.query.limit || "20";
  return `cache:appointments:patient:${patientId}:${status}:${startDate}:${endDate}:${doctorId}:${page}:${limit}`;
});

/**
 * Cache dashboard data (60 seconds)
 */
const cacheDashboard = cacheMiddleware(60, (req) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  return `cache:dashboard:${role}:${userId}`;
});

/**
 * Invalidate cache by pattern
 * Use this after data mutations (POST, PUT, DELETE)
 * Always includes the API version prefix to match stored keys.
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      // Ensure pattern matches the versioned keys stored by cacheMiddleware
      const versionedPattern = pattern.startsWith(`${API_VERSION}:`) ? pattern : `${API_VERSION}:${pattern}`;
      await deleteCacheByPattern(versionedPattern);
      logger.debug(`Cache invalidated: ${versionedPattern}`);
    } catch (error) {
      logger.error("Cache invalidation error:", error.message);
    }
    next();
  };
};

module.exports = {
  cache: cacheMiddleware,
  cacheMiddleware,
  cacheDoctorAvailability,
  cacheDoctorList,
  cachePatientAppointments,
  cacheDashboard,
  invalidateCache,
};
