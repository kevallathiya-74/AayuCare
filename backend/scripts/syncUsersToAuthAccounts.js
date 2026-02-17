/**
 * Sync Existing Users to Better Auth Account System
 * Creates account records for existing users with email/password authentication
 */

require('dotenv').config();
const { query, closePool } = require('../src/config/postgres');
const logger = require('../src/utils/logger');

async function syncUsersToAuthAccounts() {
  logger.info('=====================================');
  logger.info('🔄 Syncing Users to Better Auth Accounts');
  logger.info('=====================================');

  try {
    // Get all users with password_hash
    const usersResult = await query(
      'SELECT id, email, password_hash FROM users WHERE password_hash IS NOT NULL'
    );

    const users = usersResult.rows;
    logger.info(`📊 Found ${users.length} users to sync`);

    let synced = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if account already exists
      const existingAccount = await query(
        'SELECT id FROM account WHERE user_id = $1 AND provider_id = $2',
        [user.id, 'credential']
      );

      if (existingAccount.rows.length > 0) {
        logger.info(`⏭️  Skipping ${user.email} (already has account)`);
        skipped++;
        continue;
      }

      // Create account record for email/password auth
      // Better Auth uses 'credential' as provider_id for email/password
      const accountId = `${user.id}_credential`;
      
      await query(
        `INSERT INTO account (
          id, account_id, provider_id, user_id, password, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          accountId,           // id
          user.email,         // account_id (email for credential provider)
          'credential',       // provider_id (Better Auth uses 'credential' for email/password)
          user.id,            // user_id
          user.password_hash  // password (hashed)
        ]
      );

      logger.info(`✅ Synced ${user.email}`);
      synced++;
    }

    logger.info('');
    logger.info('=====================================');
    logger.info('✅ User Sync Completed');
    logger.info('=====================================');
    logger.info(`📊 Summary:`);
    logger.info(`   Synced:  ${synced} users`);
    logger.info(`   Skipped: ${skipped} users`);
    logger.info('=====================================');

  } catch (error) {
    logger.error('❌ User sync failed:', error);
    throw error;
  } finally {
    await closePool();
    logger.info('🔌 Database connection closed');
  }
}

// Run sync
if (require.main === module) {
  syncUsersToAuthAccounts()
    .then(() => {
      logger.info('✅ Sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncUsersToAuthAccounts };
