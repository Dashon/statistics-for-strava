import 'dotenv/config';
import { db } from "../src/db";
import { publicProfile } from "../src/db/schema";

async function main() {
  const profiles = await db.select().from(publicProfile);
  console.log("Public Profiles:", JSON.stringify(profiles, null, 2));
  process.exit(0);
}

main().catch(console.error);
