const { Pool } = require("pg");
const logger = require("../utils/logger");

// PostgreSQL connection pool configuration
const poolConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: parseInt(process.env.POSTGRES_MAX_POOL, 10) || 20,
  min: parseInt(process.env.POSTGRES_MIN_POOL, 10) || 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Create connection pool
const pool = new Pool(poolConfig);

// Connection event handlers
pool.on("connect", (client) => {
  logger.info("✅ PostgreSQL client connected to pool");
});

pool.on("error", (err, client) => {
  logger.error("❌ Unexpected error on idle PostgreSQL client:", err);
});

pool.on("remove", (client) => {
  logger.info("📤 PostgreSQL client removed from pool");
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
      !process.env.POSTGRES_USER ||
      !process.env.POSTGRES_PASSWORD ||
      !process.env.POSTGRES_DB
    ) {
      throw new Error(
        "PostgreSQL credentials not defined in environment variables"
      );
    }

    // Test connection
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    logger.info("✅ PostgreSQL Connected Successfully");
    logger.info(`📊 Database: ${process.env.POSTGRES_DB}`);
    logger.info(`🕐 Server Time: ${result.rows[0].now}`);

    return pool;
  } catch (error) {
    logger.error("❌ PostgreSQL connection failed:", error.message);
    logger.error("Stack:", error.stack);
    throw error;
  }
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
      logger.debug("Executed query", { text, duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    logger.error("Query error:", { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>} Database client
 */
const getClient = async () => {
  return await pool.connect();
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
