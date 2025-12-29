-- Expanded profile identity fields to athlete_profile
-- Synced from Strava during login
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_first_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_last_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_profile_picture VARCHAR(512);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_bio TEXT;
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_weight DOUBLE PRECISION;
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_height INTEGER;
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_city VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_state VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_country VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS sex VARCHAR(50);

-- User override fields (nullable - when null, use Strava values)
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS custom_profile_picture VARCHAR(512);
ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS bio TEXT;
