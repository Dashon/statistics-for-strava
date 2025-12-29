import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(databaseUrl);
const db = drizzle(client);

async function main() {
  console.log("Creating activity_stream table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "activity_stream" (
        "activity_id" varchar(255) PRIMARY KEY NOT NULL,
        "time" json,
        "distance" json,
        "latlng" json,
        "altitude" json,
        "velocity_smooth" json,
        "heartrate" json,
        "cadence" json,
        "watts" json,
        "temp" json,
        "moving" json,
        "grade_smooth" json,
        "updated_at" timestamp NOT NULL
      );
    `);
    console.log("activity_stream table created successfully!");
  } catch (error) {
    console.error("Failed to create activity_stream table:", error);
  } finally {
    await client.end();
  }
}

main();
