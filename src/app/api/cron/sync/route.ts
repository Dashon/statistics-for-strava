import { db } from "@/db";
import { user } from "@/db/schema";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

/**
 * Vercel Cron Endpoint - Daily Strava Sync
 * Schedule: 10 15 * * * (15:10 UTC)
 * 
 * This endpoint triggers a full historical sync for every user in the database.
 * The actual sync runs in the background via Trigger.dev to avoid Vercel timeouts.
 */
export async function GET(request: Request) {
  // Security Check: Verify Vercel Cron Secret
  const authHeader = request.headers.get('Authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allUsers = await db.select().from(user);
    
    console.log(`Cron: Triggering sync for ${allUsers.length} users`);

    const triggers = await Promise.allSettled(
      allUsers.map(u => 
        tasks.trigger("sync-strava-history", { userId: u.userId })
      )
    );

    const successful = triggers.filter(t => t.status === 'fulfilled').length;
    const failed = triggers.filter(t => t.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Triggered sync for ${successful} users (${failed} failed)`,
      details: {
        totalUsers: allUsers.length,
        successful,
        failed
      }
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
