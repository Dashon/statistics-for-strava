-- Add missing location column to activity table
ALTER TABLE activity ADD COLUMN IF NOT EXISTS location TEXT;
