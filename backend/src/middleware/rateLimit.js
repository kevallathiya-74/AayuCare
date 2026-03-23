const crypto = require("crypto");
const { checkRateLimit } = require("../config/redis");
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

  if (path.startsWith("/api/auth/sign-in") || path.startsWith("/api/auth/sign-up")) {
    return { scope: "auth", max: 10, windowSeconds: 15 * 60 };
  }

  if (path.startsWith("/api/v1/ai/")) {
    return { scope: "ai", max: 20, windowSeconds: 60 * 60 };
  }

  if (method === "GET") {
    return { scope: "read", max: 200, windowSeconds: 15 * 60 };
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { scope: "write", max: 50, windowSeconds: 15 * 60 };
  }

  return null;
};

const tieredRateLimit = async (req, res, next) => {
  const policy = resolvePolicy(req);
  if (!policy) {
    return next();
  }

  const identifier = buildIdentifier(req);
  const key = `${policy.scope}:${identifier}`;
  const result = await checkRateLimit(key, policy.max, policy.windowSeconds);

  res.setHeader("X-RateLimit-Limit", String(policy.max));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));

  if (!result.allowed) {
    return sendError(
      res,
      req,
      "Too many requests. Please wait before trying again.",
      429,
      "RATE_LIMIT_EXCEEDED"
    );
  }

  return next();
};

module.exports = { tieredRateLimit };
