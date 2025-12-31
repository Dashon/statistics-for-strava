import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`; // Seconds 00 for visuals
}

export function formatDistance(meters: number): string {
  // Convert meters to miles
  const miles = meters * 0.000621371;
  return Math.round(miles).toLocaleString();
}

export function formatElevation(meters: number): string {
  // Convert meters to feet
  const feet = meters * 3.28084;
  return Math.round(feet).toLocaleString();
}
