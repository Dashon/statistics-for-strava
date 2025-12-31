-- Add cinematic profile fields to public_profile table
-- Migration: 004_cinematic_profile.sql

ALTER TABLE public_profile 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'runner',
ADD COLUMN IF NOT EXISTS accolades JSONB,
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT FALSE;

-- Add index for template filtering (optional, for admin queries)
CREATE INDEX IF NOT EXISTS public_profile_template ON public_profile(template_id);
