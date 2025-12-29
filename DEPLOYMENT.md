# Deployment Guide - Vercel + Trigger.dev

## 🎯 Architecture Overview

Your app has two parts that deploy separately:

1. **Next.js App** → Vercel (web UI, API routes, server actions)
2. **Background Jobs** → Trigger.dev (AI generation, batch processing)

```
User → Vercel (Next.js) → triggers job → Trigger.dev Workers
                ↓                              ↓
            Supabase ←──── writes results ─────┘
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Trigger.dev Tasks

```bash
# Login to Trigger.dev (first time only)
npx trigger.dev@latest login

# Deploy your tasks to production
npm run trigger:deploy
```

**What happens:**
- ✅ Builds and bundles your tasks
- ✅ Uploads to Trigger.dev cloud
- ✅ Generates production secret key
- ✅ Tasks are now running in Trigger.dev infrastructure

**Output example:**
```
✓ Deployed successfully
✓ Production URL: https://cloud.trigger.dev/projects/proj_smbvkbikdtbkaecgkbyp
✓ Secret key: tr_prod_xxxxxxxxxxxxxx
```

---

### Step 2: Configure Vercel Environment Variables

Go to your Vercel project settings → Environment Variables:

#### Production Environment Variables

Add these to **Production** environment:

```bash
# Database - IMPORTANT: URL-encode special characters in password!
# Use this tool: node -e "console.log(encodeURIComponent('YOUR_PASSWORD'))"
DATABASE_URL=postgres://postgres.[PROJECT_REF]:[URL_ENCODED_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# Strava OAuth
NEXT_PUBLIC_STRAVA_CLIENT_ID=192116
STRAVA_CLIENT_SECRET=xxxxxxxxxxxxxx
AUTH_STRAVA_ID=192116
AUTH_STRAVA_SECRET=xxxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxxxxxxxxxxxxx

# NextAuth
AUTH_SECRET=xxxxxxxxxxxxxx

# Anthropic API
ANTHROPIC_API_KEY=xxxxxxxxxxxxxx
CLAUDE_API_KEY=xxxxxxxxxxxxxx

# Trigger.dev - PRODUCTION KEYS
TRIGGER_SECRET_KEY=tr_prod_xxxxxxxxxxxxxx  # ← Get from Step 1 deploy output
TRIGGER_PROJECT_REF=proj_xxxxxxxxxxxxxx
TRIGGER_API_URL=https://api.trigger.dev
```

**🔑 IMPORTANT**:
- Use `tr_prod_xxx` key from Step 1, NOT `tr_dev_xxx`
- Dev keys won't work in production!

---

### Step 3: Deploy to Vercel

#### Option A: Git Push (Recommended)

```bash
git add .
git commit -m "Add Trigger.dev background jobs"
git push origin main
```

Vercel will auto-deploy when it detects the push.

#### Option B: Vercel CLI

```bash
# Install Vercel CLI (first time)
npm i -g vercel

# Deploy
vercel --prod
```

---

### Step 4: Verify Deployment

#### Check Trigger.dev Dashboard

1. Go to https://cloud.trigger.dev
2. Navigate to your project: `QT Statistics for Strava`
3. Check "Tasks" tab - should see:
   - `generate-run-letter`
   - `generate-coaching-insight`
   - `process-activity-content`
   - `batch-ingest-run-history`

#### Test in Production

1. Go to your production URL (e.g., `qt-strava.vercel.app`)
2. Login with Strava
3. Navigate to `/dashboard/run-letters`
4. Click "Generate" button
5. Watch Trigger.dev dashboard for job activity
6. Verify jobs complete and content appears

---

## 🔍 Monitoring

### Trigger.dev Dashboard

**URL**: https://cloud.trigger.dev/projects/proj_smbvkbikdtbkaecgkbyp

**What you can see:**
- ✅ All job runs (success/failed)
- ✅ Real-time logs for each task
- ✅ Retry attempts
- ✅ Duration and performance metrics
- ✅ Error traces

### Common Issues & Solutions

#### 1. Jobs Not Triggering

**Symptoms**: Click button, nothing happens in Trigger.dev

**Check:**
```bash
# Verify env vars in Vercel
vercel env ls

# Make sure TRIGGER_SECRET_KEY starts with tr_prod_
```

**Fix:**
- Update `TRIGGER_SECRET_KEY` in Vercel to production key
- Redeploy: `vercel --prod`

---

#### 2. Tasks Not Found Error

**Error**: `Task "generate-run-letter" not found`

**Check:**
```bash
# Did you deploy tasks?
npm run trigger:deploy
```

**Fix:**
- Deploy tasks: `npm run trigger:deploy`
- Wait 1-2 minutes for propagation

---

#### 3. Database Connection Errors

**Error**: `connection to server failed` or `URI malformed`

**Check:**
- Verify `DATABASE_URL` in Vercel matches Supabase
- **URL-encode special characters in password!** (`#` → `%23`, `^` → `%5E`, etc.)
- Check Supabase pooler is enabled
- Ensure IP allowlist includes 0.0.0.0/0 (or Trigger.dev IPs)

**Fix:**
```bash
# Encode your password properly
node -e "console.log(encodeURIComponent('YOUR_PASSWORD'))"

# Example: MpOvV8voqAbdQiNyIDR7#2xD^wl2^rge
# Becomes: MpOvV8voqAbdQiNyIDR7%232xD%5Ewl2%5Erge
```

1. Go to Supabase → Settings → Database
2. Enable "Connection Pooling" (Port 6543)
3. Update `DATABASE_URL` in Vercel with **encoded password**
4. Redeploy

---

#### 4. Anthropic API Errors

**Error**: `401 Unauthorized` or `model not found`

**Check:**
- API key is valid
- You have credits remaining
- Model ID is correct: `claude-haiku-4-5-20251001`

**Fix:**
1. Verify API key at https://console.anthropic.com
2. Check usage/billing
3. Update `ANTHROPIC_API_KEY` in Vercel if needed

---

## 💰 Cost Monitoring

### Trigger.dev Pricing

**Your current plan**: Free (1,000 tasks/month)

**For production, upgrade to Pro**:
- $20/month base
- 50,000 tasks included
- $0.002 per additional task

**Estimate for your app**:
- 100 users × 20 activities = 2,000 tasks = **Pro plan**
- 100 users × 100 activities = 10,000 tasks = **Pro plan**
- 1,000 users × 20 activities = 20,000 tasks = **Pro plan**

**Recommendation**:
- Start with Free (testing)
- Upgrade to Pro before public launch

### Anthropic Costs

**Per activity**: ~$0.0034
- 1,000 generations/day = $3.40/day = **~$100/month**
- 10,000 generations/day = $34/day = **~$1,000/month**

**Set usage limits**:
1. Go to https://console.anthropic.com
2. Settings → Usage limits
3. Set monthly cap

---

## 🚨 Important Notes

### Vercel Limitations

**DO NOT try to run Trigger.dev tasks IN Vercel**. They will:
- ❌ Time out after 10 minutes
- ❌ Fail with serverless errors
- ❌ Not retry on failure

**Always use Trigger.dev for background jobs.**

### Environment Variables

Keep these synced:
- Local: `.env.local` (dev keys)
- Vercel Production: (prod keys)

**Never commit `.env.local` to git!**

### Database Migrations

Before deploying major changes:

```bash
# Generate migration
npm run db:generate

# Review SQL in migrations/ folder

# Apply to production (careful!)
# Option 1: Use Supabase SQL editor
# Option 2: Run migration script with prod DATABASE_URL
```

---

## 🔄 Deployment Checklist

Before every production deploy:

- [ ] All tests passing locally
- [ ] Trigger.dev tasks deployed: `npm run trigger:deploy`
- [ ] Environment variables updated in Vercel
- [ ] Database migrations applied (if any)
- [ ] Monitor Trigger.dev dashboard during deploy
- [ ] Test critical flows in production
- [ ] Check Sentry/error tracking (if configured)

---

## 📊 Scaling Plan

### Phase 1: Launch (0-100 users)
- ✅ Trigger.dev Free tier (1,000 tasks/month)
- ✅ Vercel Hobby ($0)
- ✅ Supabase Free tier
- **Cost**: ~$0/month (+ API usage)

### Phase 2: Growth (100-1,000 users)
- ✅ Trigger.dev Pro ($20/month)
- ✅ Vercel Pro ($20/month)
- ✅ Supabase Pro ($25/month)
- **Cost**: ~$65/month + API usage

### Phase 3: Scale (1,000+ users)
- ✅ Trigger.dev Pro + overages
- ✅ Vercel Pro
- ✅ Supabase Pro + compute
- **Cost**: $100-500/month depending on usage

---

## 🆘 Getting Help

### Trigger.dev Support
- Docs: https://trigger.dev/docs
- Discord: https://trigger.dev/discord
- Email: help@trigger.dev

### Vercel Support
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### Your Architecture Questions
Check `TRIGGER_SETUP.md` for detailed technical docs.

---

## 🎯 Next Steps After Deploy

1. **Set up monitoring alerts**
   - Trigger.dev: Configure Slack/email notifications
   - Vercel: Enable error tracking
   - Supabase: Set up database alerts

2. **Add premium tier**
   - User billing (Stripe)
   - Tier checks in server actions
   - Usage tracking

3. **Optimize costs**
   - Cache API responses where possible
   - Batch similar operations
   - Monitor and adjust concurrency

4. **Improve UX**
   - Email notifications when jobs complete
   - Progress bars with estimates
   - Bulk operations UI

You're production-ready! 🚀
