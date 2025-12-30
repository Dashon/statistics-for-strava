-- Migration: Add Training Director Tables
-- Run this migration manually if drizzle-kit push fails

-- Daily Metrics - Normalized data from various wearables
CREATE TABLE IF NOT EXISTS daily_metrics (
    id VARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    source VARCHAR(50),
    resting_heart_rate INTEGER,
    heart_rate_variability INTEGER,
    sleep_duration_seconds INTEGER,
    sleep_quality_score INTEGER,
    step_count INTEGER,
    floors_climbed INTEGER,
    calories_burned INTEGER,
    raw JSONB,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS daily_metrics_user_date_unique ON daily_metrics(user_id, date);

-- Athlete Readiness - AI-Computed scores
CREATE TABLE IF NOT EXISTS athlete_readiness (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    readiness_score INTEGER,
    injury_risk VARCHAR(50),
    summary TEXT,
    recommendation TEXT,
    generated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS athlete_readiness_user_date ON athlete_readiness(user_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS athlete_readiness_user_date_unique ON athlete_readiness(user_id, date);

-- Training Chat - Interactive history with the Training Director
CREATE TABLE IF NOT EXISTS training_chat (
    message_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tool_used VARCHAR(100),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS training_chat_user_id ON training_chat(user_id);
CREATE INDEX IF NOT EXISTS training_chat_created_at ON training_chat(created_at);

-- Generated Social Content - Tracking assets created for sharing
CREATE TABLE IF NOT EXISTS social_content (
    content_id VARCHAR(255) PRIMARY KEY,
    activity_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    generated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS social_content_activity_id ON social_content(activity_id);
