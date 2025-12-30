import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, activity } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Generic ingestion webhook for Apple Health / Google Fit bridge apps
export async function POST(req: NextRequest) {
  // Auth via API Key header
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 });
  }

  // Find user by API key
  const userData = await db.query.user.findFirst({
    where: eq(user.apiKey, apiKey),
  });

  if (!userData) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Support both single workout and array of workouts
    const workouts = Array.isArray(body.data) ? body.data : [body];
    const imported: string[] = [];
    const errors: string[] = [];

    for (const workout of workouts) {
      try {
        // Map common fields from various bridge app formats
        const activityData = {
          activityId: workout.id || `ingest_${nanoid(16)}`,
          userId: userData.userId,
          provider: workout.provider || workout.source || 'apple_health',
          externalId: workout.external_id || workout.id,
          startDateTime: workout.start_time || workout.startTime || workout.start || new Date().toISOString(),
          name: workout.name || workout.workoutType || workout.sport_type || 'Workout',
          sportType: mapSportType(workout.sport_type || workout.workoutType || workout.type),
          distance: workout.distance_meters || workout.distance || 0,
          movingTimeInSeconds: workout.duration_seconds || workout.duration || workout.movingTime || 0,
          calories: workout.calories || workout.activeCalories || null,
          averageHeartRate: workout.average_heart_rate || workout.avgHeartRate || null,
          maxHeartRate: workout.max_heart_rate || workout.maxHeartRate || null,
          elevation: workout.elevation_gain || workout.elevation || null,
          averageSpeed: workout.average_speed || null,
          deviceName: workout.device_name || workout.device || 'Bridge App',
          data: workout, // Store raw payload for debugging
        };

        await db.insert(activity).values(activityData).onConflictDoUpdate({
          target: activity.activityId,
          set: activityData,
        });

        imported.push(activityData.activityId);
      } catch (err: any) {
        errors.push(`Failed to import workout: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: imported.length,
      importedIds: imported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Webhook ingestion error:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// Map various sport type strings to our standard types
function mapSportType(type: string | undefined): string {
  if (!type) return 'Workout';
  
  const normalized = type.toLowerCase().replace(/[_-]/g, '');
  
  const mappings: Record<string, string> = {
    'run': 'Run',
    'running': 'Run',
    'outdoorrun': 'Run',
    'indoorrun': 'Run',
    'trailrun': 'TrailRun',
    'walk': 'Walk',
    'walking': 'Walk',
    'hike': 'Hike',
    'hiking': 'Hike',
    'cycle': 'Ride',
    'cycling': 'Ride',
    'bike': 'Ride',
    'biking': 'Ride',
    'ride': 'Ride',
    'outdoorcycle': 'Ride',
    'indoorcycle': 'VirtualRide',
    'swim': 'Swim',
    'swimming': 'Swim',
    'poolswim': 'Swim',
    'openwater': 'Swim',
    'yoga': 'Yoga',
    'strength': 'WeightTraining',
    'weighttraining': 'WeightTraining',
    'crossfit': 'Crossfit',
    'elliptical': 'Elliptical',
    'rowing': 'Rowing',
  };

  return mappings[normalized] || 'Workout';
}
