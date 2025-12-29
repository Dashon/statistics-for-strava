import { db } from "../src/db";
import { activityStream, activity } from "../src/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function checkData() {
  console.log("--- Activity Stream Check ---");
  const streams = await db.select({
    activityId: activityStream.activityId,
    hasHeartRate: sql<boolean>`heartrate IS NOT NULL`,
    hasDistance: sql<boolean>`distance IS NOT NULL`
  })
  .from(activityStream)
  .orderBy(desc(activityStream.updatedAt))
  .limit(5);

  console.log("\n--- List of Recent Activities ---");
  const rawList = await db.select({
    id: activity.activityId,
    name: activity.name,
    userId: activity.userId,
    data: activity.data
  })
  .from(activity)
  .orderBy(desc(activity.startDateTime))
  .limit(20);

  const list = rawList.map((a: any) => {
    const data = a.data;
    return {
        id: a.id,
        name: a.name,
        userId: a.userId,
        segments: data.segment_efforts?.length || 0,
        splits: data.splits_metric?.length || 0,
        keys: data ? Object.keys(data).length : 0
    };
  });
  console.table(list);

  process.exit(0);
}

checkData().catch(err => {
  console.error(err);
  process.exit(1);
});
