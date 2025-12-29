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
    });

    // Calculate monthly stats
    const monthlyStatsMap = new Map<string, MonthlyStats>();

    // Initialize months
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      monthlyStatsMap.set(monthStr, {
        month: monthStr,
        run: 0,
        ride: 0,
        other: 0,
        distance: 0,
        elevation: 0,
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Aggregate activities by month
    activities.forEach((act) => {
      const activityDate = new Date(act.startDateTime);
      const monthStr = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`;

      const stats = monthlyStatsMap.get(monthStr);
      if (!stats) return;

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

    const monthlyStats = Array.from(monthlyStatsMap.values());

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
      monthlyStats,
      summary: totalStats,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json({ error: 'Failed to fetch activity stats' }, { status: 500 });
  }
}
