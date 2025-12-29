"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function generateRunLetter(activityId: string) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const run = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
  });

  if (!run) return { success: false, error: "Activity not found" };

  const data = run.data as any;
  const distanceKm = (data.distance / 1000).toFixed(2);
  const movingTime = new Date(data.moving_time * 1000).toISOString().substr(11, 8);
  const date = new Date(run.startDateTime).toLocaleDateString();
  
  const prompt = `
    Write a short, reflective "Run Letter" (approx 100-150 words) based on this run.
    The tone should be thoughtful, perhaps slightly philosophical, like a journal entry.
    Details: Date: ${date}, Distance: ${distanceKm} km, Duration: ${movingTime}, Title: ${data.name}.
    Do not use "Dear Diary". Just start writing. Focus on the feeling of showing up.
  `;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      temperature: 0.7,
      system: "You are a thoughtful running philosopher.",
      messages: [{ role: "user", content: prompt }]
    });

    const letterText = msg.content[0].type === 'text' ? msg.content[0].text : "";

    await db.insert(runLetters).values({
        activityId: activityId,
        letterText: letterText,
        generatedAt: Math.floor(Date.now() / 1000),
        isPublic: false,
    }).onConflictDoUpdate({
        target: runLetters.activityId,
        set: {
            letterText: letterText,
            generatedAt: Math.floor(Date.now() / 1000),
        }
    });

    revalidatePath("/dashboard/run-letters");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
