
import { db } from "../src/db";
import { 
  activity, 
  runLetters, 
  gear, 
  segment, 
  segmentEffort, 
  challenge, 
  user, 
  athleteProfile, 
  coachingInsights, 
  activityStream, 
  generationStatus,
  userReferenceImages
} from "../src/db/schema";

async function resetDatabase() {
  console.log("🚀 Starting database reset...");

  try {
    // Order matters if foreign keys are enforced, but we'll just catch and retry or use a transaction
    // For now, simple deletion for all tables
    
    console.log("Cleaning up activity-related tables...");
    await db.delete(segmentEffort);
    await db.delete(segment);
    await db.delete(activityStream);
    await db.delete(runLetters);
    await db.delete(coachingInsights);
    await db.delete(generationStatus);
    
    console.log("Cleaning up core tables...");
    await db.delete(activity);
    await db.delete(gear);
    await db.delete(challenge);
    
    console.log("Cleaning up user-related tables...");
    await db.delete(userReferenceImages);
    await db.delete(athleteProfile);
    await db.delete(user);

    console.log("✅ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }

  process.exit(0);
}

resetDatabase();
