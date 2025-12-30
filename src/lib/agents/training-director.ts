
import { db } from "@/db";
import { 
  dailyMetrics, 
  athleteReadiness, 
  activity, 
  athleteProfile 
} from "@/db/schema";
import { eq, desc, gte, and, lte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

// Validate API key at module load for early failure detection
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("[TrainingDirector] ANTHROPIC_API_KEY not set - AI features will use fallback mode");
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

type ReadinessAssessment = {
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  recommendation: string;
};

export class TrainingDirector {
  
  /**
   * Run the Daily Assessment for a user
   * Typically called by a Cron Job every morning
   */
  static async performDailyCheckIn(userId: string) {
    console.log(`[TrainingDirector] performing check-in for ${userId}`);
    
    // 1. Fetch Context
    const today = new Date().toISOString().split('T')[0];
    const context = await this.gatherContext(userId, today);
    
    // 2. AI Analysis
    const assessment = await this.analyzeReadiness(context);
    
    // 3. Save Result - Use raw SQL for upsert on composite unique constraint
    // Drizzle's onConflictDoUpdate works best with single-column targets
    const existingRecord = await db.select({ id: athleteReadiness.id })
      .from(athleteReadiness)
      .where(and(
        eq(athleteReadiness.userId, userId),
        eq(athleteReadiness.date, today)
      ))
      .limit(1);
    
    if (existingRecord.length > 0) {
      // Update existing
      await db.update(athleteReadiness)
        .set({
          readinessScore: assessment.score,
          injuryRisk: assessment.riskLevel,
          summary: assessment.summary,
          recommendation: assessment.recommendation,
          generatedAt: new Date().toISOString()
        })
        .where(eq(athleteReadiness.id, existingRecord[0].id));
    } else {
      // Insert new
      await db.insert(athleteReadiness).values({
        id: crypto.randomUUID(),
        userId,
        date: today,
        readinessScore: assessment.score,
        injuryRisk: assessment.riskLevel,
        summary: assessment.summary,
        recommendation: assessment.recommendation,
        generatedAt: new Date().toISOString()
      });
    }

    return assessment;
  }

  /**
   * Gather all relevant data for the agent
   */
  private static async gatherContext(userId: string, targetDate: string) {
    // A. Daily Metrics (last 14 days for baseline)
    const recentMetrics = await db.select().from(dailyMetrics)
      .where(and(
        eq(dailyMetrics.userId, userId),
        lte(dailyMetrics.date, targetDate)
      ))
      .orderBy(desc(dailyMetrics.date))
      .limit(14);

    // B. Recent Training Load (Activities last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentActivities = await db.select({
      id: activity.activityId,
      name: activity.name,
      distance: activity.distance,
      movingTime: activity.movingTimeInSeconds,
      sufferScore: activity.sufferScore,
      date: activity.startDateTime,
      type: activity.sportType
    }).from(activity)
      .where(and(
        eq(activity.userId, userId),
        gte(activity.startDateTime, oneWeekAgo)
      ));

    // C. Profile
    const profile = await db.query.athleteProfile.findFirst({
      where: eq(athleteProfile.userId, userId)
    });

    return {
      profile,
      metrics: recentMetrics,
      activities: recentActivities
    };
  }

  /**
   * The Core Agentic Logic
   * Uses Claude to interpret the physiological data
   */
  private static async analyzeReadiness(context: any): Promise<ReadinessAssessment> {
    const { metrics, activities, profile } = context;
    
    // Sort logic
    const todayMet = metrics[0] || {}; // Most recent
    const baselineMet = metrics.slice(1);
    
    // Basic heuristics for prompt context
    const avgHrv = baselineMet.reduce((acc: number, m: any) => acc + (m.heartRateVariability || 0), 0) / (baselineMet.length || 1);
    const recentStrain = activities.reduce((acc: number, a: any) => acc + (a.sufferScore || 0), 0);
    
    const prompt = `
    You are an elite endurance coach and physiologist (The Training Director).
    Analyze this athlete's data to determine their "Readiness to Train" today.

    CONTEXT:
    - Athlete: ${profile?.displayName || 'Runner'}
    - Goals: Improve fitness, avoid injury.
    
    RECENT DATA (Last 24h):
    - HRV: ${todayMet.heartRateVariability || 'N/A'} ms (Baseline ~${avgHrv.toFixed(0)})
    - Resting HR: ${todayMet.restingHeartRate || 'N/A'} bpm
    - Sleep: ${todayMet.sleepDurationSeconds ? (todayMet.sleepDurationSeconds / 3600).toFixed(1) + 'h' : 'N/A'}
    - Source: ${todayMet.source || 'Unknown'}

    TRAINING LOAD (Last 7 Days):
    - Total Activities: ${activities.length}
    - Total Strain (Suffer Score): ${recentStrain}
    - Recent activities: ${activities.map((a: any) => a.name).join(', ')}

    INSTRUCTIONS:
    1. Compare today's metrics to baseline. Significant drop in HRV (>10%) or spike in RHR is a warning sign.
    2. Consider accumulated fatigue from recent training.
    3. Determine a Risk Level: low, moderate, high, critical.
    4. Provide a Score (0-100) where 100 is fully fresh, 0 needs bed rest.
    5. Write a concise Summary and specific Recommendation.

    Return JSON:
    {
      "score": number, 
      "riskLevel": "low"|"moderate"|"high"|"critical",
      "summary": "string",
      "recommendation": "string"
    }
    `;

    try {
      // Check if API is available
      if (!anthropic) {
        throw new Error("AI service not configured");
      }
      
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      });

      const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '';
      
      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error("Failed to parse JSON from AI response");

    } catch (e) {
      console.error("TrainingDirector Analysis Failed", e);
      // Fallback safe mode
      return {
        score: 50,
        riskLevel: 'moderate',
        summary: "AI Analysis unavailable. Listen to your body.",
        recommendation: "Run by feel today."
      };
    }
  }
}
