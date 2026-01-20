const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/database");
const { errorHandler } = require("./src/middleware/errorHandler");
const logger = require("./src/utils/logger");
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

const app = express();

// Connect to MongoDB FIRST
connectDB().then(() => {
  // Initialize Better Auth after DB connection
  try {
    initAuth();
    logger.info("✅ Better Auth initialized");
  } catch (error) {
    logger.error("❌ Better Auth initialization failed:", error);
  }
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
  })
);

// Rate limiting - General API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// Strict rate limiting for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true, // Don't count successful logins
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

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
app.get("/api/health", (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "success",
    message: "AayuCare Backend Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: mongoStatus,
    betterAuth:
      typeof getAuth === "function" ? "initialized" : "not initialized",
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

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
  logger.info(`🌐 API URL: http://localhost:${PORT}`);
  logger.info(`📱 Expo Go will auto-detect your computer's IP address`);
  logger.info(`ℹ️  Make sure phone and computer are on the same WiFi network`);
});

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

// Handle SIGTERM
process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    logger.info("✅ Process terminated!");
  });
});

module.exports = app;
