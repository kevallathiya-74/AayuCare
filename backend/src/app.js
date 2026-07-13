const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { APP_ENV } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { tieredRateLimit } = require("./middleware/rateLimit");
const { sendSuccess, sendError } = require("./utils/apiResponse");
const logger = require("./utils/logger");
const { getAuth } = require("./lib/auth");
const { query } = require("./config/postgres");
const { registerModules } = require("./modules");
const { toNodeHandler } = require("better-auth/node");

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet(APP_ENV.security.helmet));

const configuredCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:19006",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
      ...configuredCorsOrigins,
    ].filter(Boolean),
  ),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    maxAge: 86400,
  }),
);

app.use(tieredRateLimit);

const morganFormat = APP_ENV.logging.morganFormat;
app.use(morgan(morganFormat));

app.all("/api/auth/*", (req, res, next) => {
  try {
    const auth = getAuth();
    return toNodeHandler(auth)(req, res, next);
  } catch {
    return sendError(
      res,
      req,
      "Authentication service unavailable",
      500,
      "AUTH_SERVICE_UNAVAILABLE",
    );
  }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.set("etag", false);

registerModules(app);

app.get("/api", (req, res) => {
  return sendSuccess(
    res,
    req,
    {
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        appointments: "/api/v1/appointments",
        doctors: "/api/v1/doctors",
        medicalRecords: "/api/v1/medical-records",
      },
    },
    "Welcome to AayuCare API",
  );
});

app.get("/api/health", async (req, res) => {
  let postgresStatus = "disconnected";
  try {
    await query("SELECT 1");
    postgresStatus = "connected";
  } catch (err) {
    logger.error("Health check — database query failed", {
      error: err.message,
    });
  }

  let betterAuthStatus = "not initialized";
  try {
    const auth = getAuth();
    if (auth && typeof auth.api === "object") {
      betterAuthStatus = "initialized";
    }
  } catch {
    betterAuthStatus = "error";
  }

  const criticalDependenciesHealthy = postgresStatus === "connected";
  const overallStatus = criticalDependenciesHealthy ? "healthy" : "degraded";

  return sendSuccess(
    res,
    req,
    {
      status: overallStatus,
      environment: process.env.NODE_ENV,
      databases: {
        postgresql: postgresStatus,
      },
      betterAuth: betterAuthStatus,
    },
    "AayuCare Backend Server health status",
    criticalDependenciesHealthy ? 200 : 503,
  );
});

app.get("/api/livez", (req, res) => {
  return sendSuccess(res, req, { status: "alive" }, "Process is alive", 200);
});

app.get("/api/readyz", async (req, res) => {
  let postgresStatus = "disconnected";

  try {
    await query("SELECT 1");
    postgresStatus = "connected";
  } catch (err) {
    logger.error("Readiness check — database query failed", {
      error: err.message,
    });
  }

  const ready = postgresStatus === "connected";

  return sendSuccess(
    res,
    req,
    {
      status: ready ? "ready" : "not_ready",
      dependencies: {
        postgresql: postgresStatus,
      },
    },
    ready ? "Service is ready" : "Service is not ready",
    ready ? 200 : 503,
  );
});

app.get("/", (req, res) => {
  return sendSuccess(
    res,
    req,
    {
      version: "1.0.0",
      documentation: "/api/docs",
    },
    "Welcome to AayuCare API",
  );
});

app.all("*", (req, res) => {
  return sendError(
    res,
    req,
    `Can't find ${req.originalUrl} on this server!`,
    404,
    "NOT_FOUND",
  );
});

app.use(errorHandler);

module.exports = app;
