import { task, logger } from "@trigger.dev/sdk";
import { db } from "@/db";
import { activity, generationStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateRunningThumbnail } from "@/lib/gemini";

/**
 * Generate AI Thumbnail Task
 * Creates a photorealistic AI-generated thumbnail of the athlete at the run location
 */
export const generateAIThumbnail = task({
  id: "generate-ai-thumbnail",
  queue: {
    concurrencyLimit: 2, // Limit concurrent generations to manage API costs
  },
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    activityId: string;
    userId: string;
    referenceImageUrl: string;
    latitude: number;
    longitude: number;
    activityName?: string;
    sportType?: string;
    distance?: number;
    startTime?: string;
  }) => {
    logger.info(`Generating AI thumbnail for activity ${payload.activityId}`);

    try {
      // Generate thumbnail using Gemini
      const result = await generateRunningThumbnail({
        referenceImageUrl: payload.referenceImageUrl,
        latitude: payload.latitude,
        longitude: payload.longitude,
        activityName: payload.activityName,
        sportType: payload.sportType,
        distance: payload.distance,
        startTime: payload.startTime,
      });

      logger.info(`Thumbnail generated successfully: ${result.prompt.substring(0, 100)}...`);

      // Update activity with generated thumbnail
      const now = new Date().toISOString();
      await db.update(activity)
        .set({
          aiThumbnailUrl: result.imageUrl || null,
          aiThumbnailPrompt: result.prompt,
          aiThumbnailGeneratedAt: now,
        })
        .where(eq(activity.activityId, payload.activityId));

      // Update generation status
      await db.update(generationStatus)
        .set({
          thumbnailStatus: "completed",
          completedAt: Math.floor(Date.now() / 1000),
          thumbnailError: null,
        })
        .where(eq(generationStatus.activityId, payload.activityId));

      return {
        success: true,
        activityId: payload.activityId,
        prompt: result.prompt,
      };

    } catch (error: any) {
      logger.error(`Failed to generate thumbnail for activity ${payload.activityId}`, {
        error: error.message,
      });

      // Update generation status with error
      await db.update(generationStatus)
        .set({
          thumbnailStatus: "failed",
          thumbnailError: error.message,
          completedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(generationStatus.activityId, payload.activityId));

      throw error;
    }
  },
});
