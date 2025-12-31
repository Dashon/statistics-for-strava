
import NextAuth from "next-auth";
import Strava from "next-auth/providers/strava";
import { db } from "@/db";
import { user, athleteProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Strava({
      clientId: process.env.AUTH_STRAVA_ID,
      clientSecret: process.env.AUTH_STRAVA_SECRET,
      authorization: {
        params: {
          scope: "read,activity:read_all,profile:read_all",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile && profile.id) {
        const expiresAt = new Date(account.expires_at! * 1000);
        
        const userData = {
          userId: profile.id.toString(),
          stravaAthleteId: Number(profile.id),
          stravaAccessToken: account.access_token!,
          stravaRefreshToken: account.refresh_token!,
          stravaTokenExpiresAt: expiresAt.toISOString(),
          updatedAt: new Date().toISOString(),
          roles: [],
        };

        const existingUser = await db.query.user.findFirst({
           where: eq(user.userId, userData.userId)
        });

        if (existingUser) {
           await db.update(user).set(userData).where(eq(user.userId, userData.userId));
        } else {
           await db.insert(user).values({
               ...userData,
               createdAt: new Date().toISOString(),
           });
        }

        // Sync Strava profile info to athlete_profile
        const stravaProfile = profile as any;
        const profileData = {
          stravaFirstName: stravaProfile.firstname || stravaProfile.first_name || null,
          stravaLastName: stravaProfile.lastname || stravaProfile.last_name || null,
          stravaProfilePicture: stravaProfile.profile_medium || stravaProfile.profile || null,
          stravaBio: stravaProfile.bio || null,
          stravaWeight: stravaProfile.weight || null,
          stravaCity: stravaProfile.city || null,
          stravaState: stravaProfile.state || null,
          stravaCountry: stravaProfile.country || null,
          sex: stravaProfile.sex || null,
          updatedAt: new Date().toISOString(),
        };

        const existingProfile = await db.query.athleteProfile.findFirst({
          where: eq(athleteProfile.userId, userData.userId)
        });

        if (existingProfile) {
          await db.update(athleteProfile)
            .set(profileData)
            .where(eq(athleteProfile.userId, userData.userId));
        } else {
          await db.insert(athleteProfile).values({
            userId: userData.userId,
            ...profileData,
          });
        }

        token.accessToken = account.access_token;
        token.userId = profile.id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).userId = token.userId;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
});
