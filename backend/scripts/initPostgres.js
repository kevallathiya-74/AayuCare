const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const logger = {
  info: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

/**
 * Run PostgreSQL schema initialization
 */
async function initializeSchema() {
  let client;

  try {
    logger.info("Connecting to PostgreSQL...");
    client = await pool.connect();

    logger.info("Reading schema file...");
    const schemaPath = path.join(__dirname, "../src/config/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    logger.info("Executing schema...");
    await client.query(schema);

    logger.info("✅ PostgreSQL schema initialized successfully");
    logger.info("Created tables:");
    logger.info("  - users");
    logger.info("  - doctors");
    logger.info("  - patients");
    logger.info("  - appointments");
    logger.info("  - payments");
    logger.info("  - prescriptions");
    logger.info("  - schedules");
    logger.info("  - audit_logs");

    // Verify tables
    const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

    logger.info(`\n📊 Total tables created: ${result.rows.length}`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });
  } catch (error) {
    logger.error(`Schema initialization failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  initializeSchema()
    .then(() => {
      logger.info("\n🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("\n💥 Migration failed!");
      logger.error(error.message);
      process.exit(1);
    });
}

module.exports = { initializeSchema };
