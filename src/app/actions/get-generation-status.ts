"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { generationStatus, activity } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getGenerationStatus(activityId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check current status
  const status = await db.query.generationStatus.findFirst({
    where: eq(generationStatus.activityId, activityId),
  });

  // Also check if the activity has the URL populated (in case status update lagged)
  const act = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
    columns: {
      aiThumbnailUrl: true,
    }
  });

  return {
    thumbnailStatus: status?.thumbnailStatus || 'pending',
    thumbnailError: status?.thumbnailError,
    aiThumbnailUrl: act?.aiThumbnailUrl || null,
  };
}
