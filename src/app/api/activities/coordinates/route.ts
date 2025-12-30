import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = (await auth()) as any;

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Default to all time if no dates provided (specifically from 1970)
  const startDate = from ? new Date(from) : new Date(0);
  const endDate = to ? new Date(to) : new Date();

  try {
    const activities = await db.query.activity.findMany({
      where: and(
        eq(activity.userId, session.userId),
        gte(activity.startDateTime, startDate.toISOString()),
        lte(activity.startDateTime, endDate.toISOString()),
        isNotNull(activity.startingLatitude),
        isNotNull(activity.startingLongitude)
      ),
      columns: {
        activityId: true,
        startingLatitude: true,
        startingLongitude: true,
        name: true,
      },
    });

    const coordinates = activities.map((a) => ({
      id: a.activityId,
      lat: a.startingLatitude,
      lng: a.startingLongitude,
      name: a.name,
    }));

    return NextResponse.json({ coordinates });
  } catch (error) {
    console.error("Error fetching activity coordinates:", error);
    return NextResponse.json(
      { error: "Failed to fetch coordinates" },
      { status: 500 }
    );
  }
}
