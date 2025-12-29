'use server';

import { auth } from "@/auth";
import { db } from "@/db";
import { athleteProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AthleteProfileData {
  // Strava synced fields (read-only for user)
  stravaFirstName?: string | null;
  stravaLastName?: string | null;
  stravaProfilePicture?: string | null;
  stravaBio?: string | null;
  stravaWeight?: number | null;
  stravaHeight?: number | null;
  stravaCity?: string | null;
  stravaState?: string | null;
  stravaCountry?: string | null;
  sex?: string | null;
  // User override fields
  displayName?: string | null;
  customProfilePicture?: string | null;
  bio?: string | null;
  // Performance metrics
  maxHeartRate?: number | null;
  restingHeartRate?: number | null;
  functionalThresholdPower?: number | null;
  weight?: number | null;
  heightInCm?: number | null;
  dateOfBirth?: string | null;
}

export async function getAthleteProfile() {
  const session = await auth() as any;
  if (!session?.userId) {
    return null; // Return null for unauthenticated users instead of throwing
  }

  const [profile] = await db
    .select()
    .from(athleteProfile)
    .where(eq(athleteProfile.userId, session.userId));

  return profile || null;
}

export async function updateAthleteProfile(data: AthleteProfileData) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error("Not authenticated");
  }

  const existing = await getAthleteProfile();

  if (existing) {
    await db
      .update(athleteProfile)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(athleteProfile.userId, session.userId));
  } else {
    await db.insert(athleteProfile).values({
      userId: session.userId,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  return { success: true };
}
