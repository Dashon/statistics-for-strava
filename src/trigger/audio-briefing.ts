
import { task, logger } from "@trigger.dev/sdk";
import { TrainingDirector } from "@/lib/agents/training-director";

/**
 * Generate Audio Briefing Task
 * Offloads long-running AI & TTS & Upload operations to background
 */
export const generateAudioBriefingTask = task({
  id: "generate-audio-briefing",
  run: async (payload: { userId: string }) => {
    logger.info(`Starting audio briefing generation for user ${payload.userId}`);
    
    try {
      const audioUrl = await TrainingDirector.generateAudioBriefing(payload.userId);
      logger.info(`Successfully generated briefing: ${audioUrl}`);
      
      return { success: true, audioUrl };
    } catch (error: any) {
      logger.error("Failed to generate audio briefing", { error: error.message });
      throw error;
    }
  },
});
