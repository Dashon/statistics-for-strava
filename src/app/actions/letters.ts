"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { activity, runLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are a thoughtful running philosopher." },
        { role: "user", content: prompt }
      ]
    });

    const rawText = response.choices[0].message.content || "";

    // Strip markdown formatting for cleaner display
    const letterText = rawText
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic *text*
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/^[-*]\s+/gm, '') // Remove bullet points
      .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines

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

export async function toggleLetterVisibility(activityId: string, isPublic: boolean) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await db.update(runLetters)
      .set({ isPublic })
      .where(eq(runLetters.activityId, activityId));

    revalidatePath("/dashboard/run-letters");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

