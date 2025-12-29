import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("../src/db");
const { sql } = require("drizzle-orm");

async function runSqlMigration() {
    const sourceUserId = '24632115';
    const targetUserId = '198411230';
    const prefix = 'DUPE_';

    console.log("Running SQL migration...");

    try {
        // 1. Migrate Activity
        await db.execute(sql`
            INSERT INTO activity (
                activityid, user_id, startdatetime, data, location, weather, gearid, sporttype, 
                devicename, name, description, distance, elevation, averagespeed, maxspeed, 
                startingcoordinatelatitude, startingcoordinatelongitude, calories, averagepower, 
                maxpower, averageheartrate, maxheartrate, averagecadence, movingtimeinseconds, 
                kudocount, totalimagecount, iscommute, markedfordeletion, streamsareimported, 
                polyline, routegeography, localimagepaths, workouttype
            )
            SELECT 
                'DUPE_' || activityid, '198411230', startdatetime, data, location, weather, gearid, sporttype, 
                devicename, name, description, distance, elevation, averagespeed, maxspeed, 
                startingcoordinatelatitude, startingcoordinatelongitude, calories, averagepower, 
                maxpower, averageheartrate, maxheartrate, averagecadence, movingtimeinseconds, 
                kudocount, totalimagecount, iscommute, markedfordeletion, streamsareimported, 
                polyline, routegeography, localimagepaths, workouttype
            FROM activity
            WHERE user_id = '24632115'
            ON CONFLICT (activityid) DO NOTHING;
        `);
        console.log("Activities migrated.");

        // 2. Migrate Activity Stream
        await db.execute(sql`
            INSERT INTO activity_stream (
                activity_id, time, distance, latlng, altitude, velocity_smooth, heartrate, 
                cadence, watts, temp, moving, grade_smooth, updated_at
            )
            SELECT 
                'DUPE_' || activity_id, time, distance, latlng, altitude, velocity_smooth, heartrate, 
                cadence, watts, temp, moving, grade_smooth, updated_at
            FROM activity_stream
            WHERE activity_id IN (SELECT activityid FROM activity WHERE user_id = '24632115')
            ON CONFLICT (activity_id) DO NOTHING;
        `);
        console.log("Streams migrated.");

        // 3. Migrate Run Letters
        await db.execute(sql`
            INSERT INTO run_letters (activity_id, letter_text, edited_text, generated_at, edited_at, share_token, is_public)
            SELECT 'DUPE_' || activity_id, letter_text, edited_text, generated_at, edited_at, share_token, is_public
            FROM run_letters
            WHERE activity_id IN (SELECT activityid FROM activity WHERE user_id = '24632115')
            ON CONFLICT (activity_id) DO NOTHING;
        `);
        console.log("Run letters migrated.");

        // 4. Migrate Coaching Insights
        await db.execute(sql`
            INSERT INTO coaching_insights (
                activity_id, run_classification, heart_rate_analysis, pacing_analysis, 
                performance_implications, recommendations, insight_text, edited_text, 
                generated_at, edited_at, share_token, is_public
            )
            SELECT 
                'DUPE_' || activity_id, run_classification, heart_rate_analysis, pacing_analysis, 
                performance_implications, recommendations, insight_text, edited_text, 
                generated_at, edited_at, share_token, is_public
            FROM coaching_insights
            WHERE activity_id IN (SELECT activityid FROM activity WHERE user_id = '24632115')
            ON CONFLICT (activity_id) DO NOTHING;
        `);
        console.log("Coaching insights migrated.");

        // 5. Migrate Generation Status
        await db.execute(sql`
            INSERT INTO generation_status (activity_id, letter_status, coaching_status, letter_error, coaching_error, started_at, completed_at)
            SELECT 'DUPE_' || activity_id, letter_status, coaching_status, letter_error, coaching_error, started_at, completed_at
            FROM generation_status
            WHERE activity_id IN (SELECT activityid FROM activity WHERE user_id = '24632115')
            ON CONFLICT (activity_id) DO NOTHING;
        `);
        console.log("Generation statuses migrated.");

        console.log("SQL Migration completed successfully.");
    } catch (error) {
        console.error("SQL Migration failed:", error);
    }

    process.exit(0);
}

runSqlMigration();
