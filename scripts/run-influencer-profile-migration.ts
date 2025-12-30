// Run influencer profile migration
import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(databaseUrl);
  
  console.log('Running influencer profile migration...');
  
  const migrationSql = readFileSync(
    join(__dirname, 'migrations/002_influencer_profile.sql'),
    'utf-8'
  );

  await sql.unsafe(migrationSql);
  
  console.log('Migration completed successfully!');
  
  await sql.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
