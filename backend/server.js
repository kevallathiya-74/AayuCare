// =============================================================================
// CRITICAL: Load environment variables FIRST before any other imports
// =============================================================================
require("dotenv").config();

// =============================================================================
// DNS FIX: Resolve MongoDB SRV connection issues on Windows
// =============================================================================
const dns = require("dns");
const logger = require("./src/utils/logger");

// CRITICAL: Override localhost DNS with public DNS servers (Google DNS)
// This fixes the 127.0.0.1 DNS issue that prevents SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

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
const { initAuth, getAuth } = require("./src/lib/auth");
const { toNodeHandler } = require("better-auth/node");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const medicalRecordRoutes = require("./src/routes/medicalRecordRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const prescriptionRoutes = require("./src/routes/prescriptionRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

const app = express();

// Must be set BEFORE rate limiter to correctly identify client IPs
app.set("trust proxy", 1);

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
app.use(helmet());

// CORS - Whitelist specific origins
const allowedOrigins = [
  "exp://192.168.137.1:8081", // Expo Go (update with your IP)
  "http://localhost:19006", // Expo web
  "http://localhost:3000", // Development frontend
  process.env.FRONTEND_URL, // Production frontend
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // In production with mobile apps, allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }
      // Allow all origins in development
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      // In production, check whitelist
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

// Rate limiting - General API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 500 : 100, // Higher limit in dev
  message: "Too many requests from this IP, please try again later",
  skip: (req) => {
    // Skip rate limiting for authenticated admin users in development
    if (process.env.NODE_ENV === "development") {
      return (
        req.path.startsWith("/api/admin") ||
        req.path.startsWith("/api/notifications")
      );
    }
    return false;
  },
});
app.use("/api/", limiter);

// Strict rate limiting for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true, // Don't count successful logins
});
app.use("/api/auth/sign-in", authLimiter);
app.use("/api/auth/sign-up", authLimiter);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Better Auth Handler - MUST come BEFORE custom routes
app.all("/api/auth/*", (req, res, next) => {
  try {
    const auth = getAuth();
    return toNodeHandler(auth)(req, res, next);
  } catch (error) {
    logger.error("Better Auth handler error:", error);
    return res
      .status(500)
      .json({ error: "Authentication service unavailable" });
  }
});

// Body parser - MUST come AFTER Better Auth but BEFORE custom routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize request data to prevent MongoDB operator injection ($gt, $where, etc.)
// Strips keys that begin with '$' or contain '.' from req.body, req.params, and req.query
app.use(mongoSanitize({ replaceWith: '_' }));

// Disable ETags to prevent 304 Not Modified responses (causes frontend cache issues)
app.set('etag', false);

// API Routes (custom routes that extend Better Auth)
// Mount custom auth endpoints on /api/user to avoid conflict with Better Auth's /api/auth/*
app.use("/api/user", authRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

// API Root route
app.get("/api", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to AayuCare API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      appointments: "/api/appointments",
      doctors: "/api/doctors",
      medicalRecords: "/api/medical-records",
    },
  });
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

  res.json({
    status: "success",
    message: "AayuCare Backend Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databases: {
      mongodb: mongoStatus,
      postgresql: postgresStatus,
      redis: redisStatus,
    },
    betterAuth: betterAuthStatus,
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to AayuCare API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// 404 handler
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

function startServer() {
  server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
    logger.info(`🌐 API URL: http://localhost:${PORT}`);
    logger.info(`📱 Expo Go will auto-detect your computer's IP address`);
    logger.info(`ℹ️  Make sure phone and computer are on the same WiFi network`);
  });
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
        await mongoose.connection.close();
        logger.info("✅ MongoDB connection closed");
        await closePool();
        logger.info("✅ PostgreSQL connection closed");
        await closeRedis();
        logger.info("✅ Redis connection closed");
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

  server.close(async () => {
    try {
      // Close database connections
      await mongoose.connection.close();
      logger.info("✅ MongoDB connection closed");

      await closePool();
      logger.info("✅ PostgreSQL connection closed");

      await closeRedis();
      logger.info("✅ Redis connection closed");

      logger.info("✅ Process terminated!");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  });
});

module.exports = app;
