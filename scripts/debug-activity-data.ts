import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function checkActivityData() {
    const { db } = await import("../src/db");
    const { activity } = await import("../src/db/schema");
    const { desc, isNotNull } = await import("drizzle-orm");

    try {
        console.log("Querying recent activities...");
        const recentActivities = await db.query.activity.findMany({
            orderBy: [desc(activity.startDateTime)],
            limit: 5,
        });

        console.log(`Found ${recentActivities.length} activities.`);

        for (const act of recentActivities) {
            console.log(`\nID: ${act.activityId}`);
            console.log(`Name: ${act.name}`);
            console.log(`Sport: ${act.sportType}`);
            console.log(`Polyline field: ${act.polyline ? (act.polyline.substring(0, 20) + '...') : 'NULL'}`);
            console.log(`Start Lat/Lng: ${act.startingLatitude}, ${act.startingLongitude}`);
            
            // Check raw data JSON for map
            const rawData = act.data as any;
            const mapPolyline = rawData?.map?.polyline || rawData?.map?.summary_polyline;
            console.log(`Raw JSON map.polyline/summary_polyline: ${mapPolyline ? 'Present' : 'Missing'}`);
            
            console.log(`Has Polyline Logic (!!act.polyline): ${!!act.polyline}`);
        }

    } catch (e) {
        console.error("Check failed:", e);
    }
    process.exit(0);
}

checkActivityData();
