"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { user, activity } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchStravaActivities } from "@/lib/strava";

export async function syncActivities() {
  const session = (await auth()) as any;
  if (!session) throw new Error("Unauthorized");

  const athlete = await db.query.user.findFirst({
    where: eq(user.userId, session.userId),
  });

  if (!athlete) throw new Error("User not found");

  const activities = await fetchStravaActivities(athlete.stravaAccessToken);

  for (const act of activities) {
    const activityData = {
      activityId: act.id.toString(),
      startDateTime: act.start_date,
      data: act,
      name: act.name,
      distance: act.distance,
      elevation: act.total_elevation_gain,
      sportType: act.sport_type || act.type,
      movingTimeInSeconds: act.moving_time,
      isCommute: !!act.commute,
      polyline: act.map?.summary_polyline,
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
