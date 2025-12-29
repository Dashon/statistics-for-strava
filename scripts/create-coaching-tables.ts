/**
 * Manual migration script to create coaching insights tables
 * Run with: npx tsx scripts/create-coaching-tables.ts
 */

import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

console.log("DATABASE_URL configured:", process.env.DATABASE_URL?.substring(0, 30) + "...");

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function createTables() {
  console.log("Creating coaching_insights table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS coaching_insights (
      activity_id varchar(255) PRIMARY KEY NOT NULL,
      run_classification varchar(255),
      heart_rate_analysis text,
      pacing_analysis text,
      effort_analysis text,
      performance_implications text,
      recommendations text,
      insight_text text NOT NULL,
      edited_text text,
      generated_at bigint NOT NULL,
      edited_at bigint,
      share_token varchar(255),
      is_public boolean DEFAULT false
    )
  `);

  console.log("✓ coaching_insights table created");

  console.log("Creating training_load table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS training_load (
      date date PRIMARY KEY NOT NULL,
      trimp double precision,
      tss double precision,
      atl double precision,
      ctl double precision,
      tsb double precision,
      monotony double precision,
      strain double precision,
      acute_chronic_ratio double precision,
      updated_at timestamp NOT NULL
    )
  `);

  console.log("✓ training_load table created");

  console.log("Creating activitybesteffort table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activitybesteffort (
      activityid varchar(255) NOT NULL,
      distanceinmeter integer NOT NULL,
      sporttype varchar(255) NOT NULL,
      timeinseconds integer NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS activitybesteffort_pk
    ON activitybesteffort (activityid, distanceinmeter)
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS activitybesteffort_sporttype
    ON activitybesteffort (sporttype)
  `);

  console.log("✓ activitybesteffort table and indexes created");

  console.log("\nAll tables created successfully! 🎉");
}

createTables()
  .then(() => {
    console.log("\nMigration completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
