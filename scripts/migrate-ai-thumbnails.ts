import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
});

async function runMigration() {
  try {
    console.log('Running AI Thumbnails migration...');

    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations/0008_ai_thumbnails.sql'),
      'utf-8'
    );

    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
