import { db } from "../src/db";
import { user, activity, gear, activityStream } from "../src/db/schema";
import { fetchStravaActivities, fetchStravaAthlete, fetchStravaActivityDetail, fetchStravaActivityStreams } from "../src/lib/strava";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function manualSync() {
  console.log("Starting standalone manual sync...");
  
  const users = await db.select().from(user);
  
  if (users.length === 0) {
    console.log("No users found in database.");
    process.exit(0);
  }

  for (const u of users) {
    console.log(`\n--- Syncing User: ${u.userId} (Strava ID: ${u.stravaAthleteId}) ---`);
    
    try {
        // 1. Sync Gear
        console.log("Fetching gear...");
        const stravaAthlete = await fetchStravaAthlete(u.stravaAccessToken);
        const allGear = [...(stravaAthlete.shoes || []), ...(stravaAthlete.bikes || [])];
        for (const g of allGear) {
            await db.insert(gear).values({
                gearId: g.id,
                name: g.name,
                type: g.brand_name || (g.id.startsWith('s') ? 'Shoes' : 'Bike'),
                distanceInMeter: Math.floor(g.distance),
                isRetired: !!g.retired,
                data: g,
                createdOn: new Date().toISOString(),
            }).onConflictDoUpdate({ target: gear.gearId, set: { distanceInMeter: Math.floor(g.distance), data: g } });
        }

        // 2. Fetch Activities
        console.log("Fetching activities list...");
        const activities = await fetchStravaActivities(u.stravaAccessToken);
        console.log(`Found ${activities.length} activities.`);

        // 3. Process Top 50 with Full Detail + Streams
        for (let i = 0; i < Math.min(activities.length, 50); i++) {
            let act = activities[i];
            console.log(`Processing [${i+1}/10]: ${act.name} (${act.id})`);

            try {
                const detail = await fetchStravaActivityDetail(u.stravaAccessToken, act.id.toString());
                act = { ...act, ...detail };

                const streams = await fetchStravaActivityStreams(u.stravaAccessToken, act.id.toString());
                if (streams) {
                    await db.insert(activityStream).values({
                        activityId: act.id.toString(),
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
                    }).onConflictDoUpdate({
                        target: activityStream.activityId,
                        set: { updatedAt: new Date().toISOString() }
                    });
                    console.log("  -> Streams saved (Heartrate: " + !!streams.heartrate + ")");
                }

                await db.insert(activity).values({
                    activityId: act.id.toString(),
                    userId: u.userId,
                    startDateTime: act.start_date,
                    data: act,
                    name: act.name,
                    description: act.description,
                    distance: act.distance,
                    elevation: act.total_elevation_gain,
                    sportType: act.sport_type || act.type,
                    movingTimeInSeconds: act.moving_time,
                    isCommute: !!act.commute,
                    polyline: act.map?.summary_polyline || act.map?.polyline,
                    streamsAreImported: true,
                    averageHeartRate: act.average_heartrate,
                    maxHeartRate: act.max_heartrate,
                    calories: act.calories,
                }).onConflictDoUpdate({
                    target: activity.activityId,
                    set: { data: act, streamsAreImported: true }
                });
                console.log("  -> Detail/Segments saved (Segments: " + (act.segment_efforts?.length || 0) + ")");

            } catch (err: any) {
                console.error(`  !! Failed activity ${act.id}:`, err.message);
            }
        }

    } catch (err: any) {
        console.error(`Sync failed for user ${u.userId}:`, err.message);
    }
  }

  process.exit(0);
}

manualSync().catch(err => {
  console.error(err);
  process.exit(1);
});
