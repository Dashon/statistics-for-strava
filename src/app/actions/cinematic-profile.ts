'use server';

import { db } from '@/db';
import { publicProfile, activity, athleteProfile } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc, isNotNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateRunningThumbnail } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ProfileTemplate = 'runner' | 'racer' | 'global' | 'minimal';

export interface CinematicProfileUpdate {
  displayName?: string;
  tagline?: string;
  templateId?: ProfileTemplate;
  countryCode?: string;
  referencePhotoUrl?: string;
  generateHero?: boolean;
}

/**
 * Generate a cinematic hero image for the user's profile.
 * Uses Gemini AI to superimpose the user on their most recent run location.
 */
export async function generateProfileHero(): Promise<{ success: boolean; heroUrl?: string; error?: string }> {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get user's most recent activity with coordinates
    const recentActivity = await db
      .select({
        activityId: activity.activityId,
        name: activity.name,
        sportType: activity.sportType,
        distance: activity.distance,
        startDateTime: activity.startDateTime,
        startLatitude: activity.startingLatitude,
        startLongitude: activity.startingLongitude,
      })
      .from(activity)
      .where(
        and(
          eq(activity.userId, userId),
          isNotNull(activity.startingLatitude),
          isNotNull(activity.startingLongitude)
        )
      )
      .orderBy(desc(activity.startDateTime))
      .limit(1)
      .then(res => res[0]);

    if (!recentActivity || !recentActivity.startLatitude || !recentActivity.startLongitude) {
      return { success: false, error: 'No recent activity with location found' };
    }

    // Get user's reference photo
    const profile = await db
      .select({
        stravaProfilePicture: athleteProfile.stravaProfilePicture,
      })
      .from(athleteProfile)
      .where(eq(athleteProfile.userId, userId))
      .limit(1)
      .then(res => res[0]);

    // Generate the cinematic hero using Gemini
    const result = await generateRunningThumbnail({
      referenceImageUrl: profile?.stravaProfilePicture,
      latitude: recentActivity.startLatitude,
      longitude: recentActivity.startLongitude,
      activityName: recentActivity.name || undefined,
      sportType: recentActivity.sportType || 'Run',
      distance: recentActivity.distance || undefined,
      startTime: recentActivity.startDateTime,
    });

    // Upload to Supabase storage
    const fileName = `heroes/${userId}/hero_${Date.now()}.png`;
    
    // Convert base64 to buffer if needed
    let imageBuffer: Buffer;
    if (result.imageUrl.startsWith('data:')) {
      const base64Data = result.imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Fetch from URL
      const response = await fetch(result.imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload hero image:', uploadError);
      return { success: false, error: 'Failed to upload hero image' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-assets')
      .getPublicUrl(fileName);

    const heroUrl = urlData.publicUrl;

    // Update profile with new hero
    await db
      .update(publicProfile)
      .set({
        heroImageUrl: heroUrl,
        heroGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(publicProfile.userId, userId));

    revalidatePath('/dashboard/profile/layout');
    revalidatePath('/athlete/[username]', 'page');

    return { success: true, heroUrl };
  } catch (error) {
    console.error('Failed to generate hero:', error);
    return { success: false, error: 'Failed to generate hero image' };
  }
}

/**
 * Update the user's cinematic profile settings.
 */
export async function updateCinematicProfile(data: CinematicProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const now = new Date().toISOString();

    // Check if profile exists
    const existingProfile = await db
      .select({ userId: publicProfile.userId })
      .from(publicProfile)
      .where(eq(publicProfile.userId, userId))
      .limit(1);

    const updateData: Record<string, any> = {
      updatedAt: now,
    };

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.countryCode !== undefined) updateData.countryCode = data.countryCode;

    if (existingProfile.length === 0) {
      // Create new profile
      await db.insert(publicProfile).values({
        userId,
        ...updateData,
        profileSetupComplete: true,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing
      await db
        .update(publicProfile)
        .set({
          ...updateData,
          profileSetupComplete: true,
        })
        .where(eq(publicProfile.userId, userId));
    }

    // Generate hero if requested
    if (data.generateHero) {
      await generateProfileHero();
    }

    revalidatePath('/dashboard/profile/layout');
    revalidatePath('/dashboard/profile/public');
    revalidatePath('/athlete/[username]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to update cinematic profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Get the user's cinematic profile data for the wizard.
 */
export async function getCinematicProfileData() {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(publicProfile)
    .where(eq(publicProfile.userId, userId))
    .limit(1);

  const [athlete] = await db
    .select({
      stravaProfilePicture: athleteProfile.stravaProfilePicture,
      stravaCountry: athleteProfile.stravaCountry,
    })
    .from(athleteProfile)
    .where(eq(athleteProfile.userId, userId))
    .limit(1);

  return {
    displayName: profile?.displayName || undefined,
    tagline: profile?.tagline || undefined,
    templateId: (profile?.templateId as string) || 'runner',
    heroImageUrl: profile?.heroImageUrl || undefined,
    countryCode: profile?.countryCode || athlete?.stravaCountry || undefined,
    stravaProfilePicture: athlete?.stravaProfilePicture || undefined,
    profileSetupComplete: profile?.profileSetupComplete || false,
  };
}
