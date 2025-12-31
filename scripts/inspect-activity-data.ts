
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/db';
import { activity } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';

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

  // Check for ANY country info in segments
  const segmentCountries = await db.query.segment.findMany({
    where: isNotNull(sql`countrycode`),
    limit: 5,
    columns: { countryCode: true }
  });
  console.log('Segment Countries found:', segmentCountries);

  // Check for ANY country info in activity location
  const activitiesWithLocation = await db.execute(sql`
    SELECT location->>'country' as country 
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
