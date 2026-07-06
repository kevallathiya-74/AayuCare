const { Pool } = require("pg");
const path = require("path");
const logger = require("../utils/logger");

const normalizeDatabaseUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const sslmode = (parsed.searchParams.get("sslmode") || "").toLowerCase();
    const hasCompat = parsed.searchParams.has("uselibpqcompat");

    if (sslmode && ["prefer", "require", "verify-ca"].includes(sslmode) && !hasCompat) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

// PostgreSQL connection pool configuration
// Supports both DATABASE_URL (Neon/cloud) and individual env vars (local)
const buildPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
    return {
      connectionString,
      max: parseInt(process.env.POSTGRES_MAX_POOL, 10) || 20,
      min: parseInt(process.env.POSTGRES_MIN_POOL, 10) || 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 10000,
      ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: false } } : {})
    };
  }
  return {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    max: parseInt(process.env.POSTGRES_MAX_POOL, 10) || 20,
    min: parseInt(process.env.POSTGRES_MIN_POOL, 10) || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  };
};

const poolConfig = buildPoolConfig();

// Create connection pool
const pool = new Pool(poolConfig);

// Connection event handlers
// Per-connection lifecycle logs are debug-tier; gate them so production
// logs aren't flooded with one INFO line per checkout/checkin (could be
// hundreds per minute under load). Development keeps full visibility.
if (process.env.NODE_ENV !== 'production') {
  pool.on("connect", (_client) => {
    logger.info("✅ PostgreSQL client connected to pool");
  });

  pool.on("remove", (_client) => {
    logger.info("📤 PostgreSQL client removed from pool");
  });
}

pool.on("error", (err, _client) => {
  logger.error("❌ Unexpected error on idle PostgreSQL client:", err);
});

// Log pool statistics every 60 seconds in development
if (process.env.NODE_ENV !== 'production') {
  const poolStatsInterval = setInterval(() => {
    logger.debug('📊 PostgreSQL Pool Stats:', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });
  }, 60000);

  // Do not keep one-off scripts/processes alive solely for debug logging.
  if (typeof poolStatsInterval.unref === "function") {
    poolStatsInterval.unref();
  }
}

/**
 * Initialize PostgreSQL connection and verify connectivity
 */
const connectPostgres = async () => {
  try {
    // Validate environment variables
    if (
      !process.env.DATABASE_URL &&
      (!process.env.POSTGRES_USER ||
        !process.env.POSTGRES_PASSWORD ||
        !process.env.POSTGRES_DB)
    ) {
      throw new Error(
        "PostgreSQL credentials not defined in environment variables (set DATABASE_URL or individual POSTGRES_* vars)"
      );
    }

    // Test connection
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    const dbName = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).pathname.slice(1)
      : process.env.POSTGRES_DB;
    logger.info("✅ PostgreSQL Connected Successfully");
    logger.info(`📊 Database: ${dbName}`);
    logger.info(`🕐 Server Time: ${result.rows[0].now}`);

    // Run database migrations
    await runMigrations();

    return pool;
  } catch (error) {
    logger.error("❌ PostgreSQL connection failed:", error.message);
    logger.error("Stack:", error.stack);
    throw error;
  }
};

/**
 * Run pending database migrations
 * Uses node-pg-migrate to manage schema versioning
 */
const runMigrations = async () => {
  try {
    const pgm = require("node-pg-migrate");
    const migrationsPath = path.join(__dirname, "../../migrations");

    logger.info("🔄 Running database migrations...");

    // Call node-pg-migrate properly
    const migrations = await pgm.default({
      databaseUrl: process.env.DATABASE_URL || buildConnectionString(),
      dir: migrationsPath,
      direction: "up",
      checkOrder: false,
      verbose: process.env.NODE_ENV === "development",
      migrationsTable: "pgmigrations",
    });

    if (migrations && migrations.length > 0) {
      logger.info(`✅ Applied ${migrations.length} migration(s):`);
      migrations.forEach((m) => logger.info(`   - ${m}`));
    } else {
      logger.info("✅ Database schema is up-to-date (no migrations needed)");
    }
  } catch (error) {
    const message = error?.message || String(error);
    const duplicateObjectDetected = /already exists|42P07|42P16/i.test(message);

    if (duplicateObjectDetected) {
      try {
        const pgm = require("node-pg-migrate");
        const migrationsPath = path.join(__dirname, "../../migrations");
        logger.warn(
          "⚠️ Existing schema detected while applying migrations. Marking pending migrations as applied (fake)."
        );

        const faked = await pgm.default({
          databaseUrl: process.env.DATABASE_URL || buildConnectionString(),
          dir: migrationsPath,
          direction: "up",
          fake: true,
          checkOrder: false,
          verbose: process.env.NODE_ENV === "development",
          migrationsTable: "pgmigrations",
        });

        if (faked && faked.length > 0) {
          logger.info(`✅ Faked ${faked.length} migration(s) on existing schema:`);
          faked.forEach((m) => logger.info(`   - ${m}`));
        } else {
          logger.info("✅ Existing schema migration state already aligned");
        }
        return;
      } catch (fakeError) {
        logger.error(
          "❌ Failed to fake migrations after detecting existing schema:",
          fakeError?.message || String(fakeError)
        );
      }
    }

    logger.error("❌ Database migration failed:", message);
    // In production, fail fast if migrations fail
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Migration failure: ${message}`);
    }
    // In development, log but continue (allows for manual fixes)
    logger.warn("⚠️  Continuing despite migration error (development mode)");
  }
};

/**
 * Build connection string from environment variables
 */
const buildConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB}`;
};

/**
 * Execute a query with automatic connection handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      // Omit query text from logs to avoid leaking schema/data
      logger.debug("Executed query", { duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    // Do NOT log query text — it may reveal schema/data to log aggregators
    logger.error("Query error:", { error: error.message, code: error.code });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>} Database client
 */
const getClient = async () => {
  return pool.connect();
};

/**
 * Graceful shutdown
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info("✅ PostgreSQL pool closed gracefully");
  } catch (error) {
    logger.error("❌ Error closing PostgreSQL pool:", error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  connectPostgres,
  closePool,
};
