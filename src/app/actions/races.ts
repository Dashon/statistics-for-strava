'use server';

import { db } from '@/db';
import { races, activity, standardDistances } from '@/db/schema';
import { eq, and, desc, asc, or, gte, lte, sql, like, ilike } from 'drizzle-orm';
import { auth } from '@/auth';

// Standard race distances with tolerance for detection
const STANDARD_DISTANCES = [
  { name: '1 Mile', meters: 1609, tolerance: 0.03 },
  { name: '5K', meters: 5000, tolerance: 0.02 },
  { name: '10K', meters: 10000, tolerance: 0.02 },
  { name: '15K', meters: 15000, tolerance: 0.02 },
  { name: '10 Mile', meters: 16093, tolerance: 0.02 },
  { name: 'Half Marathon', meters: 21097, tolerance: 0.02 },
  { name: 'Marathon', meters: 42195, tolerance: 0.015 },
  { name: '50K', meters: 50000, tolerance: 0.03 },
  { name: '50 Mile', meters: 80467, tolerance: 0.03 },
  { name: '100K', meters: 100000, tolerance: 0.03 },
  { name: '100 Mile', meters: 160934, tolerance: 0.03 },
];

// Race keywords for title detection
const RACE_KEYWORDS = [
  'race', 'marathon', '5k', '10k', '15k', '10mi', '10 mi', '10 mile',
  'half marathon', 'half-marathon', 'halfmarathon', 'hm', 'ultra',
  'trail race', 'xc', 'cross country', 'championship', 'champs',
  'boston', 'chicago', 'nyc', 'berlin', 'london', 'tokyo', // major marathons
  'ironman', 'triathlon', 'duathlon',
  'turkey trot', 'jingle', 'shamrock', 'firecracker', 'freedom run',
];

export interface Race {
  id: string;
  userId: string;
  name: string;
  date: string;
  distance: number | null;
  distanceClass: string | null;
  location: string | null;
  goalTime: number | null;
  priority: string;
  status: string;
  raceUrl: string | null;
  courseUrl: string | null;
  bibNumber: string | null;
  notes: string | null;
  linkedActivityId: string | null;
  resultTime: number | null;
  resultPlacement: number | null;
  isPr: boolean;
}

export interface RaceDetectionResult {
  activityId: string;
  activityName: string;
  date: string;
  distance: number;
  detectedDistanceClass: string | null;
  confidence: number;
  reasons: string[];
}

// ============== CRUD Operations ==============

export async function getRaces(status?: 'upcoming' | 'completed' | 'all') {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  if (status === 'upcoming') {
    return db.select().from(races).where(and(
      eq(races.userId, session.userId),
      eq(races.status, 'upcoming')
    )).orderBy(asc(races.date));
  } else if (status === 'completed') {
    return db.select().from(races).where(and(
      eq(races.userId, session.userId),
      or(eq(races.status, 'completed'), eq(races.status, 'dns'), eq(races.status, 'dnf'))
    )).orderBy(desc(races.date));
  } else {
    return db.select().from(races).where(eq(races.userId, session.userId)).orderBy(desc(races.date));
  }
}

export async function getUpcomingRaces(limit = 5) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  const now = new Date().toISOString();
  
  return db
    .select()
    .from(races)
    .where(and(
      eq(races.userId, session.userId),
      eq(races.status, 'upcoming'),
      gte(races.date, now)
    ))
    .orderBy(asc(races.date))
    .limit(limit);
}

export async function getNextRace() {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  const now = new Date().toISOString();
  
  const result = await db
    .select()
    .from(races)
    .where(and(
      eq(races.userId, session.userId),
      eq(races.status, 'upcoming'),
      gte(races.date, now)
    ))
    .orderBy(asc(races.date))
    .limit(1);
  
  return result[0] || null;
}

export async function createRace(data: {
  name: string;
  date: string;
  distance?: number;
  distanceClass?: string;
  location?: string;
  goalTime?: number;
  priority?: string;
  raceUrl?: string;
  courseUrl?: string;
  bibNumber?: string;
  notes?: string;
}) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(races).values({
    id,
    userId: session.userId,
    name: data.name,
    date: data.date,
    distance: data.distance || null,
    distanceClass: data.distanceClass || null,
    location: data.location || null,
    goalTime: data.goalTime || null,
    priority: data.priority || 'A',
    status: 'upcoming',
    raceUrl: data.raceUrl || null,
    courseUrl: data.courseUrl || null,
    bibNumber: data.bibNumber || null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function updateRace(id: string, data: Partial<{
  name: string;
  date: string;
  distance: number;
  distanceClass: string;
  location: string;
  goalTime: number;
  priority: string;
  status: string;
  raceUrl: string;
  courseUrl: string;
  bibNumber: string;
  notes: string;
  linkedActivityId: string;
  resultTime: number;
  resultPlacement: number;
  resultAgeGroupPlacement: number;
  resultGenderPlacement: number;
  isPr: boolean;
}>) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  await db
    .update(races)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(races.id, id), eq(races.userId, session.userId)));

  return { success: true };
}

export async function deleteRace(id: string) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  await db
    .delete(races)
    .where(and(eq(races.id, id), eq(races.userId, session.userId)));

  return { success: true };
}

// ============== Activity Race Marking ==============

export async function markActivityAsRace(activityId: string, data: {
  raceName?: string;
  raceDistanceClass?: string;
  officialTime?: number;
  placement?: number;
  ageGroupPlacement?: number;
  genderPlacement?: number;
  isPr?: boolean;
  raceNotes?: string;
  linkedRaceId?: string;
}) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  await db
    .update(activity)
    .set({
      isRace: true,
      raceName: data.raceName,
      raceDistanceClass: data.raceDistanceClass,
      officialTime: data.officialTime,
      placement: data.placement,
      ageGroupPlacement: data.ageGroupPlacement,
      genderPlacement: data.genderPlacement,
      isPr: data.isPr || false,
      raceNotes: data.raceNotes,
      linkedRaceId: data.linkedRaceId,
    })
    .where(and(eq(activity.activityId, activityId), eq(activity.userId, session.userId)));

  return { success: true };
}

export async function unmarkActivityAsRace(activityId: string) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  await db
    .update(activity)
    .set({
      isRace: false,
      raceName: null,
      raceDistanceClass: null,
      officialTime: null,
      placement: null,
      ageGroupPlacement: null,
      genderPlacement: null,
      isPr: false,
      raceNotes: null,
      linkedRaceId: null,
      raceDetected: false,
      raceDetectionConfidence: null,
    })
    .where(and(eq(activity.activityId, activityId), eq(activity.userId, session.userId)));

  return { success: true };
}

export async function getRaceActivities(limit = 10) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  return db
    .select()
    .from(activity)
    .where(and(
      eq(activity.userId, session.userId),
      eq(activity.isRace, true)
    ))
    .orderBy(desc(activity.startDateTime))
    .limit(limit);
}

// ============== Auto-Detection ==============

function detectDistanceClass(distanceMeters: number): { class: string; confidence: number } | null {
  for (const std of STANDARD_DISTANCES) {
    const lowerBound = std.meters * (1 - std.tolerance);
    const upperBound = std.meters * (1 + std.tolerance);
    
    if (distanceMeters >= lowerBound && distanceMeters <= upperBound) {
      // Calculate confidence based on how close to exact distance
      const deviation = Math.abs(distanceMeters - std.meters) / std.meters;
      const confidence = 1 - (deviation / std.tolerance);
      return { class: std.name, confidence: Math.max(0.5, confidence) };
    }
  }
  return null;
}

function detectRaceKeywords(title: string): { found: boolean; confidence: number; keywords: string[] } {
  const lowerTitle = title.toLowerCase();
  const foundKeywords: string[] = [];
  
  for (const keyword of RACE_KEYWORDS) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  if (foundKeywords.length > 0) {
    // More keywords = higher confidence
    const confidence = Math.min(0.9, 0.5 + (foundKeywords.length * 0.1));
    return { found: true, confidence, keywords: foundKeywords };
  }
  
  return { found: false, confidence: 0, keywords: [] };
}

export async function detectPossibleRaces(): Promise<RaceDetectionResult[]> {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  // Get activities that haven't been marked as race and haven't been detected yet
  const candidates = await db
    .select({
      activityId: activity.activityId,
      name: activity.name,
      startDateTime: activity.startDateTime,
      distance: activity.distance,
      workoutType: activity.workoutType,
      sufferScore: activity.sufferScore,
      averageHeartRate: activity.averageHeartRate,
      sportType: activity.sportType,
    })
    .from(activity)
    .where(and(
      eq(activity.userId, session.userId),
      eq(activity.isRace, false),
      or(eq(activity.raceDetected, false), sql`${activity.raceDetected} IS NULL`)
    ))
    .orderBy(desc(activity.startDateTime))
    .limit(100); // Check last 100 non-race activities

  const detectedRaces: RaceDetectionResult[] = [];

  for (const act of candidates) {
    const reasons: string[] = [];
    let totalConfidence = 0;
    let factors = 0;

    // Factor 1: Distance matches a standard race distance
    if (act.distance) {
      const distanceMatch = detectDistanceClass(act.distance);
      if (distanceMatch) {
        reasons.push(`Distance matches ${distanceMatch.class} (${(act.distance / 1000).toFixed(2)} km)`);
        totalConfidence += distanceMatch.confidence * 0.4; // 40% weight
        factors++;
      }
    }

    // Factor 2: Title contains race keywords
    if (act.name) {
      const keywordMatch = detectRaceKeywords(act.name);
      if (keywordMatch.found) {
        reasons.push(`Title contains: ${keywordMatch.keywords.join(', ')}`);
        totalConfidence += keywordMatch.confidence * 0.35; // 35% weight
        factors++;
      }
    }

    // Factor 3: Strava workout_type = 1 (race)
    if (act.workoutType === '1' || act.workoutType === '11') {
      reasons.push('Marked as race in Strava');
      totalConfidence += 0.9 * 0.25; // 25% weight, very confident
      factors++;
    }

    // Factor 4: High suffer score (if available)
    if (act.sufferScore && act.sufferScore > 150) {
      reasons.push(`High intensity (Suffer Score: ${act.sufferScore})`);
      totalConfidence += 0.3; // Bonus 30%
    }

    // Need at least 2 factors with combined confidence > 0.5
    if (factors >= 1 && totalConfidence > 0.4) {
      const distanceClass = act.distance ? detectDistanceClass(act.distance)?.class || null : null;
      
      detectedRaces.push({
        activityId: act.activityId,
        activityName: act.name || 'Untitled',
        date: act.startDateTime,
        distance: act.distance || 0,
        detectedDistanceClass: distanceClass,
        confidence: Math.min(1, totalConfidence),
        reasons,
      });

      // Update the activity to mark it as detected (so we don't re-detect)
      await db
        .update(activity)
        .set({
          raceDetected: true,
          raceDetectionConfidence: Math.min(1, totalConfidence),
        })
        .where(eq(activity.activityId, act.activityId));
    }
  }

  return detectedRaces;
}

export async function getPendingRaceDetections(): Promise<RaceDetectionResult[]> {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  // Get activities that were detected as possible races but not confirmed
  const pending = await db
    .select({
      activityId: activity.activityId,
      name: activity.name,
      startDateTime: activity.startDateTime,
      distance: activity.distance,
      raceDetectionConfidence: activity.raceDetectionConfidence,
    })
    .from(activity)
    .where(and(
      eq(activity.userId, session.userId),
      eq(activity.raceDetected, true),
      eq(activity.isRace, false)
    ))
    .orderBy(desc(activity.startDateTime))
    .limit(20);

  return pending.map(act => ({
    activityId: act.activityId,
    activityName: act.name || 'Untitled',
    date: act.startDateTime,
    distance: act.distance || 0,
    detectedDistanceClass: act.distance ? detectDistanceClass(act.distance)?.class || null : null,
    confidence: act.raceDetectionConfidence || 0,
    reasons: [], // Reasons not stored, would need to re-calculate
  }));
}

export async function dismissRaceDetection(activityId: string) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  // Mark as detected but not a race (won't show up in pending again)
  await db
    .update(activity)
    .set({
      raceDetected: true,
      raceDetectionConfidence: 0, // Zero confidence = dismissed
    })
    .where(and(eq(activity.activityId, activityId), eq(activity.userId, session.userId)));

  return { success: true };
}

// ============== Link Race to Activity ==============

export async function linkRaceToActivity(raceId: string, activityId: string) {
  const session = await auth() as any;
  if (!session?.userId) throw new Error('Unauthorized');

  // Get the activity data
  const [act] = await db
    .select()
    .from(activity)
    .where(and(eq(activity.activityId, activityId), eq(activity.userId, session.userId)))
    .limit(1);

  if (!act) throw new Error('Activity not found');

  // Update the race with activity data
  await db
    .update(races)
    .set({
      linkedActivityId: activityId,
      status: 'completed',
      resultTime: act.movingTimeInSeconds,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(races.id, raceId), eq(races.userId, session.userId)));

  // Mark activity as race
  const [race] = await db.select().from(races).where(eq(races.id, raceId));
  
  await db
    .update(activity)
    .set({
      isRace: true,
      linkedRaceId: raceId,
      raceName: race?.name,
      raceDistanceClass: race?.distanceClass,
    })
    .where(eq(activity.activityId, activityId));

  return { success: true };
}
