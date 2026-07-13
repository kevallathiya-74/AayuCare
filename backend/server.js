// =============================================================================
// CRITICAL: Load environment variables FIRST before any other imports
// =============================================================================
require("dotenv").config();

const { APP_ENV, MIN_JWT_SECRET_LENGTH } = require("./src/config/env");
process.env.NODE_ENV = APP_ENV.nodeEnv;

// =============================================================================
// DNS FIX: Resolve SRV connection issues on Windows (dev only)
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
  "JWT_SECRET",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "FRONTEND_URL",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

// Require either DATABASE_URL or all POSTGRES_* individual vars
if (!process.env.DATABASE_URL) {
  const pgVars = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"];
  const missingPg = pgVars.filter((v) => !process.env[v]);
  if (missingPg.length > 0) {
    missingVars.push(
      "DATABASE_URL (or POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)",
    );
    missingPg.forEach((v) => missingVars.push(v));
  }
}

if (missingVars.length > 0) {
  logger.error("❌ FATAL: Missing required environment variables:");
  missingVars.forEach((varName) => logger.error(`   - ${varName}`));
  logger.error(
    "\n💡 Please check your .env file and ensure all variables are set.",
  );
  process.exit(1);
}

if (
  process.env.JWT_SECRET &&
  process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH
) {
  if (process.env.NODE_ENV === "production") {
    logger.error(
      `❌ FATAL: JWT_SECRET is too weak (${process.env.JWT_SECRET.length} chars). Must be at least ${MIN_JWT_SECRET_LENGTH} in production.`,
    );
    process.exit(1);
  } else {
    logger.warn(
      `⚠️  JWT_SECRET is shorter than ${MIN_JWT_SECRET_LENGTH} characters. This will crash in production.`,
    );
  }
}

logger.info("✅ All required environment variables validated");

const app = require("./src/app");
const { connectPostgres, closePool } = require("./src/config/postgres");
const { initAuth } = require("./src/lib/auth");

const initializeDatabases = async () => {
  try {
    await connectPostgres();

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

const PORT = process.env.PORT || 5000;
let server;

const closeConnections = async () => {
  try {
    await closePool();
    logger.info("✅ PostgreSQL connection closed");
  } catch (error) {
    logger.warn(`⚠️ PostgreSQL close warning: ${error.message}`);
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
            `⚠️ Port ${PORT} is already in use by a healthy backend instance. Exiting duplicate process.`,
          );
          await closeConnections();
          process.exit(0);
          return;
        }
      } catch {}
    }

    logger.error(`❌ Server startup error: ${error.message}`);
    await closeConnections();
    process.exit(1);
  });

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
    logger.info(`🌐 API URL: http://localhost:${PORT}`);
    logger.info(`📱 Expo Go will auto-detect your computer's IP address`);
    logger.info(
      `ℹ️  Make sure phone and computer are on the same WiFi network`,
    );
  });

  if (process.env.NODE_ENV === "production" && process.env.BACKEND_URL) {
    const PING_INTERVAL_MS = 14 * 60 * 1000;
    setInterval(async () => {
      try {
        const https = require("https");
        const url = `${process.env.BACKEND_URL}/api/health`;
        https
          .get(url, (res) => {
            logger.info(`🏓 Keep-alive ping → ${url} [${res.statusCode}]`);
          })
          .on("error", (err) => {
            logger.warn(`⚠️  Keep-alive ping failed: ${err.message}`);
          });
      } catch (err) {
        logger.warn(`⚠️  Keep-alive ping error: ${err.message}`);
      }
    }, PING_INTERVAL_MS);
    logger.info("⏰ Keep-alive self-ping scheduled every 14 minutes");
  }
}

initializeDatabases()
  .then(() => startServer())
  .catch((err) => {
    logger.error(
      "❌ Fatal: Could not initialize databases, aborting server start:",
      err,
    );
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  logger.error("❌ UNHANDLED REJECTION! [FATAL] Shutting down...");
  logger.error(`Error Name: ${err.name}`);
  logger.error(`Error Message: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});

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
