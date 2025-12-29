import type { AthleteProfileData } from './profile';

// Helper: Get the effective display name (custom override or Strava name)
export function getEffectiveDisplayName(profile: AthleteProfileData | null): string {
  if (!profile) return 'Athlete';
  if (profile.displayName) return profile.displayName;
  const firstName = profile.stravaFirstName || '';
  const lastName = profile.stravaLastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Athlete';
}

// Helper: Get the effective profile picture (custom override or Strava picture)
export function getEffectiveProfilePicture(profile: AthleteProfileData | null): string | null {
  if (!profile) return null;
  return profile.customProfilePicture || profile.stravaProfilePicture || null;
}

// Helper: Get the effective bio (custom override or Strava bio)
export function getEffectiveBio(profile: AthleteProfileData | null): string {
  if (!profile) return '';
  return profile.bio || profile.stravaBio || '';
}

// Helper: Get the effective location
export function getEffectiveLocation(profile: AthleteProfileData | null): string {
  if (!profile) return '';
  const parts = [profile.stravaCity, profile.stravaState, profile.stravaCountry].filter(Boolean);
  return parts.join(', ');
}
