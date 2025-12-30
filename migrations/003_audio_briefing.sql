
-- Migration: Add Audio URL to Athlete Readiness
ALTER TABLE athlete_readiness ADD COLUMN IF NOT EXISTS audio_url TEXT;
