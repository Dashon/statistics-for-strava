"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { user, activity, gear } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchStravaActivities, fetchStravaAthlete, fetchStravaActivityDetail } from "@/lib/strava";

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

  // 2. Fetch Activities
  const activities = await fetchStravaActivities(athlete.stravaAccessToken);

  // 3. Process Activities
  // To avoid hitting rate limits, we only fetch full details for the 5 most recent activities
  // as summary activities (from the list) often lack description, calories, etc.
  for (let i = 0; i < activities.length; i++) {
    let act = activities[i];
    
    // Deep sync the most recent 5
    if (i < 5) {
      try {
        const detail = await fetchStravaActivityDetail(athlete.stravaAccessToken, act.id.toString());
        act = { ...act, ...detail };
      } catch (err) {
        console.error(`Failed to fetch detail for activity ${act.id}:`, err);
      }
    }

    const activityData = {
      activityId: act.id.toString(),
      userId: session.userId,
      startDateTime: act.start_date,
      data: act,
      name: act.name,
      description: act.description,
      distance: act.distance,
      elevation: act.total_elevation_gain,
      sportType: act.sport_type || act.type,
      movingTimeInSeconds: act.moving_time,
      isCommute: !!act.commute,
      polyline: act.map?.summary_polyline,
      
      // Performance Metrics
      averageSpeed: act.average_speed,
      maxSpeed: act.max_speed,
      averageHeartRate: act.average_heartrate,
      maxHeartRate: act.max_heartrate,
      averageCadence: act.average_cadence,
      averagePower: act.average_watts,
      maxPower: act.max_watts,
      calories: act.calories,
      
      // Metadata
      gearId: act.gear_id,
      deviceName: act.device_name,
      kudoCount: act.kudos_count,
      totalImageCount: act.total_photo_count,
      workoutType: act.workout_type?.toString(),
      
      // Location
      startingLatitude: act.start_latlng?.[0],
      startingLongitude: act.start_latlng?.[1],
    };

    const existing = await db.query.activity.findFirst({
      where: eq(activity.activityId, activityData.activityId),
    });

    if (existing) {
      await db.update(activity).set(activityData).where(eq(activity.activityId, activityData.activityId));
    } else {
      await db.insert(activity).values(activityData);
    }
  }

  return { success: true, count: activities.length };
}
