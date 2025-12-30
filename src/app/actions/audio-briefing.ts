
"use server";

import { auth } from "@/auth";
import { tasks } from "@trigger.dev/sdk";

export async function generateDailyBriefing() {
  const session = (await auth()) as any;
  
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
     const today = new Date().toISOString().split('T')[0];
     const handle = await tasks.trigger("generate-audio-briefing", {
        userId: session.userId
     }, {
        idempotencyKey: `audio-briefing-${session.userId}-${today}` 
     });
     
     return { success: true, taskId: handle.id };
  } catch (error) {
    console.error("Briefing Trigger Error:", error);
    throw new Error("Failed to start briefing generation");
  }
}



export async function getBriefingStatus() {
  const session = (await auth()) as any;
  if (!session?.userId) return { status: 'unauthorized' };

  try {
     const today = new Date().toISOString().split('T')[0];
     
     // Check if we have a URL in the database
     const record = await import("@/db").then(m => m.db.query.athleteReadiness.findFirst({
         where: (readiness, { and, eq }) => and(
             eq(readiness.userId, session.userId),
             eq(readiness.date, today)
         ),
         columns: {
             audioUrl: true
         }
     }));

     if (record?.audioUrl) {
         return { status: 'completed', audioUrl: record.audioUrl };
     }
     
     return { status: 'pending' };

  } catch (error) {
      console.error("Status check failed", error);
      return { status: 'error' };
  }
}
