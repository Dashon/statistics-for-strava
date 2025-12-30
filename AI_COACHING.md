# AI Training Director

The **Training Director** is your AI-powered coach that lives inside QT.run. It analyzes your recovery data and training history to provide personalized readiness scores, recommendations, and audio briefings.

## Features

### 1. Daily Readiness Score
Every day, the Training Director computes a **0-100 Readiness Score** based on:
- **HRV (Heart Rate Variability)**: Compared against your baseline.
- **Resting Heart Rate**: Elevated RHR signals fatigue.
- **Sleep Duration & Quality**: From connected wearables.
- **Recent Training Load**: Accumulated strain from workouts.

The score is displayed on your dashboard with a color-coded status:
| Score | Status | Color |
|-------|--------|-------|
| 80-100 | **Optimal** | Green |
| 60-79 | **Moderate** | Yellow |
| 40-59 | **Elevated Risk** | Orange |
| 0-39 | **Critical** | Red |

### 2. Personalized Recommendations
Along with the score, you receive:
- A **Summary** explaining why your readiness is what it is.
- A **Coach Recommendation** for today's training (e.g., "Take an easy recovery day").

### 3. Daily Audio Briefing 🎧
Click "Play Daily Briefing" on your Readiness Card to generate a **personalized podcast-style audio message**:
- 45-60 seconds of encouragement and advice.
- Uses OpenAI's HD Text-to-Speech (voice: "alloy").
- Stored in Supabase Storage and available for replay.

### 4. Interactive Chat (Coming Soon)
The chat bubble in the bottom-right corner connects you to the Training Director for real-time Q&A about your training.

---

## Technical Architecture

### Database Tables
| Table | Purpose |
|-------|---------|
| `daily_metrics` | Normalized sleep/HRV data from wearables |
| `athlete_readiness` | AI-generated scores and audio URL |
| `training_chat` | Conversation history |

### Key Files
- `src/lib/agents/training-director.ts` - Core agent logic
- `src/trigger/daily-check-in.ts` - Scheduled task (7 AM UTC)
- `src/components/dashboard/ReadinessCard.tsx` - UI component
- `src/app/actions/audio-briefing.ts` - Server action for audio generation

### Trigger.dev Schedule
The `dailyCheckInOrchestrator` runs automatically at **7:00 AM UTC** daily via Trigger.dev's scheduler. It queues individual check-in tasks for each user, processing them in parallel with a concurrency limit of 5.

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Required for AI analysis
ANTHROPIC_API_KEY=sk-ant-...

# Required for audio briefings
OPENAI_API_KEY=sk-...

# Supabase (for audio storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Supabase Setup
1. Create a bucket called `media` in Supabase Storage.
2. Make it **public** so audio files can be streamed.

---

## Deployment

1. **Apply migrations**:
   ```bash
   psql $DATABASE_URL -f migrations/002_training_director.sql
   psql $DATABASE_URL -f migrations/003_audio_briefing.sql
   ```

2. **Deploy Trigger.dev tasks**:
   ```bash
   npx trigger.dev@latest deploy
   ```

3. **Set environment variables** in Vercel dashboard.

---

## Future Enhancements
- [ ] Weather integration for outdoor workout recommendations
- [ ] Injury risk alerts via email/push notifications
- [ ] Multi-language audio briefings
- [ ] Voice assistant integration (Siri/Alexa)
