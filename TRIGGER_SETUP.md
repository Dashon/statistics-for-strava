# Trigger.dev Setup - Production-Ready Background Jobs

## 🎯 What We Built

A **production-ready, scalable background job system** for processing years of running data using Trigger.dev.

### Why Trigger.dev?

The previous implementation had critical flaws:
- ❌ Sequential processing in a single Node.js process
- ❌ No job persistence (server restart = lost jobs)
- ❌ No parallelization (1000 activities = hours of blocking)
- ❌ No observability or retry logic
- ❌ Can't handle multiple users simultaneously

**Trigger.dev solves all of this:**
- ✅ Distributed job queue with parallel workers
- ✅ Persistent jobs (survive server restarts)
- ✅ Automatic retries with exponential backoff
- ✅ Built-in observability dashboard
- ✅ Rate limiting and concurrency control
- ✅ Scales to unlimited users

---

## 📁 Project Structure

```
src/trigger/
├── index.ts                    # Export all tasks
├── generate-run-content.ts     # Letter & coaching insight generation
└── batch-ingestion.ts          # Historical data processing

src/app/actions/
└── trigger-jobs.ts             # Server actions to trigger jobs

trigger.config.ts               # Trigger.dev configuration
```

---

## 🚀 Getting Started

### 1. Start Development Servers

You need **TWO terminal windows**:

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Trigger.dev:**
```bash
npm run dev:trigger
```

The Trigger.dev dev server:
- Watches for code changes
- Processes jobs locally
- Shows real-time logs
- Provides dev dashboard at `http://localhost:3030`

### 2. Test the System

1. Go to `http://localhost:3000/dashboard/run-letters`
2. Click "Generate X Pending Letters"
3. Watch the Trigger.dev dashboard show jobs processing
4. See loading states update in real-time on the UI

---

## 📊 Architecture

### Job Flow

```
User clicks button
       ↓
Server Action (trigger-jobs.ts)
       ↓
Trigger.dev Queue
       ↓
   ┌────────┬────────┬────────┐
   │Worker 1│Worker 2│Worker 3│  (Parallel execution)
   └────────┴────────┴────────┘
       ↓
Database (results + status)
       ↓
UI polls every 2s → Shows progress
```

### Tasks Overview

#### 1. **generateRunLetterTask**
- **Purpose**: Create poetic reflection on a run
- **Input**: `{ activityId, userId }`
- **Duration**: ~2-5 seconds
- **Retries**: 3 attempts
- **Model**: Claude Haiku 4.5

#### 2. **generateCoachingInsightTask**
- **Purpose**: AI-powered performance analysis
- **Input**: `{ activityId, userId }`
- **Duration**: ~3-7 seconds
- **Retries**: 3 attempts
- **Model**: Claude Haiku 4.5
- **Features**: HR analysis, pacing, recommendations

#### 3. **processActivityContent**
- **Purpose**: Wrapper that triggers both letter + coaching
- **Input**: `{ activityId, userId }`
- **Action**: Triggers above 2 tasks in parallel

#### 4. **batchIngestRunHistory**
- **Purpose**: Process years of historical data
- **Input**: `{ userId, tier, maxActivities }`
- **Tiers**:
  - `free`: 20 most recent activities
  - `premium`: Unlimited history
- **Features**:
  - Smart batching (5 for free, 10 for premium)
  - Skips already-generated content
  - 2-second pause between batches

---

## 🎛️ Configuration

### Environment Variables

```bash
# .env.local
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxxxx
TRIGGER_PROJECT_REF=proj_xxxxxxxxxxxxxx
TRIGGER_API_URL=https://api.trigger.dev
```

### trigger.config.ts

```typescript
export default defineConfig({
  project: "proj_smbvkbikdtbkaecgkbyp",
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 3600, // 1 hour max for batch jobs
});
```

---

## 💰 Cost & Scale Analysis

### Cost Estimates (Claude Haiku 4.5)

- **Input**: $1 per 1M tokens
- **Output**: $5 per 1M tokens

**Per Activity:**
- Run Letter: ~300 input + ~150 output tokens = $0.00085
- Coaching Insight: ~500 input + ~400 output tokens = $0.0025
- **Total per activity**: ~$0.0034

**For 100 activities**: $0.34
**For 1,000 activities**: $3.40
**For 10,000 activities (10 years)**: $34

### Scalability

**Free Tier Users (20 activities each):**
- 100 users = 2,000 activities
- Total cost: ~$6.80
- Processing time: ~5-10 minutes (parallel)

**Premium Users (1,000 activities each):**
- 10 users = 10,000 activities
- Total cost: ~$34
- Processing time: ~30-60 minutes (batched)

**Trigger.dev Limits:**
- Free tier: 1,000 task runs/month
- Pro tier: 50,000 task runs/month ($20/mo)
- **Recommendation**: Start with Pro tier

---

## 🎚️ Premium Tier Implementation

### Current Setup

In [batch-ingestion.ts](src/trigger/batch-ingestion.ts):

```typescript
const isFreeTier = payload.tier === "free";
const maxActivities = payload.maxActivities || (isFreeTier ? 20 : undefined);
const BATCH_SIZE = isFreeTier ? 5 : 10;
```

### To Add Premium Logic

1. **Add tier to user schema**:
```typescript
// src/db/schema.ts
export const user = pgTable("User", {
  // ... existing fields
  tier: varchar("tier", { length: 50 }).default("free"), // "free" | "premium"
});
```

2. **Check tier in server action**:
```typescript
// src/app/actions/trigger-jobs.ts
export async function triggerHistoryIngestion() {
  const session = await auth() as any;
  const userProfile = await db.query.user.findFirst({
    where: eq(user.userId, session.userId),
  });

  const tier = userProfile?.tier || "free";

  // Free users limited to 20, premium unlimited
  if (tier === "free" && maxActivities > 20) {
    throw new Error("Upgrade to premium for full history");
  }

  await tasks.trigger("batch-ingest-run-history", {
    userId: session.userId,
    tier,
  });
}
```

---

## 🔍 Monitoring & Debugging

### Trigger.dev Dashboard

**Development**: http://localhost:3030
**Production**: https://cloud.trigger.dev

Features:
- Real-time job status
- Logs for each task execution
- Retry history
- Performance metrics

### Database Status Tracking

```sql
-- Check generation status
SELECT * FROM generation_status
WHERE letter_status = 'generating'
OR coaching_status = 'generating';

-- Check failed jobs
SELECT * FROM generation_status
WHERE letter_status = 'failed'
OR coaching_status = 'failed';
```

### Common Issues

**Jobs not processing?**
- Check Trigger.dev dev server is running (`npm run dev:trigger`)
- Check env vars are set correctly
- Look at logs in Trigger.dev dashboard

**Markdown still showing?**
- Check `stripMarkdown()` function is applied
- Regenerate content (old content won't be cleaned)

---

## 🚢 Deployment

### 1. Deploy to Trigger.dev

```bash
npm run trigger:deploy
```

This:
- Builds your tasks
- Uploads to Trigger.dev cloud
- Generates production secret key

### 2. Update Production Env Vars

In Vercel/hosting platform:
```bash
TRIGGER_SECRET_KEY=tr_prod_xxxxxx  # Get from Trigger.dev dashboard
TRIGGER_PROJECT_REF=proj_smbvkbikdtbkaecgkbyp
TRIGGER_API_URL=https://api.trigger.dev
```

### 3. Deploy Next.js App

```bash
vercel --prod
```

---

## 🎯 Next Steps

### Immediate (MVP)

1. ✅ Set up Trigger.dev dev environment
2. ✅ Test single activity generation
3. ✅ Test batch generation (5-10 activities)
4. ⏳ Deploy to production

### Short-term

1. **Add premium tier logic**
   - User tier in database
   - Payment integration (Stripe)
   - Tier checks in server actions

2. **Improve UX**
   - Show estimated time remaining
   - Better error messages
   - Email when batch complete

3. **Analytics**
   - Track generation success rate
   - Monitor API costs
   - User engagement metrics

### Long-term

1. **Smart Scheduling**
   - Auto-generate for new activities
   - Weekly digests
   - Trend analysis over time

2. **Advanced Features**
   - Compare runs
   - Training plan suggestions
   - Race predictions

3. **Scale Optimizations**
   - Caching frequently accessed data
   - Batch API calls where possible
   - Incremental updates vs full regeneration

---

## 📚 Resources

- [Trigger.dev Docs](https://trigger.dev/docs)
- [Task API Reference](https://trigger.dev/docs/tasks/overview)
- [Pricing Calculator](https://trigger.dev/pricing)
- [Dashboard](https://cloud.trigger.dev/projects/proj_smbvkbikdtbkaecgkbyp)

---

## 🆘 Support

Questions? Check:
1. Trigger.dev dashboard logs
2. Browser console
3. Next.js terminal output
4. Trigger.dev dev server terminal

Need help? The architecture is solid and production-ready. You've got this! 🚀
