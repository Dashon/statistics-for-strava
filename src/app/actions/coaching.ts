'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { activity, coachingInsights, athleteProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import {
  calculateHRDrift,
  calculateHeartRateZones,
  calculateTimeInZones,
  calculateMaxHeartRate,
} from '@/lib/training-metrics';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const COACHING_SYSTEM_PROMPT = `You are an elite endurance coach analyzing workout data. Your role is to provide detailed, actionable performance insights based on heart rate, pacing, and effort data.

Analyze the activity like a professional coach viewing a Grafana dashboard. Focus on:

1. **Run Classification** - Identify the workout type (recovery, easy aerobic, tempo, threshold, interval, race)
2. **Heart Rate Analysis** - Examine HR zones, drift patterns, and cardiovascular response
3. **Pacing Analysis** - Evaluate split consistency, positive/negative split patterns
4. **Performance Implications** - What this workout means for fitness and goals
5. **Actionable Recommendations** - Specific next steps and training advice

Be technical but clear. Use specific metrics. Focus on "why" not just "what".`;

interface ActivityData {
  activityId: string;
  name: string | null;
  startDateTime: string;
  sportType: string | null;
  distance: number | null;
  elevation: number | null;
  movingTimeInSeconds: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  data: any;
}

function buildCoachingPrompt(
  activityData: ActivityData,
  athleteMaxHR: number,
  hrStreamData?: number[],
  paceStreamData?: number[]
): string {
  const { name, distance, movingTimeInSeconds, averageHeartRate, elevation } = activityData;

  const distanceKm = distance ? (distance / 1000).toFixed(2) : '0.00';
  const durationMin = movingTimeInSeconds ? Math.floor(movingTimeInSeconds / 60) : 0;
  
  let avgPaceDisplay = '0:00';
  if (movingTimeInSeconds && distance && distance > 0) {
    const avgPaceMinPerKm = movingTimeInSeconds / (distance / 1000) / 60;
    avgPaceDisplay = `${Math.floor(avgPaceMinPerKm)}:${Math.floor((avgPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}`;
  }

  let prompt = `Analyze this running activity:\n\n`;
  prompt += `**Activity**: ${name || 'Unnamed Activity'}\n`;
  prompt += `**Distance**: ${distanceKm} km\n`;
  prompt += `**Duration**: ${durationMin} minutes\n`;
  prompt += `**Average Pace**: ${avgPaceDisplay} min/km\n`;
  prompt += `**Elevation Gain**: ${elevation?.toFixed(0) || 0} m\n\n`;

  // Heart Rate Analysis
  if (averageHeartRate && athleteMaxHR) {
    const hrPercent = ((averageHeartRate / athleteMaxHR) * 100).toFixed(0);
    prompt += `**Heart Rate**:\n`;
    prompt += `- Average: ${averageHeartRate} bpm (${hrPercent}% of max)\n`;

    if (hrStreamData && hrStreamData.length > 0) {
      const hrDrift = calculateHRDrift(hrStreamData);
      const timeInZones = calculateTimeInZones(hrStreamData, athleteMaxHR);
      const zones = calculateHeartRateZones(athleteMaxHR);

      prompt += `- HR Drift: ${hrDrift.toFixed(1)}%\n`;
      prompt += `- Time in Zones:\n`;
      timeInZones.forEach((z) => {
        if (z.percentage > 5) {
          const zoneName = zones[z.zone - 1].name;
          prompt += `  - Zone ${z.zone} (${zoneName}): ${z.percentage.toFixed(0)}%\n`;
        }
      });
    }
    prompt += `\n`;
  }

  // Pacing Analysis
  if (paceStreamData && paceStreamData.length > 10) {
    const firstMileAvg = paceStreamData.slice(0, Math.floor(paceStreamData.length * 0.25)).reduce((a, b) => a + b, 0) / (paceStreamData.length * 0.25);
    const lastMileAvg = paceStreamData.slice(Math.floor(paceStreamData.length * 0.75)).reduce((a, b) => a + b, 0) / (paceStreamData.length * 0.25);
    const paceDrift = ((lastMileAvg - firstMileAvg) / firstMileAvg) * 100;

    prompt += `**Pacing**:\n`;
    prompt += `- First 25%: ${(firstMileAvg * 1000 / 60).toFixed(2)} min/km\n`;
    prompt += `- Last 25%: ${(lastMileAvg * 1000 / 60).toFixed(2)} min/km\n`;
    prompt += `- Pace Drift: ${paceDrift > 0 ? '+' : ''}${paceDrift.toFixed(1)}%\n\n`;
  }

  prompt += `Provide a comprehensive coaching analysis covering:\n`;
  prompt += `1. What type of workout was this? (classification)\n`;
  prompt += `2. What does the heart rate data tell you about effort and fatigue?\n`;
  prompt += `3. What does the pacing pattern indicate?\n`;
  prompt += `4. What are the performance implications?\n`;
  prompt += `5. What should the athlete do next?`;

  return prompt;
}

function parseCoachingResponse(aiResponse: string) {
  // Extract structured data from AI response
  // For now, return full text - can enhance with structured parsing later
  return {
    runClassification: extractRunClassification(aiResponse),
    heartRateAnalysis: null, // Can be enhanced with JSON parsing
    pacingAnalysis: null,
    performanceImplications: extractSection(aiResponse, 'performance implications'),
    recommendations: null,
    insightText: aiResponse,
  };
}

function extractRunClassification(text: string): string {
  // Simple extraction - look for common workout types
  const types = ['recovery', 'easy', 'aerobic', 'tempo', 'threshold', 'interval', 'race'];
  const lowerText = text.toLowerCase();

  for (const type of types) {
    if (lowerText.includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  return 'General Training';
}

function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(`${sectionName}:?(.+?)(?:\\n\\n|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

export async function generateCoachingInsight(activityId: string) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  // Fetch activity data
  const activityData = await db.query.activity.findFirst({
    where: eq(activity.activityId, activityId),
  });

  if (!activityData) {
    throw new Error('Activity not found');
  }

  // Get athlete profile for max HR
  const profile = await db.query.athleteProfile.findFirst({
    where: eq(athleteProfile.userId, session.userId),
  });

  // Calculate or use athlete's max HR
  const athleteMaxHR = profile?.maxHeartRate || calculateMaxHeartRate(35); // Default age

  // TODO: Fetch HR and pace stream data from activity streams table
  // For now, work with activity-level data
  const hrStreamData: number[] = []; // Will be populated from streams
  const paceStreamData: number[] = [];

  // Build comprehensive prompt
  const prompt = buildCoachingPrompt(activityData, athleteMaxHR, hrStreamData, paceStreamData);

  // Call OpenAI for analysis
  const response = await openai.chat.completions.create({
    model: 'gpt-5.2',
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: COACHING_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
  });

  const aiResponse = response.choices[0].message.content || '';

  // Strip markdown formatting for cleaner display
  const cleanText = aiResponse
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic *text*
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/^[-*]\s+/gm, '') // Remove bullet points
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines

  // Parse and structure the response
  const insight = parseCoachingResponse(cleanText);

  // Save to database
  await db.insert(coachingInsights).values({
    activityId,
    ...insight,
    generatedAt: Date.now(),
    isPublic: false,
  }).onConflictDoUpdate({
    target: coachingInsights.activityId,
    set: {
      ...insight,
      generatedAt: Date.now(),
    },
  });

  return insight;
}

export async function getCoachingInsight(activityId: string) {
  const insight = await db.query.coachingInsights.findFirst({
    where: eq(coachingInsights.activityId, activityId),
  });

  return insight;
}

export async function updateCoachingInsight(activityId: string, editedText: string) {
  const session = await auth() as any;
  if (!session?.userId) {
    throw new Error('Not authenticated');
  }

  await db
    .update(coachingInsights)
    .set({
      editedText,
      editedAt: Date.now(),
    })
    .where(eq(coachingInsights.activityId, activityId));

  return { success: true };
}
