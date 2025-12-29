-- Add Strava profile identity fields to athlete_profile
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_first_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_last_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_profile_picture VARCHAR(512);

-- User override fields (nullable - when null, use Strava values)
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS custom_profile_picture VARCHAR(512);
