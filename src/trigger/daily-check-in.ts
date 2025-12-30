
import { task, logger, tasks, schedules } from "@trigger.dev/sdk/v3";
import { TrainingDirector } from "@/lib/agents/training-director";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * Daily Check-In Orchestrator
 * Runs every morning. Queues individual user check-ins for parallel processing.
 * This is scalable: each user is processed by a separate task instance.
 */
export const dailyCheckInOrchestrator = schedules.task({
  id: "daily-check-in-orchestrator",
  // Run automatically at 7:00 AM UTC every day
  cron: "0 7 * * *", 
  queue: {
    concurrencyLimit: 1, // Only one orchestrator at a time
  },
  run: async () => {
    const allUsers = await db.select({ id: user.userId }).from(user);
    
    logger.info(`Queueing daily check-in for ${allUsers.length} users`);
    
    if (allUsers.length === 0) {
      return { queued: 0 };
    }
    
    // Use batchTrigger for efficient parallel processing
    const batchItems = allUsers.map(u => ({
      payload: { userId: u.id },
      options: {
        idempotencyKey: `daily-check-in-${u.id}-${new Date().toISOString().split('T')[0]}`,
      }
    }));
    
    await tasks.batchTrigger("daily-check-in-user", batchItems);
    
    logger.info(`Successfully queued ${allUsers.length} daily check-ins`);
    
    return { queued: allUsers.length };
  },
});

/**
 * Daily Check-In for a Single User
 * Runs the Training Director analysis for one user.
 * Rate-limited to avoid overwhelming the AI API.
 */
export const dailyCheckInUser = task({
  id: "daily-check-in-user",
  queue: {
    concurrencyLimit: 5, // Process 5 users at a time
  },
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 5000,
  },
  run: async (payload: { userId: string }) => {
    logger.info(`Performing daily check-in for ${payload.userId}`);
    
    // Run the Training Director analysis
    const assessment = await TrainingDirector.performDailyCheckIn(payload.userId);
    
    // Identify if an alert is needed
    const shouldAlert = ['high', 'critical'].includes(assessment.riskLevel);
    
    logger.info(`Check-in complete for ${payload.userId}`, { 
      risk: assessment.riskLevel, 
      score: assessment.score,
      alert: shouldAlert 
    });

    return { 
      userId: payload.userId,
      assessment, 
      shouldAlert 
    };
  },
});
