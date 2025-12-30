
/**
 * Unit Conversion Utilities
 */

export type MeasurementUnit = 'metric' | 'imperial';

const METERS_TO_MILES = 0.000621371;
const METERS_TO_KM = 0.001;

/**
 * Convert meters to the preferred unit value
 */
export function convertDistance(meters: number, unit: MeasurementUnit): number {
  if (unit === 'imperial') {
    return meters * METERS_TO_MILES;
  }
  return meters * METERS_TO_KM;
}

/**
 * Get the distance unit label
 */
export function getDistanceUnit(unit: MeasurementUnit): string {
  return unit === 'imperial' ? 'mi' : 'km';
}

/**
 * Format distance value with its unit label
 */
export function formatDistance(meters: number, unit: MeasurementUnit = 'imperial', decimals: number = 1): string {
  const value = convertDistance(meters, unit);
  return `${value.toFixed(decimals)} ${getDistanceUnit(unit)}`;
}

/**
 * Convert speed (meters per second) to preferred unit (km/h or mph)
 */
export function formatSpeed(mps: number, unit: MeasurementUnit = 'imperial', decimals: number = 1): string {
  if (unit === 'imperial') {
    const mph = mps * 2.23694;
    return `${mph.toFixed(decimals)} mph`;
  }
  const kmh = mps * 3.6;
  return `${kmh.toFixed(decimals)} km/h`;
}
