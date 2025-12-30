"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { userReferenceImages, activity, generationStatus } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk";

export async function generateThumbnail(activityId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Fetch activity to get location data
  const activityData = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
  });

  if (!activityData) throw new Error("Activity not found");

  if (!activityData.startingLatitude || !activityData.startingLongitude) {
    throw new Error("Activity does not have location data");
  }

  // Fetch reference image (optional)
  const refImage = await db.query.userReferenceImages.findFirst({
    where: eq(userReferenceImages.userId, session.user.id),
    orderBy: [desc(userReferenceImages.isDefault), desc(userReferenceImages.uploadedAt)],
  });

  // Initialize generation status
  await db.insert(generationStatus).values({
    activityId: activityId,
    thumbnailStatus: "generating",
    startedAt: Math.floor(Date.now() / 1000),
  }).onConflictDoUpdate({
    target: generationStatus.activityId,
    set: {
      thumbnailStatus: "generating",
      thumbnailError: null,
      startedAt: Math.floor(Date.now() / 1000),
    }
  });

  // Trigger generation
  await tasks.trigger("generate-ai-thumbnail", {
    activityId: activityId,
    userId: session.user.id,
    referenceImageUrl: refImage?.imageUrl || null,
    latitude: activityData.startingLatitude,
    longitude: activityData.startingLongitude,
    activityName: activityData.name || "Activity",
    sportType: activityData.sportType || "Run",
    distance: activityData.distance || 0,
    startTime: activityData.startDateTime,
  });

  return { success: true };
}
