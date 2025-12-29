import { db } from "../src/db";
import { user } from "../src/db/schema";
import { fetchStravaActivityDetail } from "../src/lib/strava";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function dumpActivity() {
  const u = await db.query.user.findFirst();
  if (!u) return;
  
  const activityId = "1671368938"; // Maryland Gran Fondo
  console.log(`Fetching detail for ${activityId}...`);
  const detail = await fetchStravaActivityDetail(u.stravaAccessToken, activityId);
  
  fs.writeFileSync("activity_dump.json", JSON.stringify(detail, null, 2));
  console.log("Dumped to activity_dump.json");
  console.log("Has segment_efforts:", !!detail.segment_efforts);
  console.log("Segment efforts length:", detail.segment_efforts?.length);
  
  process.exit(0);
}

dumpActivity().catch(console.error);
