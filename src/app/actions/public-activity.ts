'use server';

import { db } from '@/db';
import { activity, publicProfile, runLetters, coachingInsights, activityStream } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getPublicActivityDetail(activityId: string) {
  // 1. Fetch the activity
  const activityData = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
  });

  if (!activityData) return null;

  // 2. Security Check: Is the owner's profile public?
  const profile = await db.query.publicProfile.findFirst({
    where: and(
      eq(publicProfile.userId, activityData.userId),
      eq(publicProfile.isPublic, true)
    ),
  });

  if (!profile) return null;

  // 3. Fetch related public-facing data
  const [insight, stream, letter] = await Promise.all([
    db.query.coachingInsights.findFirst({
      where: eq(coachingInsights.activityId, activityId),
    }),
    db.query.activityStream.findFirst({
      where: eq(activityStream.activityId, activityId),
    }),
    db.query.runLetters.findFirst({
      where: eq(runLetters.activityId, activityId),
    }),
  ]);

  return {
    activity: activityData,
    insight,
    stream,
    letter,
    user: profile,
  };
}
