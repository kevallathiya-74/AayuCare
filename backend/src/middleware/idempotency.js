const crypto = require("crypto");
const { getCache, setCache } = require("../config/redis");

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

const idempotencyMiddleware = async (req, res, next) => {
  try {
    const idempotencyKey = req.header("Idempotency-Key") || req.header("idempotency-key");

    if (!idempotencyKey) {
      return next();
    }

    const bodyHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(req.body || {}))
      .digest("hex");

    const cacheKey = `idempotency:${idempotencyKey}`;
    const cached = await getCache(cacheKey);

    if (cached && cached.bodyHash === bodyHash) {
      if (cached.headers && typeof cached.headers === "object") {
        Object.entries(cached.headers).forEach(([key, value]) => {
          if (value) {
            res.setHeader(key, value);
          }
        });
      }
      res.setHeader("X-Idempotent-Replay", "true");
      return res.status(cached.statusCode || 200).json(cached.responseBody || {});
    }

    const originalJson = res.json.bind(res);
    res.json = async (payload) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await setCache(
            cacheKey,
            {
              bodyHash,
              statusCode: res.statusCode,
              responseBody: payload,
              headers: {
                "Content-Type": res.getHeader("Content-Type") || "application/json",
              },
            },
            IDEMPOTENCY_TTL_SECONDS
          );
        }
      } catch (_) {
        // Best-effort cache write; request should still complete.
      }
      return originalJson(payload);
    };

    next();
  } catch (_) {
    // Never block request flow on idempotency middleware failures.
    next();
  }
};

module.exports = { idempotencyMiddleware };
