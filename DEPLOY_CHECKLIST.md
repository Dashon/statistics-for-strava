# Deployment Checklist for Render.com

## ✅ Pre-Deployment

- [x] Database reset complete (all tables dropped)
- [x] All migrations fixed for PostgreSQL
- [x] Configuration switched to PostgreSQL-only
- [x] SQLite removed from all environments
- [x] Documentation created

## 🚀 Deployment Steps

### 1. Commit Changes

```bash
git status  # Review changes
git add .
git commit -m "feat: Complete PostgreSQL migration for Render.com

- Remove SQLite, use PostgreSQL/Supabase exclusively
- Fix all migrations for PostgreSQL compatibility
- Configure Supabase Transaction Mode pooler (IPv4)
- Add IF NOT EXISTS safety checks
- Update environment configuration
- Add comprehensive documentation"
git push origin master
```

### 2. Set Environment Variables on Render

Go to Render Dashboard and set these for **BOTH** services:

**Service: statistics-for-strava-app**
```
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ncnpxfbffnooxtahxrox
DB_PASSWORD=MpOvV8voqAbdQiNyIDR7#2xD^wl2^rge
```

**Service: statistics-for-strava-daemon**
```
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ncnpxfbffnooxtahxrox
DB_PASSWORD=MpOvV8voqAbdQiNyIDR7#2xD^wl2^rge
```

### 3. Deploy

- Push triggers automatic deployment on Render
- Or manually trigger: Dashboard → Service → Manual Deploy

### 4. Monitor

Watch deployment logs for:
- ✅ "Running migrations..."
- ✅ "Migration successful"
- ✅ Service starts successfully

### 5. Verify

Once deployed, check:
- [ ] Application loads
- [ ] Database connection works
- [ ] No migration errors in logs

## 🔧 Troubleshooting

### If deployment fails:

1. **Check logs** in Render dashboard
2. **Verify environment variables** are set correctly
3. **Check database connection**:
   ```bash
   psql "postgresql://postgres.ncnpxfbffnooxtahxrox:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
   ```

### If migrations fail:

The migrations now have safety checks (`IF NOT EXISTS`) so they can be re-run safely.

### Reset if needed:

Use the PHP script in `MIGRATION_SUMMARY.md` to reset the database.

## 📚 Documentation

- `DATABASE.md` - Database setup and configuration
- `MIGRATION_SUMMARY.md` - Complete change log and reset instructions
- `DEPLOY_CHECKLIST.md` - This file

## ✨ Post-Deployment

- [ ] Test application functionality
- [ ] Import Strava data
- [ ] Verify run letters feature
- [ ] Monitor for any errors

## 🎉 Success!

Your application is now running on:
- **PostgreSQL** (Supabase) - Production database
- **Render.com** - Hosting platform
- **IPv4-compatible** - Using transaction mode pooler

No more SQLite, no more IPv6 issues, no more schema drift!
