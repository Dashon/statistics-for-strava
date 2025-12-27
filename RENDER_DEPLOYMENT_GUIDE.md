# QT's Running Dashboard - Render Deployment Guide

## Quick Setup Checklist

### ✅ Before Deploying

1. **Generate secrets** (run these locally):
   ```bash
   # Generate APP_SECRET
   openssl rand -hex 32

   # Or use this if openssl not available:
   php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
   ```

2. **Choose a strong admin password** for QT
   - Mix of uppercase, lowercase, numbers, symbols
   - At least 12 characters
   - Example: `QT-Running2024!Secure`

---

## Render Environment Variables

Go to your Render dashboard → Your web service → Environment

### Add these variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `APP_ENV` | `prod` | Production environment |
| `APP_DEBUG` | `0` | Disable debug mode |
| `APP_SECRET` | _(your generated secret)_ | From step 1 above |
| `APP_ADMIN_PASSWORD` | _(QT's password)_ | Strong password for login |
| `STRAVA_CLIENT_ID` | `192083` | Already configured |
| `STRAVA_CLIENT_SECRET` | `db58b74c1533f96360c3968ea3a48687788ad507` | Already configured |
| `STRAVA_REFRESH_TOKEN` | `f445139cd2447edd302b1763da96cdfff71b6a85` | Already configured |
| `CLAUDE_API_KEY` | `sk-ant-api03-...` | For AI letter generation |

⚠️ **IMPORTANT**: After adding these variables, click "Save Changes" - Render will automatically redeploy.

---

## What's Protected

### 🔒 Requires Login (Username: `admin`, Password: what you set above)
- Main dashboard: `https://your-app.onrender.com/`
- Run Letters page
- All editing features
- Activity pages
- Statistics pages

### 🌐 Public (No login required)
- Shared letter URLs: `https://your-app.onrender.com/letter/abc123...`
- These are SAFE to share on social media
- Perfect for QT's brand building

---

## Testing the Deployment

1. **Visit main URL** - Should show login prompt
   - Username: `admin`
   - Password: _(what you set)_

2. **Create a test public letter:**
   - Login to dashboard
   - Go to "Run Letters"
   - Click "Make Public" on any letter
   - Click "Copy Link"
   - Open link in incognito/private window
   - Should show WITHOUT login

3. **Verify Strava sync:**
   - Check "Activities" page shows recent runs
   - If not, re-authenticate with Strava

---

## First Time Setup for QT

### Step 1: Initial Access
1. Send QT the main URL
2. Send username (`admin`) and password separately (via Signal/secure channel)
3. Have him login and confirm it works

### Step 2: Generate Historical Letters
You'll need to run the backfill command once:

**Option A: Via Render Shell** (Recommended)
1. Render Dashboard → Your web service
2. Click "Shell" (top right)
3. Run: `php bin/console app:backfill:run-letters`
4. Wait for completion (shows progress)

**Option B: Via Local Terminal** (if you have access)
```bash
# SSH into Render or use their shell
php bin/console app:backfill:run-letters
```

### Step 3: Show QT Around
- Point out "Run Letters" in sidebar
- Show how to edit a letter
- Demonstrate making one public and copying the link
- Explain that new letters generate automatically

---

## Ongoing Maintenance

### Automatic (No action needed):
- ✅ New runs sync daily at 2pm
- ✅ Letters generate automatically for new runs
- ✅ No manual commands required after backfill

### Occasional Tasks:
- **Change password**: Update `APP_ADMIN_PASSWORD` on Render → Auto-redeploys
- **Add new features**: Push to git → Render auto-deploys
- **Check logs**: Render Dashboard → Logs

---

## Security Best Practices

1. **Never commit `.env.local` to git**
   - Already in `.gitignore` ✅
   - If accidentally committed, rotate ALL keys immediately

2. **Strong password**
   - Don't use simple passwords
   - Don't share with anyone
   - Can be changed anytime on Render

3. **URL privacy**
   - Main URL is private (requires login)
   - Only share individual letter URLs
   - Letter URLs are safe to share publicly

4. **HTTPS only**
   - Render provides this automatically ✅
   - Don't use HTTP URLs

---

## Troubleshooting

### Problem: "Unauthorized" or login loop
- **Solution**: Clear browser cache/cookies, try again
- **Check**: Username is exactly `admin` (lowercase)
- **Check**: No extra spaces in password

### Problem: Public letters require login
- **Solution**: Make sure letter is marked "Public" in dashboard
- **Check**: URL is `/letter/abc123...` format
- **Test**: Open in incognito window

### Problem: No activities showing
- **Solution**: Re-authenticate with Strava
- **Check**: Strava credentials are correct
- **Wait**: Initial import takes a few minutes

### Problem: Letters not generating
- **Solution**: Run backfill command (see above)
- **Check**: Claude API key is set correctly
- **Check**: Logs for errors: Render → Logs

---

## Cost Optimization

Render Free Tier:
- ✅ Should work on free tier
- ⚠️ App sleeps after 15min inactivity (spins up on first visit)
- ⚠️ May need paid plan for always-on

To keep app awake (optional):
- Use Render cron job to ping health endpoint
- Or upgrade to paid plan ($7/month)

---

## Summary

**What you've built for QT:**
- ✅ Secure, password-protected dashboard
- ✅ Automatic run letter generation
- ✅ Public sharing capability
- ✅ Minimalist, clean design
- ✅ Complete training analytics
- ✅ Zero maintenance after setup

**Next steps:**
1. Set environment variables on Render
2. Deploy
3. Test login
4. Run backfill command
5. Hand off to QT with credentials

**QT's experience:**
1. Logs in once (browser remembers)
2. Sees letters automatically appear after runs
3. Can edit/share as desired
4. Everything just works™

---

**You're all set!** 🎉

Questions? Check [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) for detailed security info.
