
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running manual migration...");
  try {
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity' AND column_name = 'ai_video_url') THEN
              ALTER TABLE "activity" ADD COLUMN "ai_video_url" varchar(512);
              RAISE NOTICE 'Column ai_video_url added';
          ELSE
              RAISE NOTICE 'Column ai_video_url already exists';
          END IF;
      END $$;
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

main();
