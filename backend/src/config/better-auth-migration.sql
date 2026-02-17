-- =====================================================
-- Better Auth Migration - Add Required Tables
-- Creates session, account, and verification tables for Better Auth
-- =====================================================

-- Session Table (required by Better Auth for session management)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id);

-- Account Table (required by Better Auth for OAuth and password auth)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT, -- For email/password authentication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id);

-- Verification Table (for email verification tokens)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on identifier for better query performance
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

COMMENT ON TABLE session IS 'Better Auth sessions table';
COMMENT ON TABLE account IS 'Better Auth accounts table for OAuth and password auth';
COMMENT ON TABLE verification IS 'Better Auth verification tokens table';
