import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("../src/db");
const { activity } = require("../src/db/schema");
const { eq } = require("drizzle-orm");

const { user, athleteProfile } = require("../src/db/schema");

async function checkData() {
    const sourceUserId = "24632115";
    const targetUserId = "198411230";

    const activities = await db.query.activity.findMany({
        where: eq(activity.userId, sourceUserId),
    });

    console.log(`Source user ${sourceUserId} has ${activities.length} activities.`);
    
    const targetActivities = await db.query.activity.findMany({
        where: eq(activity.userId, targetUserId),
    });
    console.log(`Target user ${targetUserId} has ${targetActivities.length} activities.`);

    const targetUser = await db.query.user.findFirst({
        where: eq(user.userId, targetUserId),
    });
    console.log(`Target user ${targetUserId} exists in User table: ${!!targetUser}`);

    const targetProfile = await db.query.athleteProfile.findFirst({
        where: eq(athleteProfile.userId, targetUserId),
    });
    console.log(`Target user ${targetUserId} exists in AthleteProfile table: ${!!targetProfile}`);

    process.exit(0);
}

checkData();
