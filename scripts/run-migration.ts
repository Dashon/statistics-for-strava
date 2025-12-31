import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '003_races_system.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('Running migration with Drizzle...');
  
  // Remove comments and split by semicolon
  const statements = migrationSql
    .replace(/--.*$/gm, '') // Remove single line comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
      console.log('✓ Executed:', statement.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (err: any) {
      // Ignore "relation already exists" or "column already exists" errors
      if (err.code === '42P07' || err.code === '42701') {
         console.log('• Skipped (already exists):', statement.substring(0, 50).replace(/\n/g, ' '));
      } else {
         console.error('✗ Error executing:', statement.substring(0, 50));
         console.error(err.message);
      }
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
