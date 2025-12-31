'use server';

import { db } from '@/db';
import { activity, liveEvent, publicProfile, athleteProfile, races, runLetters } from '@/db/schema';
import { eq, and, desc, asc, or, sum, count, gte, sql, lte } from 'drizzle-orm';
import { getLifetimeCountries } from './countries';

export interface DashboardStats {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
}

export interface ActivitySummary {
  activityId: string;
  name: string;
  type: string; // 'Run', 'Ride', etc.
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  startDate: string;
  workoutType: string | null; // '1' = Race
  averageHeartRate: number | null;
  sufferScore: number | null;
  mapPolyline: string | null;
  startLat: number | null;
  startLng: number | null;
}

export interface RaceEvent {
  eventId: string;
  title: string;
  description: string | null;
  startTime: string; // scheduled or actual
  status: 'scheduled' | 'live' | 'ended';
  isLive: boolean;
}

export interface DailyActivity {
    date: string;
    count: number;
    totalMovingTime: number;
    totalDistance: number;
}

export interface UpcomingRace {
    id: string;
    name: string;
    date: string;
    distanceClass: string | null;
    distance: number | null;
    location: string | null;
    goalTime: number | null;
    priority: string;
}

export interface WeeklyFormData {
    weekStart: string;
    totalMiles: number;
    totalMinutes: number;
    activityCount: number;
}

export async function getFeaturedProfile(username: string, viewerId?: string) {
  // 1. Get User ID from Username
  const profile = await db
    .select({
      userId: publicProfile.userId,
      displayName: publicProfile.displayName,
      tagline: publicProfile.tagline,
      coverImageUrl: publicProfile.coverImageUrl,
      stravaProfilePicture: athleteProfile.stravaProfilePicture,
      customProfilePicture: athleteProfile.customProfilePicture,
      socialLinks: publicProfile.socialLinks,
      layoutConfig: publicProfile.layoutConfig,
      heroImageUrl: publicProfile.heroImageUrl,
      templateId: publicProfile.templateId,
      accolades: publicProfile.accolades,
      countryCode: publicProfile.countryCode,
    })
    .from(publicProfile)
    .leftJoin(athleteProfile, eq(publicProfile.userId, athleteProfile.userId))
    .where(eq(publicProfile.username, username))
    .limit(1);

  if (!profile[0]) return null;
  const user = profile[0];
  const userId = user.userId;

  // 2. Get Stats (Year to Date usually better for dashboards, but let's do All Time for now or simplified)
  // Let's do All Time to match generic profile stats
  const statsResult = await db
    .select({
      count: count(),
      distance: sum(activity.distance),
      duration: sum(activity.movingTimeInSeconds),
      elevation: sum(activity.elevation),
    })
    .from(activity)
    .where(eq(activity.userId, userId));

  const stats: DashboardStats = {
    totalActivities: Number(statsResult[0]?.count || 0),
    totalDistance: Number(statsResult[0]?.distance || 0),
    totalTime: Number(statsResult[0]?.duration || 0),
    totalElevation: Number(statsResult[0]?.elevation || 0),
  };

  // 2b. Get Current Year Stats
  const currentYear = new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
  
  const yearStatsResult = await db
    .select({
      count: count(),
      distance: sum(activity.distance),
      duration: sum(activity.movingTimeInSeconds),
      elevation: sum(activity.elevation),
    })
    .from(activity)
    .where(and(
      eq(activity.userId, userId),
      gte(activity.startDateTime, startOfYear)
    ));

  const currentYearStats: DashboardStats = {
    totalActivities: Number(yearStatsResult[0]?.count || 0),
    totalDistance: Number(yearStatsResult[0]?.distance || 0),
    totalTime: Number(yearStatsResult[0]?.duration || 0),
    totalElevation: Number(yearStatsResult[0]?.elevation || 0),
  };

  // 3. Get Recent Activities (Run/Ride)
  const recentActivitiesRaw = await db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.startDateTime))
    .limit(50); // Get enough for charts

  const recentActivities: ActivitySummary[] = recentActivitiesRaw.map(a => ({
    activityId: a.activityId,
    name: a.name || 'Untitled',
    type: a.sportType || 'Run',
    distance: a.distance || 0,
    movingTime: a.movingTimeInSeconds || 0,
    elapsedTime: a.movingTimeInSeconds || 0, // Fallback
    totalElevationGain: a.elevation || 0,
    startDate: a.startDateTime,
    workoutType: a.workoutType,
    averageHeartRate: a.averageHeartRate,
    sufferScore: a.sufferScore,
    mapPolyline: a.polyline,
    startLat: a.startingLatitude,
    startLng: a.startingLongitude,
  }));

  // 4. Get "Races" (Previous)
  // Workout Type 1 (Run Race) or 11 (Ride Race)
  const previousRacesRaw = await db
    .select()
    .from(activity)
    .where(and(
      eq(activity.userId, userId),
      or(
        eq(activity.workoutType, '1'),
        eq(activity.workoutType, '11')
      )
    ))
    .orderBy(desc(activity.startDateTime))
    .limit(10);
    
  const previousRaces: ActivitySummary[] = previousRacesRaw.map(a => ({
    activityId: a.activityId,
    name: a.name || 'Untitled Race',
    type: a.sportType || 'Run',
    distance: a.distance || 0,
    movingTime: a.movingTimeInSeconds || 0,
    elapsedTime: a.movingTimeInSeconds || 0,
    totalElevationGain: a.elevation || 0,
    startDate: a.startDateTime,
    workoutType: a.workoutType,
    averageHeartRate: a.averageHeartRate,
    sufferScore: a.sufferScore,
    mapPolyline: a.polyline,
    startLat: a.startingLatitude,
    startLng: a.startingLongitude,
  }));

  // 5. Get Upcoming Events (from live_event table)
  // We assume these are races or significant events
  const upcomingEventsRaw = await db
    .select()
    .from(liveEvent)
    .where(and(
      eq(liveEvent.userId, userId),
      or(
        eq(liveEvent.status, 'scheduled'),
        eq(liveEvent.status, 'live')
      )
    ))
    .orderBy(asc(liveEvent.scheduledStart));

  const upcomingEvents: RaceEvent[] = upcomingEventsRaw.map(e => ({
    eventId: e.eventId,
    title: e.title,
    description: e.description,
    startTime: e.scheduledStart || new Date().toISOString(),
    status: e.status as 'scheduled' | 'live' | 'ended',
    isLive: e.status === 'live',
  }));

  // 6. Get Calendar Data (Last 365 Days)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString();

  const calendarRaw = await db
    .select({
        startDateTime: activity.startDateTime,
        movingTime: activity.movingTimeInSeconds,
        distance: activity.distance,
    })
    .from(activity)
    .where(and(
        eq(activity.userId, userId),
        gte(activity.startDateTime, oneYearAgoStr)
    ));

  // Client-side aggregation for the calendar
  // We return the raw-ish list and let the component aggregate by day
  // But to save bandwidth, let's map it to a simpler structure
  const calendarData = calendarRaw.map(a => ({
      date: a.startDateTime.substring(0, 10),
      movingTime: a.movingTime || 0,
      distance: a.distance || 0,
  }));

  // 7. Get Upcoming Races (from races table)
  // Use start of today to include races happening today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  
  const upcomingRacesRaw = await db
    .select()
    .from(races)
    .where(and(
      eq(races.userId, userId),
      eq(races.status, 'upcoming'),
      gte(races.date, todayStr)
    ))
    .orderBy(asc(races.date))
    .limit(5);

  const upcomingRaces: UpcomingRace[] = upcomingRacesRaw.map(r => ({
    id: r.id,
    name: r.name,
    date: r.date,
    distanceClass: r.distanceClass,
    distance: r.distance,
    location: r.location,
    goalTime: r.goalTime,
    priority: r.priority || 'A',
  }));

  // 8. Calculate Form Curve (last 12 weeks of training)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 * 7
  
  const weeklyFormRaw = calendarData.filter(d => 
    new Date(d.date) >= twelveWeeksAgo
  );
  
  // Aggregate by week
  const weeklyMap = new Map<string, { miles: number; minutes: number; count: number }>();
  weeklyFormRaw.forEach(d => {
    const date = new Date(d.date);
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    const existing = weeklyMap.get(weekKey) || { miles: 0, minutes: 0, count: 0 };
    weeklyMap.set(weekKey, {
      miles: existing.miles + (d.distance * 0.000621371), // meters to miles
      minutes: existing.minutes + (d.movingTime / 60),
      count: existing.count + 1,
    });
  });
  
  const formCurve: WeeklyFormData[] = Array.from(weeklyMap.entries())
    .map(([weekStart, data]) => ({
      weekStart,
      totalMiles: Math.round(data.miles * 10) / 10,
      totalMinutes: Math.round(data.minutes),
      activityCount: data.count,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  // 9. Get Run Letters (Diary Entries)
  const isOwner = viewerId === userId;
  
  const lettersConditions = [
      eq(activity.userId, userId)
  ];

  if (!isOwner) {
      lettersConditions.push(eq(runLetters.isPublic, true));
  }

  const lettersRaw = await db
    .select({
       activityId: runLetters.activityId,
       letterText: runLetters.letterText,
       generatedAt: runLetters.generatedAt,
       activityName: activity.name,
       activityDate: activity.startDateTime,
    })
    .from(runLetters)
    .innerJoin(activity, eq(runLetters.activityId, activity.activityId))
    .where(and(...lettersConditions))
    .orderBy(desc(runLetters.generatedAt))
    .limit(10);

  const diaryEntries = lettersRaw.map(l => ({
    id: l.activityId,
    title: l.activityName || 'Run Diary',
    date: l.activityDate,
    excerpt: l.letterText.substring(0, 150) + '...',
    fullText: l.letterText,
  }));

  // 10. Get Countries
  const countries = await getLifetimeCountries(userId);

  return {
    user,
    stats,
    currentYearStats,
    recentActivities,
    previousRaces,
    upcomingEvents,
    upcomingRaces,
    calendarData,
    formCurve,
    diaryEntries,
    countries,
  };
}
