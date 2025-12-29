
import NextAuth from "next-auth";
import Strava from "next-auth/providers/strava";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  },
});
