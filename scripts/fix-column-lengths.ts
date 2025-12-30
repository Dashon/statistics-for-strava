
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("Running manual migration to increase column lengths...");
  
  if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not found in .env.local");
      process.exit(1);
  }

  // Dynamically import db after env vars are loaded
  const { db } = await import("../src/db");
  const { sql } = await import("drizzle-orm");

  try {
    await db.execute(sql`
      ALTER TABLE "activity" ALTER COLUMN "ai_thumbnail_url" TYPE text;
      ALTER TABLE "activity" ALTER COLUMN "ai_video_url" TYPE text;
    `);
    console.log("Migration successful: Columns converted to text");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

main();
