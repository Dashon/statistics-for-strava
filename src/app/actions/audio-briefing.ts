
"use server";

import { TrainingDirector } from "@/lib/agents/training-director";
import { auth } from "@/auth";

export async function generateDailyBriefing() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
     const audioUrl = await TrainingDirector.generateAudioBriefing(session.user.id);
     return { success: true, audioUrl };
  } catch (error) {
    console.error("Briefing Generation Error:", error);
    throw new Error("Failed to generate briefing");
  }
}
