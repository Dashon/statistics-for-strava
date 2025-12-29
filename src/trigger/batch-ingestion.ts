import { task, logger, tasks } from "@trigger.dev/sdk";
import { db } from "@/db";
import { activity, runLetters, coachingInsights } from "@/db/schema";
import { eq, desc, and, notInArray } from "drizzle-orm";

/**
 * Batch Ingestion Task - Process historical running data
 *
 * This task handles:
 * - Full history ingestion for premium users
 * - Recent runs (last 3 months) for free users
 * - Smart prioritization: recent runs first, then historical
 * - Rate limiting via concurrency control
 */
export const batchIngestRunHistory = task({
  id: "batch-ingest-run-history",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    userId: string;
    tier: "free" | "premium";
    maxActivities?: number; // Optional limit
  }, { ctx }) => {
    logger.info("Starting batch ingestion", {
      userId: payload.userId,
      tier: payload.tier,
    });

    // Determine how many activities to process based on tier
    const isFreeTier = payload.tier === "free";
    const maxActivities = payload.maxActivities || (isFreeTier ? 20 : undefined); // Free: 20, Premium: unlimited

    // Fetch user's running activities
    const allActivities = await db.query.activity.findMany({
      where: eq(activity.sportType, "Run"),
      orderBy: [desc(activity.startDateTime)],
      limit: maxActivities,
    });

    logger.info(`Found ${allActivities.length} running activities`);

    if (allActivities.length === 0) {
      return { success: true, processed: 0, skipped: 0 };
    }

    // Check which activities already have content
    const existingLetters = await db.query.runLetters.findMany({
      where: (letter, { inArray }) =>
        inArray(letter.activityId, allActivities.map(a => a.activityId)),
    });
    const existingLetterIds = new Set(existingLetters.map(l => l.activityId));

    const existingInsights = await db.query.coachingInsights.findMany({
      where: (insight, { inArray }) =>
        inArray(insight.activityId, allActivities.map(a => a.activityId)),
    });
    const existingInsightIds = new Set(existingInsights.map(i => i.activityId));

    // Filter to activities that need processing
    const activitiesToProcess = allActivities.filter(
      a => !existingLetterIds.has(a.activityId) || !existingInsightIds.has(a.activityId)
    );

    logger.info(`Processing ${activitiesToProcess.length} activities (${allActivities.length - activitiesToProcess.length} already complete)`);

    const results = {
      processed: 0,
      skipped: allActivities.length - activitiesToProcess.length,
      failed: 0,
    };

    // Process activities in batches to manage concurrency
    const BATCH_SIZE = isFreeTier ? 5 : 10; // Free tier: 5 at a time, Premium: 10 at a time

    for (let i = 0; i < activitiesToProcess.length; i += BATCH_SIZE) {
      const batch = activitiesToProcess.slice(i, i + BATCH_SIZE);

      logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(activitiesToProcess.length / BATCH_SIZE)}`);

      // Trigger jobs for this batch in parallel
      const batchPromises = batch.map(async (act) => {
        try {
          // Trigger run letter if needed
          if (!existingLetterIds.has(act.activityId)) {
            await tasks.trigger("generate-run-letter", {
              activityId: act.activityId,
              userId: payload.userId,
            });
          }

          // Trigger coaching insight if needed
          if (!existingInsightIds.has(act.activityId)) {
            await tasks.trigger("generate-coaching-insight", {
              activityId: act.activityId,
              userId: payload.userId,
            });
          }

          results.processed++;
        } catch (error: any) {
          logger.error("Failed to trigger job for activity", {
            activityId: act.activityId,
            error: error.message,
          });
          results.failed++;
        }
      });

      await Promise.allSettled(batchPromises);

      // Add a small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < activitiesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
      }
    }

    logger.info("Batch ingestion complete", results);

    return {
      success: true,
      ...results,
    };
  },
});

/**
 * Single Activity Processing Task
 *
 * Triggers both letter and coaching insight generation for a single activity
 */
export const processActivityContent = task({
  id: "process-activity-content",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    activityId: string;
    userId: string;
  }) => {
    logger.info("Processing activity content", { activityId: payload.activityId });

    try {
      // Trigger both letter and coaching insight
      const [letterHandle, insightHandle] = await Promise.all([
        tasks.trigger("generate-run-letter", {
          activityId: payload.activityId,
          userId: payload.userId,
        }),
        tasks.trigger("generate-coaching-insight", {
          activityId: payload.activityId,
          userId: payload.userId,
        }),
      ]);

      logger.info("Activity content jobs triggered", {
        activityId: payload.activityId,
        letterRunId: letterHandle.id,
        insightRunId: insightHandle.id,
      });

      return {
        success: true,
        activityId: payload.activityId,
        letterRunId: letterHandle.id,
        insightRunId: insightHandle.id,
      };
    } catch (error: any) {
      logger.error("Failed to process activity", {
        activityId: payload.activityId,
        error: error.message,
      });
      throw error;
    }
  },
});
