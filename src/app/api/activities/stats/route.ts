import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { activity } from '@/db/schema';
import { eq, and, gte, lte, sql, SQL } from 'drizzle-orm';

interface MonthlyStats {
  month: string;
  run: number;
  ride: number;
  other: number;
  distance: number;
  elevation: number;
}

export async function GET(request: NextRequest) {
  const session = await auth() as any;

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const groupBy = (searchParams.get('groupBy') || 'month') as 'hour' | 'day' | 'week' | 'month';

  // Default to last 12 months if no range specified
  const endDate = to ? new Date(to) : new Date();
  const startDate = from
    ? new Date(from)
    : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

  try {
    // Fetch all activities in the date range
    const conditions: SQL[] = [
      eq(activity.userId, session.userId),
      gte(activity.startDateTime, startDate.toISOString()),
      lte(activity.startDateTime, endDate.toISOString()),
    ];

    const activities = await db.query.activity.findMany({
      where: and(...conditions),
      columns: {
        startDateTime: true,
        distance: true,
        movingTimeInSeconds: true,
        elevation: true,
        sportType: true,
      }
    });

    // Calculate generic stats
    const statsMap = new Map<string, MonthlyStats>();

    // Helper to generate keys (duplicates logic from lib but safer here for API isolation)
    const getKey = (date: Date): string => {
        if (groupBy === 'hour') return date.toISOString().slice(0, 13) + ":00:00";
        if (groupBy === 'day') return date.toISOString().slice(0, 10);
        if (groupBy === 'week') {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            d.setDate(diff);
            return d.toISOString().slice(0, 10);
        }
        // month
        return date.toISOString().slice(0, 7) + "-01";
    };

    // Initialize periods? 
    // It's harder to initialize empty periods dynamically without date-fns in API route
    // (Next.js Edge/Server runtime nuances, but standard Node runtime is fine).
    // For now, we'll let clean gaps be handled or just fill based on activities.
    // Ideally we fill gaps, but let's stick to simple aggregation first.
    
    // Actually, filling gaps is important for charts.
    // Let's do a simple loop for 'month' and 'day' which are most common. 
    // Use a simple iterator.
    
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    // Safety break for loop
    let loops = 0;
    while (current <= end && loops < 500) { // Limit to 500 datapoints to prevent infinite loops
        const key = getKey(current);
        statsMap.set(key, {
            month: key, // reusing 'month' field as the label key for now
            run: 0,
            ride: 0,
            other: 0,
            distance: 0,
            elevation: 0,
        });

        // Increment
        if (groupBy === 'hour') current.setHours(current.getHours() + 1);
        else if (groupBy === 'day') current.setDate(current.getDate() + 1);
        else if (groupBy === 'week') current.setDate(current.getDate() + 7);
        else current.setMonth(current.getMonth() + 1);
        
        loops++;
    }

    // Aggregate activities
    activities.forEach((act) => {
      const activityDate = new Date(act.startDateTime);
      const key = getKey(activityDate);

      // If outside our generated range (e.g. timezone diffs), ignore or try to get existing
      let stats = statsMap.get(key);
      if (!stats) {
          // Fallback if our pre-fill missed it (e.g. slight timezone edge cases)
          stats = {
            month: key,
            run: 0,
            ride: 0,
            other: 0,
            distance: 0,
            elevation: 0,
          };
          statsMap.set(key, stats);
      }

      const movingTime = act.movingTimeInSeconds || 0;
      const distance = (act.distance || 0) / 1000; // Convert meters to km
      const elevation = (act.elevation || 0) * 3.28084; // Convert meters to feet

      if (act.sportType === 'Run') {
        stats.run += movingTime;
      } else if (act.sportType === 'Ride') {
        stats.ride += movingTime;
      } else {
        stats.other += movingTime;
      }

      stats.distance += distance;
      stats.elevation += elevation;
    });

    const aggregatedStats = Array.from(statsMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate summary stats
    const totalStats = {
      totalActivities: activities.length,
      totalDistance: activities.reduce((sum, act) => sum + (act.distance || 0) / 1000, 0),
      totalMovingTime: activities.reduce((sum, act) => sum + (act.movingTimeInSeconds || 0), 0),
      totalElevation: activities.reduce((sum, act) => sum + ((act.elevation || 0) * 3.28084), 0),
      runCount: activities.filter((a) => a.sportType === 'Run').length,
      rideCount: activities.filter((a) => a.sportType === 'Ride').length,
      otherCount: activities.filter((a) => !['Run', 'Ride'].includes(a.sportType || '')).length,
    };

    return NextResponse.json({
      monthlyStats: aggregatedStats, // Keep name for compat, or change to 'periodStats'
      summary: totalStats,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      granularity: groupBy 
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json({ error: 'Failed to fetch activity stats' }, { status: 500 });
  }
}
