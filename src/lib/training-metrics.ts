/**
 * Training Metrics Calculations
 *
 * Implements key fitness tracking algorithms:
 * - TRIMP (Training Impulse)
 * - ATL/CTL/TSB (Fitness/Fatigue/Form)
 * - HR Zone Analysis
 * - HR Drift Detection
 */

export interface ActivityMetrics {
  startDateTime: string;
  movingTimeInSeconds: number;
  averageHeartRate: number | null;
  maxHeartRate?: number | null;
  averagePower?: number | null;
  distance?: number;
  elevation?: number;
}

export interface HeartRateZone {
  zone: number;
  name: string;
  minHR: number;
  maxHR: number;
  percentage: number;
}

/**
 * Calculate TRIMP (Training Impulse) for an activity
 * TRIMP = duration × HR ratio × intensity factor
 */
export function calculateTRIMP(
  activity: ActivityMetrics,
  athleteMaxHR: number
): number {
  const { movingTimeInSeconds, averageHeartRate } = activity;

  if (!averageHeartRate || athleteMaxHR <= 0) {
    return 0;
  }

  const hrRatio = averageHeartRate / athleteMaxHR;
  const intensityFactor = Math.exp(1.92 * hrRatio); // Exponential weighting

  return (movingTimeInSeconds * hrRatio * intensityFactor) / 60;
}

/**
 * Calculate max heart rate using Tanaka formula
 * Most accurate: 208 - (0.7 × age)
 */
export function calculateMaxHeartRate(ageInYears: number): number {
  return Math.round(208 - 0.7 * ageInYears);
}

/**
 * Calculate 5-zone heart rate zones
 */
export function calculateHeartRateZones(maxHR: number): HeartRateZone[] {
  return [
    { zone: 1, name: "Recovery", minHR: Math.round(maxHR * 0.5), maxHR: Math.round(maxHR * 0.6), percentage: 55 },
    { zone: 2, name: "Aerobic", minHR: Math.round(maxHR * 0.6), maxHR: Math.round(maxHR * 0.7), percentage: 65 },
    { zone: 3, name: "Tempo", minHR: Math.round(maxHR * 0.7), maxHR: Math.round(maxHR * 0.8), percentage: 75 },
    { zone: 4, name: "Threshold", minHR: Math.round(maxHR * 0.8), maxHR: Math.round(maxHR * 0.9), percentage: 85 },
    { zone: 5, name: "VO2 Max", minHR: Math.round(maxHR * 0.9), maxHR: maxHR, percentage: 95 },
  ];
}

/**
 * Calculate HR drift (cardiovascular fatigue indicator)
 */
export function calculateHRDrift(hrData: number[]): number {
  if (hrData.length < 10) return 0;

  const firstSegmentEnd = Math.floor(hrData.length * 0.1);
  const firstSegment = hrData.slice(0, firstSegmentEnd);
  const avgFirstHR = firstSegment.reduce((sum, hr) => sum + hr, 0) / firstSegment.length;

  const lastSegmentStart = Math.floor(hrData.length * 0.9);
  const lastSegment = hrData.slice(lastSegmentStart);
  const avgLastHR = lastSegment.reduce((sum, hr) => sum + hr, 0) / lastSegment.length;

  return avgFirstHR > 0 ? ((avgLastHR - avgFirstHR) / avgFirstHR) * 100 : 0;
}

/**
 * Determine which HR zone a given HR falls into
 */
export function getHeartRateZone(hr: number, maxHR: number): number {
  const zones = calculateHeartRateZones(maxHR);
  for (const zone of zones) {
    if (hr >= zone.minHR && hr <= zone.maxHR) {
      return zone.zone;
    }
  }
  return hr > maxHR ? 5 : 1;
}

/**
 * Calculate time spent in each zone
 */
export function calculateTimeInZones(hrData: number[], maxHR: number) {
  const zoneCounts = new Array(5).fill(0);

  hrData.forEach((hr) => {
    if (hr > 0) {
      const zone = getHeartRateZone(hr, maxHR);
      zoneCounts[zone - 1]++;
    }
  });

  const total = hrData.length;
  return zoneCounts.map((count, index) => ({
    zone: index + 1,
    seconds: count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}
