'use server';

import { auth } from '@/auth';
import { tasks } from '@trigger.dev/sdk';
import { db } from '@/db';
import { generationStatus } from '@/db/schema';

/**
 * Trigger content generation for a single activity
 */
export async function triggerActivityGeneration(activityId: string) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  // Initialize generation status
  await db.insert(generationStatus).values({
    activityId,
    letterStatus: 'pending',
    coachingStatus: 'pending',
  }).onConflictDoUpdate({
    target: generationStatus.activityId,
    set: {
      letterStatus: 'pending',
      coachingStatus: 'pending',
      letterError: null,
      coachingError: null,
      startedAt: null,
      completedAt: null,
    }
  });

  // Trigger the job
  const handle = await tasks.trigger("process-activity-content", {
    activityId,
    userId: session.userId,
  });

  return {
    success: true,
    runId: handle.id,
    activityId,
  };
}

/**
 * Trigger batch generation for multiple activities
 */
export async function triggerBatchGeneration(activityIds: string[]) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  // Initialize all statuses
  for (const activityId of activityIds) {
    await db.insert(generationStatus).values({
      activityId,
      letterStatus: 'pending',
      coachingStatus: 'pending',
    }).onConflictDoUpdate({
      target: generationStatus.activityId,
      set: {
        letterStatus: 'pending',
        coachingStatus: 'pending',
        letterError: null,
        coachingError: null,
        startedAt: null,
        completedAt: null,
      }
    });
  }

  // Trigger jobs for each activity in parallel
  const handles = await Promise.all(
    activityIds.map(activityId =>
      tasks.trigger("process-activity-content", {
        activityId,
        userId: session.userId,
      })
    )
  );

  return {
    success: true,
    count: activityIds.length,
    runIds: handles.map(h => h.id),
  };
}

/**
 * Trigger full history ingestion (premium feature)
 */
export async function triggerHistoryIngestion(tier: "free" | "premium" = "free", maxActivities?: number) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  // TODO: Check if user has premium access
  // For now, anyone can trigger, but we'll limit based on tier

  const handle = await tasks.trigger("batch-ingest-run-history", {
    userId: session.userId,
    tier,
    maxActivities,
  });

  return {
    success: true,
    runId: handle.id,
    tier,
  };
}

/**
 * Get generation statuses (reuse from existing)
 */
export { getGenerationStatuses } from './generation-queue';
