
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function main() {
    console.log("Connecting to database...");
    
    // List tables
    const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `;
    
    console.log("Tables found:", tables.map(t => t.table_name).join(', '));

    for (const table of tables) {
        const tableName = table.table_name;
        console.log(`\n\n--- Table: ${tableName} ---`);
        
        const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = ${tableName}
            ORDER BY ordinal_position
        `;
        
        columns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
    }

    await sql.end();
}

main().catch(console.error);
