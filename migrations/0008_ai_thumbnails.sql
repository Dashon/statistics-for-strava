-- Add AI thumbnail fields to activity table
ALTER TABLE activity
ADD COLUMN IF NOT EXISTS ai_thumbnail_url VARCHAR(512),
ADD COLUMN IF NOT EXISTS ai_thumbnail_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_thumbnail_generated_at TIMESTAMP;

-- Add thumbnail status to generation_status table
ALTER TABLE generation_status
ADD COLUMN IF NOT EXISTS thumbnail_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS thumbnail_error TEXT;

-- Create user_reference_images table for AI thumbnail generation
CREATE TABLE IF NOT EXISTS user_reference_images (
    image_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(512) NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_reference_images_user_id ON user_reference_images(user_id);

-- Add comments for documentation
COMMENT ON COLUMN activity.ai_thumbnail_url IS 'URL to AI-generated thumbnail showing the athlete at the activity location';
COMMENT ON COLUMN activity.ai_thumbnail_prompt IS 'Prompt used to generate the AI thumbnail';
COMMENT ON TABLE user_reference_images IS 'Reference photos of users for AI thumbnail generation';
