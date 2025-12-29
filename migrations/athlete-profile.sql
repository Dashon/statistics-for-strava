-- Create athlete_profile table
CREATE TABLE IF NOT EXISTS athlete_profile (
    user_id VARCHAR(255) PRIMARY KEY,
    max_heart_rate INTEGER,
    resting_heart_rate INTEGER,
    functional_threshold_power INTEGER,
    weight DOUBLE PRECISION,
    height_in_cm INTEGER,
    date_of_birth DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_athlete_profile_user_id ON athlete_profile(user_id);
