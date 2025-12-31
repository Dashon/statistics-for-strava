
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { db } = require("../src/db");
const { runLetters, activity } = require("../src/db/schema");
const { count, eq, and } = require("drizzle-orm");

async function verifyLogic() {
  // Simulate fetching as owner (should see all for that user)
  // First get a user who has letters
  const result = await db.select({ 
      userId: activity.userId, 
      count: count() 
  })
  .from(runLetters)
  .innerJoin(activity, eq(runLetters.activityId, activity.activityId))
  .groupBy(activity.userId)
  .limit(1);

  if (result.length === 0) {
      console.log("No users with letters found.");
      return;
  }

  const userId = result[0].userId;
  console.log(`Testing with User ID: ${userId} who has ${result[0].count} letters.`);

  // Test 1: As Owner
  const lettersConditions = [
      eq(activity.userId, userId)
  ];
  // Owner sees everything, so we don't add public check.
  
  const ownerView = await db
    .select({ count: count() })
    .from(runLetters)
    .innerJoin(activity, eq(runLetters.activityId, activity.activityId))
    .where(and(...lettersConditions));
    
  console.log(`Owner View Count: ${ownerView[0].count} (Should be ${result[0].count})`);

  // Test 2: As Visitor
  const visitorConditions = [
      eq(activity.userId, userId),
      eq(runLetters.isPublic, true)
  ];
  
  const visitorView = await db
    .select({ count: count() })
    .from(runLetters)
    .innerJoin(activity, eq(runLetters.activityId, activity.activityId))
    .where(and(...visitorConditions));

  console.log(`Visitor View Count: ${visitorView[0].count} (Should be 0 based on previous checks)`);
}

verifyLogic().catch(console.error);
