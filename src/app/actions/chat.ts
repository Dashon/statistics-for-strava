
"use server";

import { TrainingDirector } from "@/lib/agents/training-director";
import { auth } from "@/auth";

export async function askTrainingDirector(query: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // In a real implementation, we would pass the conversation history
  // For now, we just pass the single query context-free
  // This would be extended to use the agent's tool-calling capabilities
  
  // Temporary: Just run the daily analysis and summarize it relative to the question
  // In the future: Add a specific `answerQuery` method to TrainingDirector
  
  try {
     const analysis = await TrainingDirector.performDailyCheckIn(session.user.id);
     
     // Simple rule-based response for now until we add full conversational tools
     return `[Training Director]: I've looked at your latest data. Your readiness score is ${analysis.score}/100 (${analysis.riskLevel} risk). 
     
     ${analysis.summary}
     
     Recommendation: ${analysis.recommendation}`;

  } catch (error) {
    console.error("Agent Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
