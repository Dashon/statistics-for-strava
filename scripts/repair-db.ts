import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

async function runMigration() {
  console.log("🚀 Starting emergency migration...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  const queries = [
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_first_name VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_last_name VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_profile_picture VARCHAR(512);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_bio TEXT;`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_weight DOUBLE PRECISION;`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_height INTEGER;`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_city VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_state VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS strava_country VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS sex VARCHAR(50);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS custom_profile_picture VARCHAR(512);`,
    `ALTER TABLE athlete_profile ADD COLUMN IF NOT EXISTS bio TEXT;`
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      await sql.unsafe(query);
    } catch (err: any) {
      console.error(`❌ Failed: ${query}`);
      console.error(err);
    }
  }

  await sql.end();
  console.log("✅ Migration attempt finished.");
  process.exit(0);
}

runMigration();
