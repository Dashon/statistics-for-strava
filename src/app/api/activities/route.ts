import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { activity } from '@/db/schema';
import { eq, and, desc, asc, gte, lte, sql, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth() as any;

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
  const offset = (page - 1) * limit;

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'startDateTime';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  // Filters
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const activityType = searchParams.get('activityType');
  const activityId = searchParams.get('activityId');

  // Build WHERE conditions
  const conditions: SQL[] = [eq(activity.userId, session.userId)];

  if (from) {
    conditions.push(gte(activity.startDateTime, new Date(from).toISOString()));
  }

  if (to) {
    conditions.push(lte(activity.startDateTime, new Date(to).toISOString()));
  }

  if (activityType) {
    conditions.push(eq(activity.sportType, activityType));
  }

  if (activityId) {
    conditions.push(eq(activity.activityId, activityId));
  }

  // Build ORDER BY
  const sortField = (activity as any)[sortBy] || activity.startDateTime;
  const orderClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

  try {
    // Execute query with filters, sorting, and pagination
    const [activities, totalCountResult] = await Promise.all([
      db.query.activity.findMany({
        where: and(...conditions),
        orderBy: [orderClause],
        limit,
        offset,
        columns: {
          activityId: true,
          startDateTime: true,
          name: true,
          sportType: true,
          distance: true,
          movingTimeInSeconds: true,
          averageHeartRate: true,
          elevation: true,
          kilojoules: true,
          kudoCount: true,
          averageSpeed: true,
          maxSpeed: true,
          averagePower: true,
          maxPower: true,
          maxHeartRate: true,
          averageCadence: true,
          calories: true,
          startingLatitude: true,
          startingLongitude: true,
          polyline: true,
          data: true, // Needed for achievementCount
        }
      }),
      // Count total matching records
      db
        .select({ count: sql<number>`count(*)` })
        .from(activity)
        .where(and(...conditions)),
    ]);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Transform data for client
    const formattedActivities = activities.map((act) => ({
      id: act.activityId,
      startDate: act.startDateTime,
      name: act.name,
      type: act.sportType,
      distance: act.distance || 0,
      movingTime: act.movingTimeInSeconds || 0,
      heartRate: act.averageHeartRate,
      elevation: act.elevation || 0,
      kilojoules: act.data?.kilojoules,
      achievementCount: act.data?.achievement_count,
      kudosCount: act.kudoCount,
      averageSpeed: act.averageSpeed,
      maxSpeed: act.maxSpeed,
      averagePower: act.averagePower,
      maxPower: act.maxPower,
      maxHeartRate: act.maxHeartRate,
      averageCadence: act.averageCadence,
      calories: act.calories,
      startingLatitude: act.startingLatitude,
      startingLongitude: act.startingLongitude,
      hasPolyline: !!act.polyline,
    }));

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        from,
        to,
        activityType,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
