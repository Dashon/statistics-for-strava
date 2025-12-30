import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function checkAiSchema() {
    const { db } = await import("../src/db");
    const { sql } = await import("drizzle-orm");

    try {
        console.log("Checking for AI columns in 'activity' table...");
        const results = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'activity' 
            AND column_name IN ('ai_thumbnail_url', 'ai_thumbnail_prompt', 'ai_thumbnail_generated_at');
        `);
        
        const found = results.map((r: any) => r.column_name);
        console.log("Found columns:", found);
        
        if (found.length === 3) {
            console.log("✅ All AI columns present.");
        } else {
            console.log("❌ Missing columns:", ['ai_thumbnail_url', 'ai_thumbnail_prompt', 'ai_thumbnail_generated_at'].filter(c => !found.includes(c)));
        }
    } catch (e) {
        console.error("Check failed:", e);
    }
    process.exit(0);
}

checkAiSchema();
