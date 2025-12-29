import { task, logger, tasks } from "@trigger.dev/sdk";
import { db } from "@/db";
import { user, activity, activityStream } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
    fetchStravaActivities, 
    fetchStravaActivityDetail, 
    fetchStravaActivityStreams 
} from "@/lib/strava";

/**
 * Deep Sync Single Activity Task
 * Fetches full detail and streams for one specific activity
 */
export const deepSyncActivity = task({
  id: "deep-sync-activity",
  queue: {
    concurrencyLimit: 2, // Strict limit to avoid Strava rate limiting
  },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: { 
    activityId: string; 
    userId: string;
    accessToken: string;
  }) => {
    logger.info(`Deep syncing activity ${payload.activityId}`);

    try {
      // 1. Fetch Detail
      const detail = await fetchStravaActivityDetail(payload.accessToken, payload.activityId);
      
      // 2. Fetch Streams
      const streams = await fetchStravaActivityStreams(payload.accessToken, payload.activityId);
      
      let streamsImportedSuccessfully = false;
      if (streams) {
        const streamData = {
          activityId: payload.activityId,
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
        streamsImportedSuccessfully = true;
      }

      // 3. Update Activity Record
      const activityData = {
        name: detail.name,
        description: detail.description,
        distance: detail.distance,
        elevation: detail.total_elevation_gain,
        sportType: detail.sport_type || detail.type,
        movingTimeInSeconds: detail.moving_time,
        isCommute: !!detail.commute,
        polyline: detail.map?.summary_polyline || detail.map?.polyline,
        streamsAreImported: streamsImportedSuccessfully,
        
        // Performance Metrics
        averageSpeed: detail.average_speed,
        maxSpeed: detail.max_speed,
        averageHeartRate: detail.average_heartrate,
        maxHeartRate: detail.max_heartrate,
        averageCadence: detail.average_cadence,
        averagePower: detail.average_watts,
        maxPower: detail.max_watts,
        calories: detail.calories,
        
        // Metadata
        gearId: detail.gear_id,
        deviceName: detail.device_name,
        kudoCount: detail.kudos_count,
        totalImageCount: detail.total_photo_count,
        workoutType: detail.workout_type?.toString(),
        
        // Full raw data
        data: detail,
        
        // Location
        startingLatitude: detail.start_latlng?.[0],
        startingLongitude: detail.start_latlng?.[1],
      };

      await db.update(activity)
        .set(activityData)
        .where(eq(activity.activityId, payload.activityId));

      return { success: true, activityId: payload.activityId };
    } catch (error: any) {
      logger.error(`Failed to deep sync activity ${payload.activityId}`, { error: error.message });
      throw error;
    }
  },
});

/**
 * Sync All Strava History Task
 * Fetches all activity summaries and triggers deep sync for each
 */
export const syncStravaHistory = task({
  id: "sync-strava-history",
  queue: {
    concurrencyLimit: 1, // Only one history scan at a time per user
  },
  run: async (payload: { userId: string }) => {
    const athlete = await db.query.user.findFirst({
      where: eq(user.userId, payload.userId),
    });

    if (!athlete) throw new Error("Athlete not found");

    logger.info("Fetching all activities from Strava...");
    const activities = await fetchStravaActivities(athlete.stravaAccessToken);
    logger.info(`Found ${activities.length} total activities.`);

    // 1. Bulk Upsert Activity Summaries (First pass)
    // This ensures we have the base records quickly
    for (const act of activities) {
      const activityData = {
        activityId: act.id.toString(),
        userId: payload.userId,
        startDateTime: act.start_date,
        name: act.name,
        distance: act.distance,
        elevation: act.total_elevation_gain,
        sportType: act.sport_type || act.type,
        movingTimeInSeconds: act.moving_time,
        isCommute: !!act.commute,
        polyline: act.map?.summary_polyline,
        data: act,
        
        // Basic metrics from summary
        averageSpeed: act.average_speed,
        maxSpeed: act.max_speed,
        averageHeartRate: act.average_heartrate,
        maxHeartRate: act.max_heartrate,
        startingLatitude: act.start_latlng?.[0],
        startingLongitude: act.start_latlng?.[1],
      };

      await db.insert(activity).values(activityData).onConflictDoUpdate({
        target: activity.activityId,
        set: activityData
      });
    }

    // 2. Identify which activities actually need deep sync
    // We only deep sync if streamsAreImported is not true
    const existingActivities = await db.query.activity.findMany({
      where: eq(activity.userId, payload.userId),
    });
    
    const importedIds = new Set(
      existingActivities
        .filter(a => a.streamsAreImported)
        .map(a => a.activityId)
    );

    const activitiesToDeepSync = activities
      .filter(a => !importedIds.has(a.id.toString()))
      .map(a => a.id.toString());
    
    if (activitiesToDeepSync.length === 0) {
      logger.info("No new activities need deep sync.");
      return { success: true, totalActivities: activities.length, deepSyncQueued: 0 };
    }

    logger.info(`Queueing deep sync for ${activitiesToDeepSync.length} activities.`);
    
    // We process in batches of 20 to maintain reasonable progress without overwhelming Strava
    const BATCH_SIZE = 20;
    for (let i = 0; i < activitiesToDeepSync.length; i += BATCH_SIZE) {
      const batch = activitiesToDeepSync.slice(i, i + BATCH_SIZE);
      
      logger.info(`Queueing deep sync batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(activitiesToDeepSync.length/BATCH_SIZE)}`);
      
      await Promise.all(batch.map(id => 
        tasks.trigger("deep-sync-activity", {
          activityId: id,
          userId: payload.userId,
          accessToken: athlete.stravaAccessToken
        })
      ));
      
      // Small pause between queueing batches
      if (i + BATCH_SIZE < activitiesToDeepSync.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return { 
      success: true, 
      totalActivities: activities.length,
      deepSyncQueued: activitiesToDeepSync.length
    };
  },
});
