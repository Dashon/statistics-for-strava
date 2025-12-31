'use server';

import { db } from '@/db';
import { activity, segment } from '@/db/schema';
import { eq, sql, isNotNull, and } from 'drizzle-orm';

interface CountryData {
  countryCode: string;
  activityCount: number;
}

/**
 * Get unique countries a user has recorded activities in.
 * 
 * Strategy:
 * 1. Check segment.countryCode for activities with segment data
 * 2. Fallback to activity.location.country if available
 * 3. Returns ISO 2-letter country codes with activity counts
 */
// ... imports

/**
 * Get unique countries a user has recorded activities in.
 */
export async function getLifetimeCountries(userId: string): Promise<CountryData[]> {
  const countryMap = new Map<string, number>();

  // 1. Get countries from segments (most reliable)
  const segmentCountries = await db.execute<{ country_code: string; count: number }>(sql`
    SELECT DISTINCT s.countrycode as country_code, COUNT(DISTINCT a.activityid)::int as count
    FROM activity a
    LEFT JOIN segmenteffort se ON se.activityid = a.activityid
    LEFT JOIN segment s ON s.segmentid = se.segmentid
    WHERE a.user_id = ${userId}
      AND s.countrycode IS NOT NULL
      AND s.countrycode != ''
    GROUP BY s.countrycode
  `);

  for (const row of segmentCountries) {
    if (row.country_code) {
      const code = normalizeCountryCode(row.country_code);
      if (code) {
        countryMap.set(code, (countryMap.get(code) || 0) + row.count);
      }
    }
  }

  // 2. Get countries from activity location metadata
  // We prioritize 'country_code' (ISO) but fallback to 'country' (Full name)
  const locationCountries = await db.execute<{ country_code: string; count: number }>(sql`
    SELECT 
      COALESCE(location::jsonb->>'country_code', location::jsonb->>'country') as country_code,
      COUNT(*)::int as count
    FROM activity
    WHERE user_id = ${userId}
      AND location IS NOT NULL
      AND (
        (location::jsonb->>'country_code' IS NOT NULL AND location::jsonb->>'country_code' != '')
        OR
        (location::jsonb->>'country' IS NOT NULL AND location::jsonb->>'country' != '')
      )
    GROUP BY COALESCE(location::jsonb->>'country_code', location::jsonb->>'country')
  `);

  for (const row of locationCountries) {
    if (row.country_code) {
      const code = normalizeCountryCode(row.country_code);
      if (code && !countryMap.has(code)) {
        countryMap.set(code, (countryMap.get(code) || 0) + row.count);
      }
    }
  }

  // 3. FALLBACK: Lazy Backfill for Missing Data
  // If we have very little data (e.g. < 2 countries or total count is low compared to expected),
  // we check for activities with coordinates but NO location data.
  // This helps for older imports or Strava API limits.
  
  if (countryMap.size < 2) {
    // Find top 3 clusters of activities without country data
    // Group by rounded lat/lng (approx 11km precision)
    const clusters = await db.execute<{ lat: number; lng: number; count: number }>(sql`
      SELECT 
        ROUND(startingcoordinatelatitude::numeric, 1) as lat, 
        ROUND(startingcoordinatelongitude::numeric, 1) as lng,
        COUNT(*)::int as count
      FROM activity
      WHERE user_id = ${userId}
        AND startingcoordinatelatitude IS NOT NULL
        AND (location IS NULL OR location::jsonb->>'country' IS NULL)
      GROUP BY lat, lng
      ORDER BY count DESC
      LIMIT 3
    `);

    // Process each cluster to find country
    for (const cluster of clusters) {
      try {
        console.log(`[Countries] Backfilling cluster: ${cluster.lat}, ${cluster.lng} (Count: ${cluster.count})`);
        
        // 1. Reverse Geocode (Nominatim)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${cluster.lat}&lon=${cluster.lng}&zoom=3`,
          { headers: { 'User-Agent': 'StatisticsForStrava/2.0' } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const countryCode = data.address?.country_code?.toUpperCase(); // "us", "de" -> "US", "DE"

        if (countryCode) {
           const normalized = normalizeCountryCode(countryCode);
           if (normalized) {
             // Add to our map
             countryMap.set(normalized, (countryMap.get(normalized) || 0) + cluster.count);
             
             // 2. Persist to DB (Update all activities in this cluster)
             // We update generic location JSON. 
             // Ideally we'd be more precise, but for flags, rough cluster country is fine.
             await db.execute(sql`
                UPDATE activity 
                SET location = (jsonb_set(
                    COALESCE(location::jsonb, '{}'::jsonb), 
                    '{country}', 
                    ${JSON.stringify(data.address.country || "")}::jsonb
                ) || jsonb_build_object('country_code', ${countryCode}::text))::text
                WHERE user_id = ${userId}
                  AND ROUND(startingcoordinatelatitude::numeric, 1) = ${cluster.lat}
                  AND ROUND(startingcoordinatelongitude::numeric, 1) = ${cluster.lng}
                  AND (location IS NULL OR location::jsonb->>'country' IS NULL)
             `);
           }
        }
        
        // Respect rate limits lightly
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        console.error("Failed to backfill country:", err);
      }
    }
  }

  // Convert to array and sort by count
  return Array.from(countryMap.entries())
    .map(([countryCode, activityCount]) => ({ countryCode, activityCount }))
    .sort((a, b) => b.activityCount - a.activityCount);
}

/**
 * Normalize country codes to ISO 3166-1 alpha-2 format
 */
function normalizeCountryCode(code: string): string | null {
  if (!code) return null;
  
  // Already 2-letter code
  const upper = code.trim().toUpperCase();
  if (upper.length === 2) {
    return upper;
  }
  
  // Common full country name mappings
  const countryMap: Record<string, string> = {
    'UNITED STATES': 'US',
    'USA': 'US',
    'UNITED KINGDOM': 'GB',
    'UK': 'GB',
    'THAILAND': 'TH',
    'JAPAN': 'JP',
    'CHINA': 'CN',
    'GERMANY': 'DE',
    'FRANCE': 'FR',
    'ITALY': 'IT',
    'SPAIN': 'ES',
    'AUSTRALIA': 'AU',
    'CANADA': 'CA',
    'BRAZIL': 'BR',
    'MEXICO': 'MX',
    'INDIA': 'IN',
    'SOUTH KOREA': 'KR',
    'KOREA': 'KR',
    'NETHERLANDS': 'NL',
    'BELGIUM': 'BE',
    'SWITZERLAND': 'CH',
    'AUSTRIA': 'AT',
    'PORTUGAL': 'PT',
    'SWEDEN': 'SE',
    'NORWAY': 'NO',
    'DENMARK': 'DK',
    'FINLAND': 'FI',
    'POLAND': 'PL',
    'IRELAND': 'IE',
    'NEW ZEALAND': 'NZ',
    'SINGAPORE': 'SG',
    'HONG KONG': 'HK',
    'TAIWAN': 'TW',
    'VIETNAM': 'VN',
    'INDONESIA': 'ID',
    'MALAYSIA': 'MY',
    'PHILIPPINES': 'PH',
  };
  
  return countryMap[upper] || null;
}
