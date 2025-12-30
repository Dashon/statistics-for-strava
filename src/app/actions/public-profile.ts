'use server';

import { db } from '@/db';
import { publicProfile, activity, athleteProfile } from '@/db/schema';
import { auth } from '@/auth';
import { eq, sql, count, sum, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type SocialLinks = {
  instagram?: string;
  twitter?: string;
  strava?: string;
  youtube?: string;
};

export type PublicProfileData = {
  userId: string;
  username: string | null;
  isPublic: boolean | null;
  displayName: string | null;
  tagline: string | null;
  coverImageUrl: string | null;
  socialLinks: SocialLinks | null;
  featuredActivityId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicProfileWithStats = PublicProfileData & {
  avatarUrl: string | null;
  totalActivities: number;
  totalDistance: number;
  totalElevation: number;
};

// Check if a username is available
export async function checkUsernameAvailable(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    // Validate format: lowercase letters, numbers, underscores, 3-30 chars
    const validFormat = /^[a-z0-9_]{3,30}$/.test(username);
    if (!validFormat) {
      return { 
        available: false, 
        error: 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only' 
      };
    }

    // Reserved usernames
    const reserved = ['admin', 'api', 'dashboard', 'settings', 'profile', 'athlete', 'live', 'event'];
    if (reserved.includes(username)) {
      return { available: false, error: 'This username is reserved' };
    }

    const existing = await db
      .select({ username: publicProfile.username })
      .from(publicProfile)
      .where(eq(publicProfile.username, username))
      .limit(1);

    return { available: existing.length === 0 };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Failed to check username availability' };
  }
}

// Get the current user's public profile
export async function getMyPublicProfile(): Promise<PublicProfileData | null> {
  const session = await auth() as any;
  if (!session?.userId) {
    return null;
  }

  const profiles = await db
    .select()
    .from(publicProfile)
    .where(eq(publicProfile.userId, session.userId))
    .limit(1);

  if (!profiles[0]) return null;
  
  return {
    ...profiles[0],
    socialLinks: profiles[0].socialLinks as SocialLinks | null,
  };
}

// Get a public profile by username (for public viewing)
export async function getPublicProfileByUsername(username: string): Promise<PublicProfileWithStats | null> {
  const profiles = await db
    .select()
    .from(publicProfile)
    .where(and(
      eq(publicProfile.username, username),
      eq(publicProfile.isPublic, true)
    ))
    .limit(1);

  if (!profiles[0]) {
    return null;
  }

  const profile = profiles[0];

  // Get athlete profile for avatar
  const athleteProfiles = await db
    .select({
      avatarUrl: athleteProfile.stravaProfilePicture,
    })
    .from(athleteProfile)
    .where(eq(athleteProfile.userId, profile.userId))
    .limit(1);

  // Get activity stats
  const stats = await db
    .select({
      totalActivities: count(),
      totalDistance: sum(activity.distance),
      totalElevation: sum(activity.elevation),
    })
    .from(activity)
    .where(eq(activity.userId, profile.userId));

  return {
    ...profile,
    socialLinks: profile.socialLinks as SocialLinks | null,
    avatarUrl: athleteProfiles[0]?.avatarUrl || null,
    totalActivities: Number(stats[0]?.totalActivities) || 0,
    totalDistance: Number(stats[0]?.totalDistance) || 0,
    totalElevation: Number(stats[0]?.totalElevation) || 0,
  };
}

// Update public profile
export async function updatePublicProfile(data: {
  username?: string;
  displayName?: string;
  tagline?: string;
  coverImageUrl?: string;
  socialLinks?: SocialLinks;
  featuredActivityId?: string;
  isPublic?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth() as any;
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // If username is being changed, validate it
    if (data.username) {
      const { available, error } = await checkUsernameAvailable(data.username);
      
      // Check if user already has this username
      const existing = await db
        .select({ username: publicProfile.username })
        .from(publicProfile)
        .where(eq(publicProfile.userId, session.userId))
        .limit(1);

      // Only block if username is taken by someone else
      if (!available && existing[0]?.username !== data.username) {
        return { success: false, error: error || 'Username not available' };
      }
    }

    const now = new Date().toISOString();

    // Check if profile exists
    const existingProfile = await db
      .select({ userId: publicProfile.userId })
      .from(publicProfile)
      .where(eq(publicProfile.userId, session.userId))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create new profile
      await db.insert(publicProfile).values({
        userId: session.userId,
        username: data.username || null,
        displayName: data.displayName || null,
        tagline: data.tagline || null,
        coverImageUrl: data.coverImageUrl || null,
        socialLinks: data.socialLinks || null,
        featuredActivityId: data.featuredActivityId || null,
        isPublic: data.isPublic ?? false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing profile
      await db
        .update(publicProfile)
        .set({
          ...(data.username !== undefined && { username: data.username }),
          ...(data.displayName !== undefined && { displayName: data.displayName }),
          ...(data.tagline !== undefined && { tagline: data.tagline }),
          ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
          ...(data.socialLinks !== undefined && { socialLinks: data.socialLinks }),
          ...(data.featuredActivityId !== undefined && { featuredActivityId: data.featuredActivityId }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          updatedAt: now,
        })
        .where(eq(publicProfile.userId, session.userId));
    }

    revalidatePath('/dashboard/profile/public');
    if (data.username) {
      revalidatePath(`/athlete/${data.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating public profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}
