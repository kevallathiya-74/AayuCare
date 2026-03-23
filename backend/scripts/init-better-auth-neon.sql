-- =============================================================================
-- Better Auth Schema Migration for Neon PostgreSQL
-- Creates all required tables for Better Auth to work properly
-- =============================================================================

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
-- This allows existing users seeded via seedDatabase.js to log in via Better Auth
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

COMMENT ON TABLE account IS 'Better Auth accounts (credential/OAuth)';
COMMENT ON TABLE session IS 'Better Auth login sessions';
COMMENT ON TABLE verification IS 'Better Auth email/phone verification tokens';
