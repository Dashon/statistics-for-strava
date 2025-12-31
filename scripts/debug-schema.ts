
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Checking table columns...');
  
  const publicProfileCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'public_profile';
  `);
  console.log('\npublic_profile columns:', publicProfileCols.map(r => r.column_name));

  const athleteProfileCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'athlete_profile';
  `);
  console.log('\nathlete_profile columns:', athleteProfileCols.map(r => r.column_name));
}

main().catch(console.error).then(() => process.exit(0));
