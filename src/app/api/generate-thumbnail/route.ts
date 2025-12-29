import { db } from "@/db";
import { activity, userReferenceImages, generationStatus } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { generateRunningThumbnail } from "@/lib/gemini";
import { tasks } from "@trigger.dev/sdk";

/**
 * POST /api/generate-thumbnail
 * Generate an AI thumbnail for a specific activity
 *
 * Body: { activityId: string, referenceImageId?: string }
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activityId, referenceImageId } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: "activityId required" }, { status: 400 });
    }

    // Fetch the activity
    const activityData = await db.query.activity.findFirst({
      where: and(
        eq(activity.activityId, activityId),
        eq(activity.userId, session.user.id)
      ),
    });

    if (!activityData) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Check if activity has coordinates
    if (!activityData.startingLatitude || !activityData.startingLongitude) {
      return NextResponse.json(
        { error: "Activity does not have location data" },
        { status: 400 }
      );
    }

    // Get reference image (either specified or default for this sport type)
    let referenceImage;

    if (referenceImageId) {
      referenceImage = await db.query.userReferenceImages.findFirst({
        where: and(
          eq(userReferenceImages.imageId, referenceImageId),
          eq(userReferenceImages.userId, session.user.id)
        ),
      });
    } else {
      // Try to find default image for this sport type
      const sportType = activityData.sportType?.toLowerCase() || "";
      const imageType = sportType.includes("run")
        ? "running"
        : sportType.includes("ride") || sportType.includes("cycle")
        ? "cycling"
        : "general";

      referenceImage = await db.query.userReferenceImages.findFirst({
        where: and(
          eq(userReferenceImages.userId, session.user.id),
          eq(userReferenceImages.imageType, imageType),
          eq(userReferenceImages.isDefault, true)
        ),
      });

      // Fallback to any default image
      if (!referenceImage) {
        referenceImage = await db.query.userReferenceImages.findFirst({
          where: and(
            eq(userReferenceImages.userId, session.user.id),
            eq(userReferenceImages.isDefault, true)
          ),
        });
      }
    }

    if (!referenceImage) {
      return NextResponse.json(
        { error: "No reference image found. Please upload a reference image in settings." },
        { status: 400 }
      );
    }

    // Trigger background job for thumbnail generation
    await tasks.trigger("generate-ai-thumbnail", {
      activityId,
      userId: session.user.id,
      referenceImageUrl: referenceImage.imageUrl,
      latitude: activityData.startingLatitude,
      longitude: activityData.startingLongitude,
      activityName: activityData.name || undefined,
      sportType: activityData.sportType || undefined,
      distance: activityData.distance || undefined,
      startTime: activityData.startDateTime,
    });

    // Update generation status
    await db.insert(generationStatus).values({
      activityId,
      thumbnailStatus: "generating",
      startedAt: Math.floor(Date.now() / 1000),
    }).onConflictDoUpdate({
      target: generationStatus.activityId,
      set: {
        thumbnailStatus: "generating",
        startedAt: Math.floor(Date.now() / 1000),
        thumbnailError: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thumbnail generation started",
      activityId,
    });

  } catch (error: any) {
    console.error("Error starting thumbnail generation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/generate-thumbnail?activityId=xxx
 * Check thumbnail generation status for an activity
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");

    if (!activityId) {
      return NextResponse.json({ error: "activityId required" }, { status: 400 });
    }

    // Verify activity ownership
    const activityData = await db.query.activity.findFirst({
      where: and(
        eq(activity.activityId, activityId),
        eq(activity.userId, session.user.id)
      ),
    });

    if (!activityData) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const status = await db.query.generationStatus.findFirst({
      where: eq(generationStatus.activityId, activityId),
    });

    return NextResponse.json({
      activityId,
      thumbnailUrl: activityData.aiThumbnailUrl,
      thumbnailPrompt: activityData.aiThumbnailPrompt,
      status: status?.thumbnailStatus || "pending",
      error: status?.thumbnailError,
    });

  } catch (error: any) {
    console.error("Error checking thumbnail status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
