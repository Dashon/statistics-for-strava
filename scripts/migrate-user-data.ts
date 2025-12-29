import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("../src/db");
const { activity, activityStream, runLetters, coachingInsights, generationStatus } = require("../src/db/schema");
const { eq } = require("drizzle-orm");

async function migrate() {
    const sourceUserId = "24632115";
    const targetUserId = "198411230";
    const idPrefix = "DUPE_";

    console.log(`Starting migration from ${sourceUserId} to ${targetUserId}...`);

    const sourceActivities = await db.query.activity.findMany({
        where: eq(activity.userId, sourceUserId),
    });

    console.log(`Found ${sourceActivities.length} activities to copy.`);

    let successCount = 0;
    let errorCount = 0;

    for (const act of sourceActivities) {
        const originalId = act.activityId;
        const newId = `${idPrefix}${originalId}`;

        console.log(`Copying activity ${originalId} -> ${newId}...`);

        try {
            // 1. Copy Activity
            console.log(`  Inserting activity...`);
            await db.insert(activity).values({
                ...act,
                activityId: newId,
                userId: targetUserId,
            }).onConflictDoNothing();

            // 2. Copy Activity Stream
            console.log(`  Checking stream...`);
            const stream = await db.query.activityStream.findFirst({
                where: eq(activityStream.activityId, originalId),
            });
            if (stream) {
                console.log(`  Inserting stream...`);
                await db.insert(activityStream).values({
                    ...stream,
                    activityId: newId,
                }).onConflictDoNothing();
            }

            // 3. Copy Run Letters
            console.log(`  Checking letters...`);
            const letter = await db.query.runLetters.findFirst({
                where: eq(runLetters.activityId, originalId),
            });
            if (letter) {
                console.log(`  Inserting letter...`);
                await db.insert(runLetters).values({
                    ...letter,
                    activityId: newId,
                }).onConflictDoNothing();
            }

            // 4. Copy Coaching Insights
            console.log(`  Checking insights...`);
            const insight = await db.query.coachingInsights.findFirst({
                where: eq(coachingInsights.activityId, originalId),
            });
            if (insight) {
                console.log(`  Inserting insight...`);
                await db.insert(coachingInsights).values({
                    ...insight,
                    activityId: newId,
                }).onConflictDoNothing();
            }

            // 5. Copy Generation Status
            console.log(`  Checking status...`);
            const status = await db.query.generationStatus.findFirst({
                where: eq(generationStatus.activityId, originalId),
            });
            if (status) {
                console.log(`  Inserting status...`);
                await db.insert(generationStatus).values({
                    ...status,
                    activityId: newId,
                }).onConflictDoNothing();
            }

            successCount++;
            console.log(`  Successfully copied activity ${originalId}.`);
        } catch (err) {
            console.error(`  Failed to copy activity ${originalId}:`, err);
            errorCount++;
        }
    }

    console.log(`Migration completed.`);
    console.log(`Successfully copied: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    process.exit(0);
}

migrate();
