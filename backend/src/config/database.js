const mongoose = require("mongoose");
const dns = require("dns");
const logger = require("../utils/logger");
const {
  resolveMongoUriWithFallback,
  applyDnsServersFromEnv,
} = require("../utils/mongoUriResolver");

// Use Google DNS to resolve SRV records (fixes networks where local DNS blocks SRV queries)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

/**
 * MongoDB Atlas Connection Module
 *
 * Handles connection to MongoDB Atlas with:
 * - SRV DNS resolution
 * - Comprehensive error handling
 * - Connection pooling
 * - Automatic reconnection
 * - Detailed logging
 */

const connectDB = async () => {
  try {
    applyDnsServersFromEnv();

    // =============================================================================
    // STEP 1: Validate Environment Variable
    // =============================================================================
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "❌ MONGODB_URI is not defined in environment variables. Check .env file."
      );
    }

    const defaultDbName = process.env.MONGODB_DB || "aayucare_db";
    let mongoURI = process.env.MONGODB_URI;

    // If URI has no database segment, append one so connection behavior is explicit.
    const uriHasDbName = /\/[^/?]+(?:\?|$)/.test(mongoURI);
    if (!uriHasDbName) {
      const hasQuery = mongoURI.includes("?");
      mongoURI = hasQuery
        ? mongoURI.replace("?", `/${defaultDbName}?`)
        : `${mongoURI}/${defaultDbName}`;
      logger.info(`ℹ️  MongoDB database not provided in URI; using default "${defaultDbName}"`);
    }

    // Extract and validate database name from URI (supports both local and Atlas)
    const dbNameMatch = mongoURI.match(/\/([^/?]+)(?:\?|$)/);
    const dbName = dbNameMatch ? dbNameMatch[1] : "unknown";

    if (dbName === "unknown" || !dbName || dbName === mongoURI.split("//")[1]?.split(":")[0]) {
      logger.warn(
        "⚠️  WARNING: No database name specified in URI. Connection may fail."
      );
    }

    // =============================================================================
    // STEP 3: Connection Options (Production-Ready)
    // =============================================================================
    const options = {
      // Connection Pool
      maxPoolSize: 10,
      minPoolSize: 5,

      // Timeouts
      serverSelectionTimeoutMS: 30000, // 30 seconds for Atlas (critical for SRV)
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,

      // Network
      family: 4, // Force IPv4 (fixes Windows DNS issues)

      // Replica Set
      directConnection: false,

      // Write Concern (already in URI but can be enforced here)
      retryWrites: true,
      w: "majority",

      // Additional options
      autoIndex: process.env.NODE_ENV === "development", // Only in dev
      autoCreate: process.env.NODE_ENV === "development",
    };

    // Connection options configured

    // =============================================================================
    // STEP 4: Establish Connection
    // =============================================================================
    const startTime = Date.now();
    let conn;
    try {
      conn = await mongoose.connect(mongoURI, options);
    } catch (primaryError) {
      if (
        mongoURI.startsWith("mongodb+srv://") &&
        (primaryError.message.includes("querySrv") ||
          primaryError.message.includes("ECONNREFUSED") ||
          primaryError.message.includes("ENOTFOUND"))
      ) {
        logger.warn("Mongo SRV DNS failed, attempting DoH fallback URI resolution...");
        const fallback = await resolveMongoUriWithFallback(mongoURI, defaultDbName);
        conn = await mongoose.connect(fallback.uri, options);
        if (fallback.usedFallback) {
          logger.info(
            `Mongo connected via fallback hosts: ${(fallback.hosts || []).join(", ")}`
          );
        }
      } else {
        throw primaryError;
      }
    }
    const connectionTime = Date.now() - startTime;

    // =============================================================================
    // STEP 5: Connection Success
    // =============================================================================
    logger.info(
      `✅ MongoDB Connected: ${conn.connection.name}@${conn.connection.host}`
    );

    // =============================================================================
    // STEP 6: Connection Event Handlers
    // =============================================================================
    mongoose.connection.on("error", (err) => {
      logger.error(`❌ MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn(
        "⚠️  MongoDB disconnected. Attempting automatic reconnection..."
      );
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("✅ MongoDB reconnected successfully");
    });

    mongoose.connection.on("reconnectFailed", () => {
      logger.error("❌ MongoDB reconnection failed after multiple attempts");
    });

    // Connection established successfully

    return conn;
  } catch (error) {
    // =============================================================================
    // STEP 7: Enhanced Error Handling
    // =============================================================================
    logger.error(`❌ MongoDB Connection Failed`);
    logger.error(`   Error: ${error.message}`);
    logger.error(`   Error Code: ${error.code || "N/A"}`);
    logger.error(`   Error Name: ${error.name}`);

    // Specific error guidance
    if (error.message.includes("ECONNREFUSED")) {
      logger.error("\n🔍 Troubleshooting ECONNREFUSED:");
      logger.error("   1. Check if cluster is running in MongoDB Atlas");
      logger.error("   2. Verify IP whitelist (0.0.0.0/0 for testing)");
      logger.error(
        "   3. Ensure DNS resolution works (nslookup _mongodb._tcp.aayucare.rrixvne.mongodb.net)"
      );
      logger.error("   4. Try using standard connection string instead of SRV");
    } else if (error.message.includes("authentication")) {
      logger.error("\n🔍 Authentication Error:");
      logger.error("   1. Verify username and password in .env");
      logger.error("   2. Check database user has proper permissions");
      logger.error(
        "   3. Ensure password doesn't contain special characters that need URL encoding"
      );
    } else if (
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("querySrv")
    ) {
      logger.error("\n🔍 DNS/Timeout Error:");
      logger.error("   1. Check network/firewall settings");
      logger.error("   2. Verify DNS servers (try 8.8.8.8, 8.8.4.4)");
      logger.error("   3. Ensure database name is included in URI");
      logger.error("   4. Try standard connection string");
    }

    logger.warn("\n⚠️  Server will continue without MongoDB.");
    logger.warn(
      "   Medical records, prescriptions, and Better Auth will not work.\n"
    );

    // Don't crash the server - allow it to run with PostgreSQL/Redis only
    // This enables gradual debugging
  }
};

module.exports = connectDB;
