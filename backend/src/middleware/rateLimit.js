const crypto = require("crypto");
const { checkRateLimit } = require("../config/cache");
const logger = require("../utils/logger");
const { APP_ENV } = require("../config/env");
const { sendError } = require("../utils/apiResponse");

const buildIdentifier = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    return `token:${tokenHash}`;
  }

  return `ip:${req.ip || req.socket?.remoteAddress || "unknown"}`;
};

const resolvePolicy = (req) => {
  const path = req.path || req.originalUrl || "";
  const method = req.method;

  if (
    path.startsWith("/api/auth/sign-in") ||
    path.startsWith("/api/auth/sign-up")
  ) {
    return {
      scope: "auth",
      max: APP_ENV.rateLimit.auth.max,
      windowSeconds: APP_ENV.rateLimit.auth.windowSeconds,
    };
  }

  if (path.startsWith("/api/v1/ai/")) {
    return {
      scope: "ai",
      max: APP_ENV.rateLimit.ai.max,
      windowSeconds: APP_ENV.rateLimit.ai.windowSeconds,
    };
  }

  if (method === "GET") {
    return {
      scope: "read",
      max: APP_ENV.rateLimit.read.max,
      windowSeconds: APP_ENV.rateLimit.read.windowSeconds,
    };
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return {
      scope: "write",
      max: APP_ENV.rateLimit.write.max,
      windowSeconds: APP_ENV.rateLimit.write.windowSeconds,
    };
  }

  return null;
};

const tieredRateLimit = async (req, res, next) => {
  try {
    const policy = resolvePolicy(req);
    if (!policy) {
      return next();
    }

    const identifier = buildIdentifier(req);
    const key = `${policy.scope}:${identifier}`;
    const result = await checkRateLimit(key, policy.max, policy.windowSeconds);

    res.setHeader("X-RateLimit-Limit", String(policy.max));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Window", String(policy.windowSeconds));

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.resetInSeconds));
      return sendError(
        res,
        429,
        "Too many requests. Please wait before trying again.",
        "RATE_LIMIT_EXCEEDED",
      );
    }

    return next();
  } catch (error) {
    // Auth rate limiting MUST be fail-closed (security > availability)
    const path = req.path || req.originalUrl || "";
    if (
      path.startsWith("/api/auth/sign-in") ||
      path.startsWith("/api/auth/sign-up")
    ) {
      logger.error(
        `Rate limiter critical error on auth endpoint: ${error.message}`,
      );
      return sendError(
        res,
        503,
        "Authentication service temporarily unavailable",
        "AUTH_SERVICE_UNAVAILABLE",
      );
    }
    logger.warn(`Rate limiter fallback (fail-open): ${error.message}`);
    return next();
  }
};

module.exports = { tieredRateLimit };
