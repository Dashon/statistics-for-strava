const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { db } = require("../src/db");
const { user, publicProfile, athleteProfile } = require("../src/db/schema");
const { eq, inArray } = require("drizzle-orm");

async function main() {
  console.log("Starting script to ensure all users have a public profile...");

  try {
    // 1. Get all users
    const allUsers = await db.select().from(user);
    console.log(`Found ${allUsers.length} total users.`);

    // 2. Get all existing public profiles
    const existingProfiles = await db.select({ userId: publicProfile.userId }).from(publicProfile);
    const existingUserIds = new Set(existingProfiles.map(p => p.userId));
    console.log(`Found ${existingUserIds.size} existing public profiles.`);

    // 3. Identify users without a profile
    const usersToProcess = allUsers.filter(u => !existingUserIds.has(u.userId));
    console.log(`${usersToProcess.length} users need a public profile.`);

    if (usersToProcess.length === 0) {
      console.log("All users already have a public profile.");
      return;
    }

    // 4. Get athlete profile data for these users to use as defaults
    const athleteProfiles = await db
      .select()
      .from(athleteProfile)
      .where(inArray(athleteProfile.userId, usersToProcess.map(u => u.userId)));
    
    const athleteProfileMap = new Map(athleteProfiles.map(p => [p.userId, p]));

    // 5. Create missing profiles
    console.log("Creating missing profiles...");
    
    let CreatedCount = 0;
    
    for (const u of usersToProcess) {
      const ap = athleteProfileMap.get(u.userId);
      
      // Generate a default username
      const stravaId = u.stravaAthleteId;
      const baseUsername = ap?.stravaFirstName 
          ? `${ap.stravaFirstName.toLowerCase()}${ap.stravaLastName?.toLowerCase() || ''}`.replace(/[^a-z0-9]/g, '')
          : `user${stravaId}`;
      
      const finalUsername = `${baseUsername}${stravaId}`;
      
      const displayName = ap?.stravaFirstName 
          ? `${ap.stravaFirstName} ${ap.stravaLastName || ''}`.trim()
          : `Athlete ${stravaId}`;

      const now = new Date().toISOString();

      try {
        await db.insert(publicProfile).values({
          userId: u.userId,
          username: finalUsername.substring(0, 50),
          displayName: displayName,
          isPublic: false,
          profileSetupComplete: false,
          templateId: 'runner',
          countryCode: ap?.stravaCountry || undefined,
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing();
        
        CreatedCount++;
      } catch (err) {
        console.error(`Failed to create profile for user ${u.userId}:`, err);
      }
    }

    console.log(`Successfully created ${CreatedCount} new public profiles.`);
  } catch (err) {
    console.error("Critical error in main script logic:", err);
  }
}

main().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Critical error in migration script wrapper:", err);
  process.exit(1);
});
