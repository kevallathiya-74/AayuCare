/**
 * Better Auth Schema Migration for Neon
 * Run this to set up Better Auth tables in production Neon database
 * 
 * Usage: node scripts/migrate-better-auth-neon.js
 */

require("dotenv").config();
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migration = `
-- Drop malformed account table if it exists (has duplicate columns)
DROP TABLE IF EXISTS account CASCADE;

-- Create Better Auth 'account' table (OAuth providers, password auth)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Better Auth 'session' table (login sessions)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create Better Auth 'verification' table (email/phone verification)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Better Auth tables
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_account_provider ON account(provider_id, account_id);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

-- Sync existing users' passwords to Better Auth 'account' table
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT 
    'credential:' || u.id::TEXT,
    u.email,
    'credential',
    u.id,
    u.password_hash,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.password_hash IS NOT NULL
ON CONFLICT (id) DO NOTHING;
`;

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log("🔧 Connecting to Neon database...");
    
    await client.query("BEGIN");
    
    console.log("📝 Running Better Auth schema migration...");
    await client.query(migration);
    
    await client.query("COMMIT");
    
    console.log("✅ Migration completed successfully!");
    
    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('account', 'session', 'verification')
      ORDER BY table_name
    `);
    
    console.log("\n📊 Better Auth tables:");
    result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    
    // Count account records
    const accountCount = await client.query("SELECT COUNT(*) FROM account");
    console.log(`\n🔑 Synced ${accountCount.rows[0].count} user passwords to Better Auth`);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
