-- Create generation_status table for tracking background AI jobs
CREATE TABLE IF NOT EXISTS generation_status (
    activity_id VARCHAR(255) PRIMARY KEY REFERENCES activity(activityid) ON DELETE CASCADE,
    letter_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    coaching_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    letter_error TEXT,
    coaching_error TEXT,
    started_at BIGINT,
    completed_at BIGINT
);

-- Index for querying pending/generating jobs
CREATE INDEX IF NOT EXISTS idx_generation_status_letter ON generation_status(letter_status) WHERE letter_status IN ('pending', 'generating');
CREATE INDEX IF NOT EXISTS idx_generation_status_coaching ON generation_status(coaching_status) WHERE coaching_status IN ('pending', 'generating');
