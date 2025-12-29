-- CRITICAL SECURITY FIX: Add userId to activity table
-- This ensures users only see their own activities

ALTER TABLE activity ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity(user_id);

-- IMPORTANT: You need to populate user_id for existing activities
-- This can be done by matching activityId from Strava API with userId
-- For now, this migration just adds the column
