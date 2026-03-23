const crypto = require("crypto");

const getCacheControlForPath = (path) => {
  // Real-time endpoints
  if (path.includes("/notifications") || path.includes("/health-metrics") || path.endsWith("/health")) {
    return "no-cache, no-store";
  }

  // Stable endpoints
  if (path.includes("/doctors") || path.includes("/events") || path.includes("/profile")) {
    return "public, max-age=300, stale-while-revalidate=60";
  }

  // User-specific mutable data
  if (path.includes("/appointments") || path.includes("/prescriptions")) {
    return "private, max-age=60, stale-while-revalidate=30";
  }

  return "private, max-age=60, stale-while-revalidate=30";
};

const isNoStore = (cacheControl) => cacheControl.includes("no-store");

const cacheHeadersMiddleware = (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  const cacheControl = getCacheControlForPath(req.path || req.originalUrl || "");
  res.setHeader("Cache-Control", cacheControl);

  if (isNoStore(cacheControl)) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    try {
      const payloadString = JSON.stringify(payload || {});
      const etag = `W/\"${crypto.createHash("sha1").update(payloadString).digest("hex")}\"`;
      const requestEtag = req.headers["if-none-match"];

      res.setHeader("ETag", etag);

      if (requestEtag && requestEtag === etag) {
        return res.status(304).send();
      }
    } catch (_) {
      // Best effort only.
    }

    return originalJson(payload);
  };

  next();
};

module.exports = { cacheHeadersMiddleware };
