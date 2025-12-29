'use server';

import { db } from '@/db';
import { generationStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateRunLetter } from './letters';
import { generateCoachingInsight } from './coaching';

// Process a single activity in the background
async function processActivity(activityId: string) {
  try {
    // Update status to generating
    await db.insert(generationStatus).values({
      activityId,
      letterStatus: 'generating',
      coachingStatus: 'pending',
      startedAt: Date.now(),
    }).onConflictDoUpdate({
      target: generationStatus.activityId,
      set: {
        letterStatus: 'generating',
        startedAt: Date.now(),
      }
    });

    // Generate letter
    const letterResult = await generateRunLetter(activityId);

    if (!letterResult.success) {
      await db.update(generationStatus)
        .set({
          letterStatus: 'failed',
          letterError: letterResult.error
        })
        .where(eq(generationStatus.activityId, activityId));
    } else {
      await db.update(generationStatus)
        .set({ letterStatus: 'completed' })
        .where(eq(generationStatus.activityId, activityId));
    }

    // Generate coaching insight
    await db.update(generationStatus)
      .set({ coachingStatus: 'generating' })
      .where(eq(generationStatus.activityId, activityId));

    try {
      await generateCoachingInsight(activityId);
      await db.update(generationStatus)
        .set({
          coachingStatus: 'completed',
          completedAt: Date.now()
        })
        .where(eq(generationStatus.activityId, activityId));
    } catch (error: any) {
      await db.update(generationStatus)
        .set({
          coachingStatus: 'failed',
          coachingError: error.message,
          completedAt: Date.now()
        })
        .where(eq(generationStatus.activityId, activityId));
    }

  } catch (error: any) {
    console.error(`Failed to process activity ${activityId}:`, error);
    await db.update(generationStatus)
      .set({
        letterStatus: 'failed',
        letterError: error.message,
        completedAt: Date.now()
      })
      .where(eq(generationStatus.activityId, activityId));
  }
}

// Start generation for multiple activities (fires and forgets)
export async function startBatchGeneration(activityIds: string[]) {
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

  // Process activities sequentially in the background
  // We don't await - this runs in the background
  (async () => {
    for (const activityId of activityIds) {
      await processActivity(activityId);
    }
  })();

  return { success: true, count: activityIds.length };
}

// Get generation status for activities
export async function getGenerationStatuses(activityIds: string[]) {
  const statuses = await db.query.generationStatus.findMany({
    where: (status, { inArray }) => inArray(status.activityId, activityIds),
  });

  return statuses;
}
