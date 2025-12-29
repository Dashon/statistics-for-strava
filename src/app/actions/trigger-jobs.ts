'use server';

import { auth } from '@/auth';
import { tasks } from '@trigger.dev/sdk/v3';
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
 * Trigger full history ingestion for all users
 */
export async function triggerHistoryIngestion() {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  const handle = await tasks.trigger("batch-ingest-run-history", {
    userId: session.userId,
  });

  return {
    success: true,
    runId: handle.id,
  };
}

/**
 * Get generation statuses for activities
 */
export async function getGenerationStatuses(activityIds: string[]) {
  const statuses = await db.query.generationStatus.findMany({
    where: (status, { inArray }) => inArray(status.activityId, activityIds),
  });

  return statuses;
}
