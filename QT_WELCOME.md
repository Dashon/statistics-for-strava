# Welcome to Your Personal Running Dashboard, QT!

This is your **custom running dashboard**, designed specifically for you with the **Run Letters** feature at its heart.

---

## What You Have

### 1. **Run Letters** - Your Personal Running Journal
**NEW! Built just for you.**

This turns every run into a reflective letter. Think of it like a journal that writes itself.

**Where to find it:** Click **"Run Letters"** in the left sidebar (3rd item down)

**What you'll see:**
- AI-generated reflective notes about each run
- Your current running streak
- Distance, pace, and time for each run
- Ability to edit any letter to add your own thoughts

**Example letter:**
> "4.3 miles through familiar streets. Your heart rate stayed low—conservation mode. Sometimes the best runs are the ones that don't demand anything from you."

**What you can do:**
- ✅ **Edit** - Click "Edit" to customize any letter with your own words
- ✅ **Share** - Click "Make Public" then "Copy Link" to share on social media
- ✅ **Keep Private** - All letters are private by default

---

### 2. **Complete Training Analysis**
Your dashboard includes comprehensive training tools:

- **Dashboard** - Overview of your training
- **Activities** - Full list of all your runs
- **Segments** - Your performance on segments
- **Monthly Stats** - Calendar view of your training
- **Eddington Chart** - Distance milestones
- **Heatmap** - Map of everywhere you've run
- **Best Efforts** - Your fastest times
- **Rewind** - Year in review
- **Challenges** - Challenges you've completed
- **Photos** - Pictures from your runs

---

## How to Use Run Letters

### First Time Setup (One Time Only)

After your first Strava sync, letters will be automatically generated for new runs.

**To generate letters for your past runs:**

1. Log into your Render dashboard
2. Go to your web service
3. Click "Shell" (top right)
4. Run this command:
```bash
php bin/console app:backfill:run-letters
```

That's it! This creates letters for all your historical running activities.

---

### Daily Use (Automatic!)

**Every time Strava syncs a new run:**
1. Activity imports automatically
2. Letter generates automatically
3. You get an email notification (if configured)
4. Visit "Run Letters" to see it

**No manual work required!**

---

### Sharing Letters (For Your Brand)

Want to share a run letter on Instagram/Twitter?

1. Go to **"Run Letters"**
2. Find the run you want to share
3. Click **"Make Public"**
4. Click **"Copy Link"**
5. Paste the link anywhere (Instagram bio, Twitter, email, etc.)

People who click the link will see:
- Your beautiful letter
- Run stats (distance, time, pace)
- Your name
- A clean, minimal page perfect for screenshots

**Example share URL:**
```
https://qt.run/letter/a3f2b91c8d4e...
```

---

### Editing Letters

Don't like what the AI wrote? Change it!

1. Click **"Edit"** on any letter
2. Type your own thoughts
3. Click **"Save"**

Your version will be saved and used everywhere (including public shares).

---

## What Happens Behind the Scenes

### Automatic Process:
```
You finish a run
  ↓
Strava records it
  ↓
Your app syncs (daily at 2pm)
  ↓
AI reads the data (distance, pace, heart rate, etc.)
  ↓
Generates a 2-3 sentence reflection
  ↓
Saves to your "Run Letters" page
  ↓
You can edit/share whenever you want
```

---

## Security & Login

**Your dashboard is now password-protected!**

When you visit your site, you'll see a login prompt:
- **Username:** `admin`
- **Password:** (Your developer will provide this)

**Important:**
- ✅ Your main dashboard requires login
- ✅ Public letter links work WITHOUT login (that's by design!)
- ✅ Keep your username/password safe
- ⚠️ Don't share your main URL publicly - only share individual letter links

---

## Support & Questions

**If something doesn't work:**
- Check that Strava is connected (green status in settings)
- Make sure data is syncing (Activities page should show recent runs)
- If you forgot your password, contact your developer
- Contact your developer (that's me!)

**If you want to:**
- Change the letter writing style → I can adjust the AI prompts
- Add more features → Just ask!
- Export all letters → I can add that
- Change your password → I can update it

---

## What Makes This Special

Your personal running dashboard is:
- ✅ **Built for you** - Customized with Run Letters
- ✅ **Automated** - No manual work required
- ✅ **Shareable** - Beautiful pages for your brand
- ✅ **Complete** - Training data + reflective letters

---

## Quick Reference

**Main Features:**
| Feature | What It Does | Where to Find It |
|---------|-------------|------------------|
| Run Letters | AI journal of your runs | Sidebar → "Run Letters" |
| Dashboard | Training overview | Sidebar → "Dashboard" |
| Activities | All your runs | Sidebar → "Activities" |
| Stats & Charts | Training analysis | Various sidebar items |

**Common Actions:**
| I Want To... | Do This |
|-------------|---------|
| See my letters | Click "Run Letters" |
| Share a letter | Make Public → Copy Link |
| Edit a letter | Click "Edit" → Save |
| View training data | Use other sidebar items |

---

## Tips for Best Results

1. **Keep Strava syncing** - The app updates daily at 2pm
2. **Edit letters you love** - Add your own voice to special runs
3. **Share consistently** - Build your brand by sharing regularly
4. **Use both features** - Letters for brand, Stats for training

---

**Enjoy your custom running dashboard!** 🎉

— Your Developer
