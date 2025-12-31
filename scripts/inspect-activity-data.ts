
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/db';
import { activity, segment } from '@/db/schema';
import { desc, isNotNull, sql } from 'drizzle-orm';

async function main() {
  const activities = await db.query.activity.findMany({
    limit: 5,
    orderBy: [desc(activity.startDateTime)],
    columns: {
      activityId: true,
      name: true,
      location: true,
      data: true,
      startDateTime: true
    }
  });

  console.log('Found', activities.length, 'activities');
  
  for (const act of activities) {
    console.log(`\nActivity: ${act.name} (${act.activityId})`);
    console.log('Location Field:', JSON.stringify(act.location, null, 2));
    
    // Check inside 'data' for location country info
    const anyData = act.data as any;
    console.log('Data - location_country:', anyData.location_country);
    console.log('Data - location_city:', anyData.location_city);
    console.log('Data - start_latlng:', anyData.start_latlng);
  }

  // Check for ANY country info in segments
  const segmentCountries = await db.query.segment.findMany({
    where: isNotNull(segment.countryCode),
    limit: 5,
    columns: { countryCode: true }
  });
  console.log('Segment Countries found:', segmentCountries);

  // Check for ANY country info in activity location
  // Note: location is TEXT in db, need to cast to jsonb
  const activitiesWithLocation = await db.execute(sql`
    SELECT location::jsonb->>'country' as country 
    FROM activity 
    WHERE location IS NOT NULL 
    LIMIT 5
  `);
  console.log('Activity Location Countries found:', activitiesWithLocation);

  // Check valid lat/lng as fallback
  const activitiesWithCoords = await db.query.activity.findMany({
    where: isNotNull(sql`startingcoordinatelatitude`),
    limit: 5,
    columns: { activityId: true, startingLatitude: true, startingLongitude: true }
  });
  console.log('Activities with Coords:', activitiesWithCoords.length);

}

main().catch(console.error).then(() => process.exit(0));
