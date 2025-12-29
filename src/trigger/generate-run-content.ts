import { task, logger } from "@trigger.dev/sdk";
import { db } from "@/db";
import { activity, runLetters, coachingInsights, generationStatus, athleteProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import {
  calculateHRDrift,
  calculateHeartRateZones,
  calculateTimeInZones,
  calculateMaxHeartRate,
} from "@/lib/training-metrics";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Helper function to strip markdown
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic *text*
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/^[-*]\s+/gm, '') // Remove bullet points
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines
}

/**
 * Generate Run Letter - Creates poetic reflection on a running activity
 */
export const generateRunLetterTask = task({
  id: "generate-run-letter",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { activityId: string; userId: string }) => {
    logger.info("Generating run letter", { activityId: payload.activityId });

    // Update status to generating
    await db.insert(generationStatus).values({
      activityId: payload.activityId,
      letterStatus: 'generating',
      coachingStatus: 'pending',
      startedAt: Date.now(),
    }).onConflictDoUpdate({
      target: generationStatus.activityId,
      set: {
        letterStatus: 'generating',
        startedAt: Date.now(),
        letterError: null,
      }
    });

    try {
      // Fetch activity data
      const run = await db.query.activity.findFirst({
        where: eq(activity.activityId, payload.activityId),
      });

      if (!run) {
        throw new Error('Activity not found');
      }

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

      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        temperature: 0.7,
        system: "You are a thoughtful running philosopher.",
        messages: [{ role: "user", content: prompt }]
      });

      const rawText = msg.content[0].type === 'text' ? msg.content[0].text : "";
      const letterText = stripMarkdown(rawText);

      // Save to database
      await db.insert(runLetters).values({
        activityId: payload.activityId,
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

      // Update status to completed
      await db.update(generationStatus)
        .set({ letterStatus: 'completed' })
        .where(eq(generationStatus.activityId, payload.activityId));

      logger.info("Run letter generated successfully", { activityId: payload.activityId });

      return { success: true, activityId: payload.activityId };
    } catch (error: any) {
      logger.error("Failed to generate run letter", { error: error.message });

      // Update status to failed
      await db.update(generationStatus)
        .set({
          letterStatus: 'failed',
          letterError: error.message
        })
        .where(eq(generationStatus.activityId, payload.activityId));

      throw error;
    }
  },
});

/**
 * Generate Coaching Insight - Creates AI-powered performance analysis
 */
export const generateCoachingInsightTask = task({
  id: "generate-coaching-insight",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { activityId: string; userId: string }) => {
    logger.info("Generating coaching insight", { activityId: payload.activityId });

    // Update status to generating
    await db.update(generationStatus)
      .set({ coachingStatus: 'generating' })
      .where(eq(generationStatus.activityId, payload.activityId));

    try {
      // Fetch activity data
      const activityData = await db.query.activity.findFirst({
        where: eq(activity.activityId, payload.activityId),
      });

      if (!activityData) {
        throw new Error('Activity not found');
      }

      // Get athlete profile for max HR
      const profile = await db.query.athleteProfile.findFirst({
        where: eq(athleteProfile.userId, payload.userId),
      });

      const athleteMaxHR = profile?.maxHeartRate || calculateMaxHeartRate(35);

      // Build coaching prompt
      const { name, distance, movingTimeInSeconds, averageHeartRate, elevation } = activityData;
      const distanceKm = (distance! / 1000).toFixed(2);
      const durationMin = Math.floor(movingTimeInSeconds! / 60);
      const avgPaceMinPerKm = movingTimeInSeconds! / (distance! / 1000) / 60;
      const avgPaceDisplay = `${Math.floor(avgPaceMinPerKm)}:${Math.floor((avgPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}`;

      let prompt = `Analyze this running activity:\n\n`;
      prompt += `**Activity**: ${name}\n`;
      prompt += `**Distance**: ${distanceKm} km\n`;
      prompt += `**Duration**: ${durationMin} minutes\n`;
      prompt += `**Average Pace**: ${avgPaceDisplay} min/km\n`;
      prompt += `**Elevation Gain**: ${elevation?.toFixed(0) || 0} m\n\n`;

      if (averageHeartRate && athleteMaxHR) {
        const hrPercent = ((averageHeartRate / athleteMaxHR) * 100).toFixed(0);
        prompt += `**Heart Rate**: Average ${averageHeartRate} bpm (${hrPercent}% of max)\n\n`;
      }

      prompt += `Provide a comprehensive coaching analysis covering:\n`;
      prompt += `1. What type of workout was this? (classification)\n`;
      prompt += `2. What does the data tell you about effort and fatigue?\n`;
      prompt += `3. What are the performance implications?\n`;
      prompt += `4. What should the athlete do next?`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.3,
        system: "You are an elite endurance coach analyzing workout data.",
        messages: [{ role: 'user', content: prompt }],
      });

      const aiResponse = message.content[0].type === 'text' ? message.content[0].text : '';
      const cleanText = stripMarkdown(aiResponse);

      // Extract run classification
      const types = ['recovery', 'easy', 'aerobic', 'tempo', 'threshold', 'interval', 'race'];
      const lowerText = cleanText.toLowerCase();
      let runClassification = 'General Training';
      for (const type of types) {
        if (lowerText.includes(type)) {
          runClassification = type.charAt(0).toUpperCase() + type.slice(1);
          break;
        }
      }

      // Save to database
      await db.insert(coachingInsights).values({
        activityId: payload.activityId,
        runClassification,
        heartRateAnalysis: null,
        pacingAnalysis: null,
        performanceImplications: null,
        recommendations: null,
        insightText: cleanText,
        generatedAt: Date.now(),
        isPublic: false,
      }).onConflictDoUpdate({
        target: coachingInsights.activityId,
        set: {
          runClassification,
          insightText: cleanText,
          generatedAt: Date.now(),
        },
      });

      // Update status to completed
      await db.update(generationStatus)
        .set({
          coachingStatus: 'completed',
          completedAt: Date.now()
        })
        .where(eq(generationStatus.activityId, payload.activityId));

      logger.info("Coaching insight generated successfully", { activityId: payload.activityId });

      return { success: true, activityId: payload.activityId };
    } catch (error: any) {
      logger.error("Failed to generate coaching insight", { error: error.message });

      // Update status to failed
      await db.update(generationStatus)
        .set({
          coachingStatus: 'failed',
          coachingError: error.message,
          completedAt: Date.now()
        })
        .where(eq(generationStatus.activityId, payload.activityId));

      throw error;
    }
  },
});
