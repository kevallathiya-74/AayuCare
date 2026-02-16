const { getCache, setCache } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Redis Cache Middleware
 * Cache GET request responses with configurable TTL
 */

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
      // Generate cache key
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === "function") {
        cacheKey = keyGenerator(req);
      } else {
        // Default key: route + query params + user role + hospital
        const userId = req.user?.id || "anonymous";
        const role = req.user?.role || "guest";
        const hospitalId = req.hospitalId || "none";
        const queryString = JSON.stringify(req.query);
        cacheKey = `cache:${req.originalUrl}:${userId}:${role}:${hospitalId}:${queryString}`;
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
  return `cache:doctors:${hospitalId}:${specialization}`;
});

/**
 * Cache patient appointments (30 seconds)
 */
const cachePatientAppointments = cacheMiddleware(30, (req) => {
  const patientId = req.user?.id;
  const status = req.query.status || "all";
  return `cache:appointments:patient:${patientId}:${status}`;
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
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const { deleteCacheByPattern } = require("../config/redis");
      await deleteCacheByPattern(pattern);
      logger.debug(`Cache invalidated: ${pattern}`);
    } catch (error) {
      logger.error("Cache invalidation error:", error.message);
    }
    next();
  };
};

module.exports = {
  cacheMiddleware,
  cacheDoctorAvailability,
  cacheDoctorList,
  cachePatientAppointments,
  cacheDashboard,
  invalidateCache,
};
