/**
 * Better Auth PostgreSQL Migration Script
 * Creates required tables for Better Auth integration
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../src/config/postgres');
const logger = require('../src/utils/logger');

async function runBetterAuthMigration() {
  logger.info('=====================================');
  logger.info('🔄 Running Better Auth Migration');
  logger.info('=====================================');

  try {
    // Read SQL migration file
    const sqlPath = path.join(__dirname, '../src/config/better-auth-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    logger.info('📄 Executing migration SQL...');

    // Execute migration
    await query(sql);

    logger.info('✅ Better Auth migration completed successfully');
    logger.info('');
    logger.info('📊 Created tables:');
    logger.info('   - session (for Better Auth sessions)');
    logger.info('   - account (for OAuth and password auth)');
    logger.info('   - verification (for email verification)');
    logger.info('');
    logger.info('🔧 Modified tables:');
    logger.info('   - users (added password column synced with password_hash)');
    logger.info('=====================================');

  } catch (error) {
    logger.error('❌ Better Auth migration failed:', error);
    throw error;
  } finally {
    await closePool();
    logger.info('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  runBetterAuthMigration()
    .then(() => {
      logger.info('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runBetterAuthMigration };
