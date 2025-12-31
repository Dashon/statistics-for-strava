
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '@/db';
import { publicProfile, athleteProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Running profile query...');
  
  try {
    const profile = await db
      .select({
        userId: publicProfile.userId,
        displayName: publicProfile.displayName,
        tagline: publicProfile.tagline,
        coverImageUrl: publicProfile.coverImageUrl,
        // Duplicating these to match the failing query
        avatarUrl: athleteProfile.stravaProfilePicture,
        stravaProfilePicture: athleteProfile.stravaProfilePicture,
        socialLinks: publicProfile.socialLinks,
        layoutConfig: publicProfile.layoutConfig,
        heroImageUrl: publicProfile.heroImageUrl,
        templateId: publicProfile.templateId,
        accolades: publicProfile.accolades,
        countryCode: publicProfile.countryCode,
      })
      .from(publicProfile)
      .leftJoin(athleteProfile, eq(publicProfile.userId, athleteProfile.userId))
      .where(eq(publicProfile.username, 'dashon'))
      .limit(1);

    console.log('Query success:', profile);
  } catch (err) {
    console.error('Query Failed!');
    console.error(err);
  }
}

main().catch(console.error).then(() => process.exit(0));
