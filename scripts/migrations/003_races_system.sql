-- Migration: 003_races_system.sql
-- Adds races table for upcoming events and race fields to activities

-- 1. Create races table for upcoming/planned races
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance INTEGER, -- meters
  distance_class VARCHAR(50), -- '5k', '10k', 'half', 'marathon', 'ultra', 'other'
  location VARCHAR(255),
  goal_time INTEGER, -- seconds
  priority VARCHAR(20) DEFAULT 'A', -- 'A' (goal race), 'B' (important), 'C' (tune-up)
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'dns', 'dnf'
  race_url TEXT, -- official race website
  course_url TEXT, -- course map URL
  bib_number VARCHAR(50),
  notes TEXT,
  linked_activity_id VARCHAR(255), -- links to activity after race completion
  result_time INTEGER, -- actual finish time in seconds
  result_placement INTEGER,
  result_age_group_placement INTEGER,
  result_gender_placement INTEGER,
  is_pr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for races table
CREATE INDEX IF NOT EXISTS idx_races_user_id ON races(user_id);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_races_user_date ON races(user_id, date);

-- 2. Add race-related fields to activity table
ALTER TABLE activity ADD COLUMN IF NOT EXISTS is_race BOOLEAN DEFAULT FALSE;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS race_name VARCHAR(255);
ALTER TABLE activity ADD COLUMN IF NOT EXISTS race_distance_class VARCHAR(50);
ALTER TABLE activity ADD COLUMN IF NOT EXISTS official_time INTEGER; -- seconds (chip time)
ALTER TABLE activity ADD COLUMN IF NOT EXISTS placement INTEGER;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS age_group_placement INTEGER;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS gender_placement INTEGER;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT FALSE;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS race_notes TEXT;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS linked_race_id UUID;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS race_detected BOOLEAN DEFAULT FALSE; -- auto-detection flag
ALTER TABLE activity ADD COLUMN IF NOT EXISTS race_detection_confidence FLOAT; -- 0-1 confidence score

-- Index for race activities
CREATE INDEX IF NOT EXISTS idx_activity_is_race ON activity(is_race) WHERE is_race = TRUE;
CREATE INDEX IF NOT EXISTS idx_activity_user_race ON activity(user_id, is_race) WHERE is_race = TRUE;

-- 3. Create activity_media table for photos/videos
CREATE TABLE IF NOT EXISTS activity_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  media_type VARCHAR(20) NOT NULL, -- 'photo', 'video', 'ai_thumbnail', 'route_video'
  storage_url TEXT NOT NULL, -- Supabase storage URL
  thumbnail_url TEXT, -- thumbnail for videos
  caption TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'upload', -- 'upload', 'strava', 'ai_generated'
  metadata JSONB, -- additional metadata (dimensions, duration, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_media_activity ON activity_media(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_media_user ON activity_media(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_media_featured ON activity_media(activity_id, is_featured);

-- 4. Add layout_config to public_profile for react-grid-layout persistence
ALTER TABLE public_profile ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{
  "modules": {
    "next_race": {"visible": true, "order": 1},
    "form_curve": {"visible": true, "order": 2, "weeks": 12},
    "race_results": {"visible": true, "order": 3, "limit": 6},
    "upcoming_races": {"visible": true, "order": 4, "limit": 5},
    "training_highlights": {"visible": true, "order": 5},
    "consistency_calendar": {"visible": true, "order": 6},
    "media_gallery": {"visible": true, "order": 7}
  },
  "privacy": {
    "show_heart_rate": true,
    "show_pace": true,
    "show_power": true
  }
}'::jsonb;

-- 5. Create standard race distances reference table
CREATE TABLE IF NOT EXISTS standard_distances (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  distance_meters INTEGER NOT NULL,
  tolerance_percent FLOAT DEFAULT 2.0
);

INSERT INTO standard_distances (name, distance_meters, tolerance_percent) VALUES
  ('1 Mile', 1609, 3.0),
  ('5K', 5000, 2.0),
  ('10K', 10000, 2.0),
  ('15K', 15000, 2.0),
  ('10 Mile', 16093, 2.0),
  ('Half Marathon', 21097, 2.0),
  ('Marathon', 42195, 1.5),
  ('50K', 50000, 3.0),
  ('50 Mile', 80467, 3.0),
  ('100K', 100000, 3.0),
  ('100 Mile', 160934, 3.0)
ON CONFLICT DO NOTHING;
