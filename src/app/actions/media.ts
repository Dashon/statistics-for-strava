'use server';

import { db } from '@/db';
import { activity, publicProfile } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Update the AI Thumbnail / Background for an activity manually.
 * This overrides any AI generated image.
 */
export async function updateActivityImage(activityId: string, imageUrl: string) {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify ownership
    const existing = await db
      .select({ activityId: activity.activityId })
      .from(activity)
      .where(and(eq(activity.activityId, activityId), eq(activity.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Activity not found or unauthorized' };
    }

    // Update the record
    await db
      .update(activity)
      .set({
        aiThumbnailUrl: imageUrl,
        // Optional: clear prompt or mark as manually overridden if we had a flag
        // aiThumbnailPrompt: null 
      })
      .where(eq(activity.activityId, activityId));

    revalidatePath(`/dashboard/activities/${activityId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update activity image:', error);
    return { success: false, error: 'Failed to update image' };
  }
}

/**
 * Generate a signed upload URL for general media assets (Profile or Activity)
 * folder: 'heroes' | 'activities' | 'accolades'
 */
export async function getMediaUploadUrl(folder: 'heroes' | 'activities' | 'accolades', extension: string) {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) return { error: "Unauthorized" };

  // Organize by user ID
  const fileName = `${folder}/${userId}/${Date.now()}_${crypto.randomUUID()}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from('profile-assets') 
    .createSignedUploadUrl(fileName);

  if (error) {
    console.error('Error creating signed url:', error);
    return { error: error.message };
  }

  return { 
    signedUrl: data.signedUrl, 
    path: fileName,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-assets/${fileName}`
  };
}

/**
 * Update the profile hero image manually
 */
export async function updateProfileHero(imageUrl: string) {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
     await db
      .update(publicProfile)
      .set({
        heroImageUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(publicProfile.userId, userId));

    revalidatePath('/dashboard/profile/layout');
    revalidatePath('/athlete/[username]', 'page');
    return { success: true };
  } catch (error) {
    console.error("Error updating profile hero:", error);
    return { success: false, error: "Failed to update profile hero" };
  }
}
