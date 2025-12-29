-- Create coaching_insights table for AI-generated performance analysis
CREATE TABLE IF NOT EXISTS coaching_insights (
    activity_id VARCHAR(255) PRIMARY KEY REFERENCES activity(activityid) ON DELETE CASCADE,

    -- Structured insight data
    run_classification VARCHAR(255),
    heart_rate_analysis JSON,
    pacing_analysis JSON,
    performance_implications TEXT,
    recommendations JSON,

    -- Full AI-generated text
    insight_text TEXT NOT NULL,
    edited_text TEXT,

    -- Metadata
    generated_at BIGINT NOT NULL,
    edited_at BIGINT,
    share_token VARCHAR(255) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE
);

-- Index for querying public insights
CREATE INDEX IF NOT EXISTS idx_coaching_insights_public ON coaching_insights(is_public) WHERE is_public = TRUE;

-- Index for share tokens
CREATE INDEX IF NOT EXISTS idx_coaching_insights_share_token ON coaching_insights(share_token) WHERE share_token IS NOT NULL;
