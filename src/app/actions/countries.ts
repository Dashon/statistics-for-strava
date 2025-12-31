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
export async function getLifetimeCountries(userId: string): Promise<CountryData[]> {
  // First try to get countries from segments (most reliable)
  // Segments have a direct countryCode field
  const segmentCountries = await db.execute<{ country_code: string; count: number }>(sql`
    SELECT DISTINCT s.countrycode as country_code, COUNT(DISTINCT a.activityid)::int as count
    FROM activity a
    LEFT JOIN segmenteffort se ON se.activityid = a.activityid
    LEFT JOIN segment s ON s.segmentid = se.segmentid
    WHERE a.user_id = ${userId}
      AND s.countrycode IS NOT NULL
      AND s.countrycode != ''
    GROUP BY s.countrycode
    ORDER BY count DESC
  `);

  // Also try to extract from activity location JSON field
  const locationCountries = await db.execute<{ country_code: string; count: number }>(sql`
    SELECT 
      location->>'country' as country_code,
      COUNT(*)::int as count
    FROM activity
    WHERE user_id = ${userId}
      AND location IS NOT NULL
      AND location->>'country' IS NOT NULL
      AND location->>'country' != ''
    GROUP BY location->>'country'
    ORDER BY count DESC
  `);

  // Merge results, prioritizing segment data
  const countryMap = new Map<string, number>();
  
  for (const row of segmentCountries) {
    if (row.country_code) {
      const code = normalizeCountryCode(row.country_code);
      if (code) {
        countryMap.set(code, (countryMap.get(code) || 0) + row.count);
      }
    }
  }

  for (const row of locationCountries) {
    if (row.country_code) {
      const code = normalizeCountryCode(row.country_code);
      if (code && !countryMap.has(code)) {
        countryMap.set(code, row.count);
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
