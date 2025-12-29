"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { user, activity, gear, activityStream } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchStravaActivities, fetchStravaAthlete, fetchStravaActivityDetail, fetchStravaActivityStreams } from "@/lib/strava";

export async function syncActivities() {
  const session = (await auth()) as any;
  if (!session) throw new Error("Unauthorized");

  const athlete = await db.query.user.findFirst({
    where: eq(user.userId, session.userId),
  });

  if (!athlete) throw new Error("User not found");

  // 1. Sync Gear Info
  try {
    const stravaAthlete = await fetchStravaAthlete(athlete.stravaAccessToken);
    const allGear = [...(stravaAthlete.shoes || []), ...(stravaAthlete.bikes || [])];
    
    for (const g of allGear) {
      const gearData = {
        gearId: g.id,
        name: g.name,
        type: g.brand_name || (g.id.startsWith('s') ? 'Shoes' : 'Bike'),
        distanceInMeter: Math.floor(g.distance),
        isRetired: !!g.retired,
        data: g,
        createdOn: new Date().toISOString(),
      };
      
      await db.insert(gear).values(gearData).onConflictDoUpdate({
        target: gear.gearId,
        set: gearData
      });
    }
  } catch (err) {
    console.error("Failed to sync gear:", err);
  }

  // 2. Trigger Background Full Sync
  try {
    const { tasks } = await import("@trigger.dev/sdk");
    await tasks.trigger("sync-strava-history", { userId: session.userId });
    return { success: true, background: true };
  } catch (err) {
    console.error("Failed to trigger background sync:", err);
    return { success: false, error: "Sync failed to start" };
  }
}

export async function syncActivityStreams(activityId: string) {
  const session = (await auth()) as any;
  if (!session) throw new Error("Unauthorized");

  const athlete = await db.query.user.findFirst({
    where: eq(user.userId, session.userId),
  });

  if (!athlete) throw new Error("User not found");

  try {
    const streams = await fetchStravaActivityStreams(athlete.stravaAccessToken, activityId);
    if (streams) {
      const streamData = {
        activityId,
        time: streams.time?.data || null,
        distance: streams.distance?.data || null,
        latlng: streams.latlng?.data || null,
        altitude: streams.altitude?.data || null,
        velocitySmooth: streams.velocity_smooth?.data || null,
        heartrate: streams.heartrate?.data || null,
        cadence: streams.cadence?.data || null,
        watts: streams.watts?.data || null,
        temp: streams.temp?.data || null,
        moving: streams.moving?.data || null,
        gradeSmooth: streams.grade_smooth?.data || null,
        updatedAt: new Date().toISOString(),
      };

      await db.insert(activityStream).values(streamData).onConflictDoUpdate({
        target: activityStream.activityId,
        set: streamData
      });

      // Also update the flag in the activity table
      await db.update(activity)
        .set({ streamsAreImported: true })
        .where(eq(activity.activityId, activityId));

      return { success: true };
    }
  } catch (err) {
    console.error(`Failed to sync streams for ${activityId}:`, err);
    return { success: false, error: (err as Error).message };
  }

  return { success: false, error: "No streams found" };
}
