
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { db } = require("../src/db");
const { activity } = require("../src/db/schema");
const { desc } = require("drizzle-orm");

async function checkDateFormat() {
  const result = await db.select({ 
      ActivityId: activity.activityId,
      StartDateTime: activity.startDateTime 
  })
  .from(activity)
  .orderBy(desc(activity.startDateTime))
  .limit(1);

  if (result.length > 0) {
      const date = result[0].StartDateTime;
      console.log(`Raw StartDateTime: "${date}"`);
      console.log(`Split('T'):`, date.split('T'));
      console.log(`Split(' '):`, date.split(' '));
  } else {
      console.log("No activities found.");
  }
}

checkDateFormat().catch(console.error);
