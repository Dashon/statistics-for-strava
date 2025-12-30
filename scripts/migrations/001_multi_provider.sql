-- Multi-Provider Support Migration
-- Adds provider_connection table and updates activity/user tables

-- 1. Add provider column to activity table
ALTER TABLE activity ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'strava';
ALTER TABLE activity ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- 2. Add apiKey column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS api_key VARCHAR(64);

-- 3. Create provider_connection table
CREATE TABLE IF NOT EXISTS provider_connection (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    external_user_id VARCHAR(255),
    scopes TEXT,
    metadata JSONB,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 4. Create index on provider_connection
CREATE INDEX IF NOT EXISTS provider_connection_user_provider 
ON provider_connection(user_id, provider);

-- 5. Create unique constraint (user can only have one connection per provider)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'provider_connection_user_provider_unique'
    ) THEN
        ALTER TABLE provider_connection 
        ADD CONSTRAINT provider_connection_user_provider_unique 
        UNIQUE (user_id, provider);
    END IF;
END $$;
