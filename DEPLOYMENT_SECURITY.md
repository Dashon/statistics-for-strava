# Security Setup for QT's Running Dashboard

## What Was Added

✅ **HTTP Basic Authentication** - Password protection for the admin dashboard
✅ **Public Letter Sharing** - Letter URLs remain accessible without login
✅ **Secure by Default** - All admin features require authentication

---

## Environment Variables to Set on Render

When deploying to Render, you need to add these environment variables:

### Required Variables:

1. **APP_SECRET**
   - Value: Generate a random 32-character string
   - Example: `openssl rand -hex 32` (run this in terminal)
   - Purpose: Symfony session encryption

2. **APP_ADMIN_PASSWORD**
   - Value: Choose a strong password for QT
   - Example: `MyStr0ngP@ssw0rd2024!`
   - Purpose: Login password (username is always `admin`)

### How to Add on Render:

1. Go to your Render dashboard
2. Select your web service
3. Click "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Add each variable:
   - Key: `APP_SECRET`
   - Value: (your generated secret)
   - Click "Save"
6. Repeat for `APP_ADMIN_PASSWORD`
7. Your service will automatically redeploy

---

## What's Protected vs Public

### 🔒 Protected (Requires Login):
- Main dashboard (`https://your-app.onrender.com/`)
- Run Letters page (`https://your-app.onrender.com/run-letters`)
- Activities page
- All admin/editing features
- API endpoints for editing letters

### 🌐 Public (No Login Required):
- Individual letter share URLs (`https://your-app.onrender.com/letter/abc123...`)
- Strava OAuth callbacks (for initial setup)
- Strava webhook (for activity imports)

---

## How It Works

When someone visits the main site:
1. Browser shows login prompt
2. They enter username: `admin`
3. They enter the password you set
4. If correct, they get access
5. Browser remembers this (HTTP Basic Auth)

When someone clicks a shared letter link:
- They see the letter immediately
- No login required
- Perfect for sharing on social media

---

## Testing Locally

To test the authentication locally:

1. Make sure your `.env.local` has:
   ```env
   APP_SECRET=your-secret-key-here
   APP_ADMIN_PASSWORD=your-password-here
   ```

2. Rebuild Docker:
   ```bash
   docker-compose build app
   docker-compose up -d
   ```

3. Visit `http://localhost` - you should see a login prompt

4. Test a public letter:
   - Login to the dashboard
   - Make a letter public
   - Copy the share URL
   - Open in incognito/private window
   - Should display WITHOUT login prompt

---

## Security Notes

### ✅ What This Protects Against:
- Unauthorized editing of letters
- Unauthorized access to admin dashboard
- Random people discovering and using the site

### ⚠️ What This Doesn't Protect Against:
- Brute force attacks (use strong password)
- If someone guesses/shares the main URL and password

### 🔐 Best Practices for QT:
1. **Use a strong password** - Mix of letters, numbers, symbols
2. **Don't share the main URL** - Only share individual letter links
3. **Don't share the password** - Keep it private
4. **Use HTTPS** - Render provides this automatically

---

## Troubleshooting

**Problem: Login prompt keeps appearing**
- Clear browser cache/cookies
- Make sure username is exactly `admin` (lowercase)
- Check password doesn't have extra spaces

**Problem: Public letters require login**
- Check the security.yaml config
- Make sure the letter URL pattern is `/letter/` not something else
- Verify letter is marked as "Public" in the dashboard

**Problem: Forgot password**
- Update `APP_ADMIN_PASSWORD` on Render
- Service will redeploy with new password

---

## Changing the Password

### On Render:
1. Environment → Find `APP_ADMIN_PASSWORD`
2. Click Edit
3. Enter new password
4. Save (auto-redeploys)

### Locally:
1. Edit `.env.local`
2. Change `APP_ADMIN_PASSWORD=new-password`
3. Restart Docker: `docker-compose restart`

---

## For Future: Adding More Users

Current setup supports ONE user (`admin`). To add more users:

1. Edit `config/packages/security.yaml`
2. Add new users to the `in_memory` provider:
   ```yaml
   users:
       admin:
           password: '%env(APP_ADMIN_PASSWORD)%'
           roles: ['ROLE_ADMIN']
       qt:
           password: '%env(QT_PASSWORD)%'
           roles: ['ROLE_ADMIN']
   ```
3. Add corresponding env variables

---

## Summary

- ✅ Security bundle installed
- ✅ HTTP Basic Auth configured
- ✅ Public letter sharing works without login
- ✅ Admin features require password
- ✅ Ready to deploy on Render

Just set the environment variables and you're secure!
