
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity' AND column_name = 'ai_video_url') THEN
        ALTER TABLE "activity" ADD COLUMN "ai_video_url" varchar(512);
    END IF;
END $$;
