-- Migration: 002_influencer_profile
-- Description: Add tables for influencer public profiles, live events, chat, and broadcast archives

-- Public Profile - Public-facing athlete settings
CREATE TABLE IF NOT EXISTS public_profile (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    display_name VARCHAR(255),
    tagline TEXT,
    cover_image_url TEXT,
    social_links JSONB,
    featured_activity_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS public_profile_username ON public_profile(username);

-- Live Event - Scheduled/active events
CREATE TABLE IF NOT EXISTS live_event (
    event_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled',
    scheduled_start TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    stream_url TEXT,
    thumbnail_url TEXT,
    linked_activity_id VARCHAR(255),
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS live_event_user_status ON live_event(user_id, status);
CREATE INDEX IF NOT EXISTS live_event_scheduled ON live_event(scheduled_start);

-- Event Chat - Real-time chat messages
CREATE TABLE IF NOT EXISTS event_chat (
    message_id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_avatar VARCHAR(512),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS event_chat_event_created ON event_chat(event_id, created_at);

-- Broadcast Archive - Past event recordings
CREATE TABLE IF NOT EXISTS broadcast_archive (
    archive_id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    view_count INTEGER DEFAULT 0,
    linked_activity_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS broadcast_archive_user ON broadcast_archive(user_id);

-- Enable Supabase Realtime for event_chat table
ALTER PUBLICATION supabase_realtime ADD TABLE event_chat;
