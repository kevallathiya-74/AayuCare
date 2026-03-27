// =============================================================================
// CRITICAL: Load environment variables FIRST before any other imports
// =============================================================================
require("dotenv").config();

const { APP_ENV } = require("./src/config/env");
process.env.NODE_ENV = APP_ENV.nodeEnv;

// =============================================================================
// DNS FIX: Resolve MongoDB SRV connection issues on Windows (dev only)
// =============================================================================
const dns = require("dns");
const logger = require("./src/utils/logger");

// Only apply DNS override in non-production environments.
// In production (Render), the hosting provider's internal DNS must not be overridden.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  dns.setDefaultResultOrder("ipv4first");
}

// =============================================================================
// Validate Critical Environment Variables
// =============================================================================
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error("❌ FATAL: Missing required environment variables:");
  missingVars.forEach(varName => logger.error(`   - ${varName}`));
  logger.error("\n💡 Please check your .env file and ensure all variables are set.");
  process.exit(1);
}

logger.info("✅ All required environment variables validated");

// Environment validated - ready to start

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./src/config/database");
const { connectPostgres, closePool } = require("./src/config/postgres");
const { connectRedis, closeRedis } = require("./src/config/redis");
const { errorHandler } = require("./src/middleware/errorHandler");
const { requestIdMiddleware } = require("./src/middleware/requestId");
const { cacheHeadersMiddleware } = require("./src/middleware/cacheHeaders");
const { tieredRateLimit } = require("./src/middleware/rateLimit");
const { sendSuccess, sendError } = require("./src/utils/apiResponse");
const { initAuth, getAuth } = require("./src/lib/auth");
const { registerModules } = require("./src/modules");
const { toNodeHandler } = require("better-auth/node");

// Routes

const app = express();

// Must be set BEFORE rate limiter to correctly identify client IPs
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Connect to databases
const initializeDatabases = async () => {
  try {
    // MongoDB (for medical records, logs, documents) - non-blocking
    try {
      await connectDB();
    } catch (mongoError) {
      logger.warn("⚠️  Continuing without MongoDB");
    }

    // PostgreSQL (for relational data)
    await connectPostgres();

    // Redis (for caching and sessions)
    await connectRedis();

    // Initialize Better Auth after all DB connections
    try {
      initAuth();
      logger.info("✅ Better Auth initialized");
    } catch (error) {
      logger.error("❌ Better Auth initialization failed:", error);
    }
  } catch (error) {
    logger.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

// Initialize databases - server will NOT accept connections until all DBs are ready
initializeDatabases()
  .then(() => startServer())
  .catch((err) => {
    logger.error('❌ Fatal: Could not initialize databases, aborting server start:', err);
    process.exit(1);
  });

// Security Middleware
app.use(helmet(APP_ENV.security.helmet));

// CORS - explicit allowlist for production, permissive in development
const configuredCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:19006", // Expo web
    "http://localhost:3000", // Local frontend
    process.env.FRONTEND_URL,
    ...configuredCorsOrigins,
  ].filter(Boolean))
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Mobile native apps and server-to-server calls may send no Origin header.
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
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

// Tiered Redis-backed rate limiting (auth/read/write/ai)
app.use(tieredRateLimit);

// Logging - always include status code and latency for production observability
const morganFormat =
  APP_ENV.logging.morganFormat;
app.use(morgan(morganFormat));

// Request correlation ID for all requests
app.use(requestIdMiddleware);

// Better Auth Handler - MUST come BEFORE custom routes
app.all("/api/auth/*", (req, res, next) => {
  try {
    const auth = getAuth();
    return toNodeHandler(auth)(req, res, next);
  } catch (error) {
    logger.error("Better Auth handler error:", error);
    return sendError(
      res,
      req,
      "Authentication service unavailable",
      500,
      "AUTH_SERVICE_UNAVAILABLE"
    );
  }
});

// Body parser - MUST come AFTER Better Auth but BEFORE custom routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cacheHeadersMiddleware);

// Sanitize request data to prevent MongoDB operator injection ($gt, $where, etc.)
// Strips keys that begin with '$' or contain '.' from req.body, req.params, and req.query
app.use(mongoSanitize({ replaceWith: '_' }));

// Disable ETags to prevent 304 Not Modified responses (causes frontend cache issues)
app.set('etag', false);

// API Routes (custom routes that extend Better Auth)
// Mount feature modules first (modular monolith entrypoint)
registerModules(app);

// API Root route
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
    "Welcome to AayuCare API"
  );
});

// Health check
app.get("/api/health", async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  // Check PostgreSQL
  let postgresStatus = "disconnected";
  try {
    const { query } = require("./src/config/postgres");
    await query("SELECT 1");
    postgresStatus = "connected";
  } catch (error) {
    logger.error("PostgreSQL health check failed:", error.message);
  }

  // Check Redis
  let redisStatus = "disconnected";
  try {
    const { redisClient } = require("./src/config/redis");
    await redisClient.ping();
    redisStatus = "connected";
  } catch (error) {
    logger.error("Redis health check failed:", error.message);
  }

  // Better Auth health check
  let betterAuthStatus = 'not initialized';
  try {
    const auth = getAuth();
    if (auth && typeof auth.api === 'object') {
      betterAuthStatus = 'initialized';
    }
  } catch (error) {
    betterAuthStatus = 'error';
    logger.error('Better Auth health check failed:', error.message);
  }

  const criticalDependenciesHealthy =
    postgresStatus === "connected" && redisStatus === "connected";
  const overallStatus = criticalDependenciesHealthy ? "healthy" : "degraded";

  return sendSuccess(
    res,
    req,
    {
      status: overallStatus,
      environment: process.env.NODE_ENV,
      databases: {
        mongodb: mongoStatus,
        postgresql: postgresStatus,
        redis: redisStatus,
      },
      betterAuth: betterAuthStatus,
    },
    "AayuCare Backend Server health status",
    criticalDependenciesHealthy ? 200 : 503
  );
});

// Liveness probe - process is up
app.get("/api/livez", (req, res) => {
  return sendSuccess(res, req, { status: "alive" }, "Process is alive", 200);
});

// Readiness probe - critical dependencies are up
app.get("/api/readyz", async (req, res) => {
  let postgresStatus = "disconnected";
  let redisStatus = "disconnected";

  try {
    const { query } = require("./src/config/postgres");
    await query("SELECT 1");
    postgresStatus = "connected";
  } catch (error) {
    logger.error("Readiness PostgreSQL check failed:", error.message);
  }

  try {
    const { redisClient } = require("./src/config/redis");
    await redisClient.ping();
    redisStatus = "connected";
  } catch (error) {
    logger.error("Readiness Redis check failed:", error.message);
  }

  const ready = postgresStatus === "connected" && redisStatus === "connected";

  return sendSuccess(
    res,
    req,
    {
      status: ready ? "ready" : "not_ready",
      dependencies: {
        postgresql: postgresStatus,
        redis: redisStatus,
      },
    },
    ready ? "Service is ready" : "Service is not ready",
    ready ? 200 : 503
  );
});

// Root route
app.get("/", (req, res) => {
  return sendSuccess(
    res,
    req,
    {
      version: "1.0.0",
      documentation: "/api/docs",
    },
    "Welcome to AayuCare API"
  );
});

// 404 handler
app.all("*", (req, res) => {
  return sendError(res, req, `Can't find ${req.originalUrl} on this server!`, 404, "NOT_FOUND");
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const closeConnections = async () => {
  try {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed");
  } catch (error) {
    logger.warn(`⚠️ MongoDB close warning: ${error.message}`);
  }

  try {
    await closePool();
    logger.info("✅ PostgreSQL connection closed");
  } catch (error) {
    logger.warn(`⚠️ PostgreSQL close warning: ${error.message}`);
  }

  try {
    await closeRedis();
    logger.info("✅ Redis connection closed");
  } catch (error) {
    logger.warn(`⚠️ Redis close warning: ${error.message}`);
  }
};

function startServer() {
  const http = require("http");
  server = http.createServer(app);

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      try {
        const response = await fetch(`http://localhost:${PORT}/api/health`, {
          method: "GET",
        });
        if (response.ok) {
          logger.warn(
            `⚠️ Port ${PORT} is already in use by a healthy backend instance. Exiting duplicate process.`
          );
          await closeConnections();
          process.exit(0);
          return;
        }
      } catch (_) {
        // Continue to fatal logging below.
      }
    }

    logger.error(`❌ Server startup error: ${error.message}`);
    await closeConnections();
    process.exit(1);
  });

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
    logger.info(`🌐 API URL: http://localhost:${PORT}`);
    logger.info(`📱 Expo Go will auto-detect your computer's IP address`);
    logger.info(`ℹ️  Make sure phone and computer are on the same WiFi network`);
  });

  // Keep Render free instance alive by self-pinging every 14 minutes.
  // Render spins down free services after ~15 minutes of inactivity.
  if (process.env.NODE_ENV === "production" && process.env.BACKEND_URL) {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    setInterval(async () => {
      try {
        const https = require("https");
        const url = `${process.env.BACKEND_URL}/api/health`;
        https.get(url, (res) => {
          logger.info(`🏓 Keep-alive ping → ${url} [${res.statusCode}]`);
        }).on("error", (err) => {
          logger.warn(`⚠️  Keep-alive ping failed: ${err.message}`);
        });
      } catch (err) {
        logger.warn(`⚠️  Keep-alive ping error: ${err.message}`);
      }
    }, PING_INTERVAL_MS);
    logger.info("⏰ Keep-alive self-ping scheduled every 14 minutes");
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("❌ UNHANDLED REJECTION! [FATAL] Shutting down...");
  logger.error(`Error Name: ${err.name}`);
  logger.error(`Error Message: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
  logger.info("🛑 SIGINT RECEIVED. Shutting down gracefully");

  if (server) {
    server.close(async () => {
      try {
        await closeConnections();
        logger.info("✅ Process terminated!");
        process.exit(0);
      } catch (error) {
        logger.error("❌ Error during graceful shutdown:", error);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
});

// Handle SIGTERM
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM RECEIVED. Shutting down gracefully");

  const shutdown = async () => {
    try {
      await closeConnections();
      logger.info("✅ Process terminated!");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  };

  if (server) {
    server.close(shutdown);
    return;
  }

  await shutdown();
});

module.exports = app;
