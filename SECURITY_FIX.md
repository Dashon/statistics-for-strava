# 🔒 CRITICAL SECURITY FIX - User Data Isolation

## Issue Discovered
**Date**: 2025-12-29
**Severity**: CRITICAL
**Reporter**: User reported "my friend logged in with his strava account.. but he was able to see my data??"

## Root Cause
The `activity` table was missing a `user_id` column, causing ALL users to see ALL activities from ALL users. This is a critical data privacy vulnerability.

## What Was Wrong

### Database Schema
- ❌ `activity` table had NO `user_id` column
- ❌ Activities were not associated with any specific user
- ❌ All queries fetched ALL activities regardless of logged-in user

### Affected Pages
1. **Dashboard** ([src/app/dashboard/page.tsx](src/app/dashboard/page.tsx))
   - Showed total activities from ALL users
   - Displayed recent activities from ALL users
   - Mixed user data in statistics

2. **Run Letters** ([src/app/dashboard/run-letters/page.tsx](src/app/dashboard/run-letters/page.tsx))
   - Listed activities from ALL users
   - Generated letters for other users' activities
   - Exposed private running data

3. **Activities List** ([src/app/dashboard/activities/page.tsx](src/app/dashboard/activities/page.tsx))
   - Showed ALL activities across ALL users
   - No filtering by current user

4. **Activity Detail** ([src/app/dashboard/activities/[activityId]/page.tsx](src/app/dashboard/activities/[activityId]/page.tsx))
   - Users could access any activity by URL
   - No ownership verification

## Fix Implemented

### 1. Database Migration
**File**: [migrations/0007_add_user_id_to_activity.sql](migrations/0007_add_user_id_to_activity.sql)

```sql
ALTER TABLE activity ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity(user_id);
```

**Applied to**: Production Supabase database
**Result**: ✅ All 104 existing activities assigned to correct users

### 2. Schema Update
**File**: [src/db/schema.ts](src/db/schema.ts:41)

```typescript
export const activity = pgTable("activity", {
  activityId: varchar("activityid", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }), // SECURITY: Filter activities by user
  // ... other fields
}, (table) => {
    return {
        sportTypeIdx: index("activity_sporttype").on(table.sportType),
        userIdIdx: index("activity_user_id").on(table.userId), // Index for filtering
    }
});
```

### 3. Query Fixes

#### Dashboard Page
**File**: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx:22-24)

**Before**:
```typescript
const totalActivities = await db.query.activity.findMany();
```

**After**:
```typescript
const totalActivities = await db.query.activity.findMany({
  where: eq(activity.userId, session.userId),
});
```

#### Run Letters Page
**File**: [src/app/dashboard/run-letters/page.tsx](src/app/dashboard/run-letters/page.tsx:27-31)

**Before**:
```typescript
const activities = await db.query.activity.findMany({
  where: eq(activity.sportType, "Run"),
  orderBy: [desc(activity.startDateTime)],
  limit: 20,
});
```

**After**:
```typescript
const activities = await db.query.activity.findMany({
  where: and(
    eq(activity.sportType, "Run"),
    eq(activity.userId, session.userId) // SECURITY FIX
  ),
  orderBy: [desc(activity.startDateTime)],
  limit: 20,
});
```

#### Activities List Page
**File**: [src/app/dashboard/activities/page.tsx](src/app/dashboard/activities/page.tsx:30-37)

**Before**:
```typescript
const [allActivities, [{ value: totalCount }]] = await Promise.all([
  db.query.activity.findMany({
    orderBy: [desc(activity.startDateTime)],
    limit: ITEMS_PER_PAGE,
    offset,
  }),
  db.select({ value: count() }).from(activity),
]);
```

**After**:
```typescript
const [allActivities, [{ value: totalCount }]] = await Promise.all([
  db.query.activity.findMany({
    where: eq(activity.userId, session.userId), // SECURITY FIX
    orderBy: [desc(activity.startDateTime)],
    limit: ITEMS_PER_PAGE,
    offset,
  }),
  db.select({ value: count() }).from(activity).where(eq(activity.userId, session.userId)),
]);
```

#### Activity Detail Page
**File**: [src/app/dashboard/activities/[activityId]/page.tsx](src/app/dashboard/activities/[activityId]/page.tsx:25-37)

**Added Security Check**:
```typescript
const activityData = await db.query.activity.findFirst({
  where: eq(activity.activityId, activityId),
});

if (!activityData) {
  notFound();
}

// SECURITY CHECK: Ensure this activity belongs to the current user
if (activityData.userId !== session.userId) {
  notFound(); // Return 404 if trying to access another user's activity
}
```

### 4. Sync Action Fix
**File**: [src/app/actions/sync.ts](src/app/actions/sync.ts:23-24)

**Before**:
```typescript
const activityData = {
  activityId: act.id.toString(),
  startDateTime: act.start_date,
  // ... other fields
};
```

**After**:
```typescript
const activityData = {
  activityId: act.id.toString(),
  userId: session.userId, // SECURITY FIX: Associate activity with user
  startDateTime: act.start_date,
  // ... other fields
};
```

## Verification Results

After applying all fixes:

```
Total activities: 104
Activities with userId: 104 ✅
Activities without userId: 0 ✅

Activities per user:
  User 24632115: 100 activities
  User 198411230: 4 activities
```

## Security Guarantees

✅ **Users can ONLY see their own activities**
- Dashboard shows only user's own statistics
- Run Letters page shows only user's own runs
- Activities list filtered by current user
- Activity detail pages verify ownership

✅ **Future activities automatically associated with users**
- Sync action includes userId on all new activities
- Database index ensures fast filtering

✅ **Direct URL access blocked**
- Attempting to access another user's activity via URL returns 404
- No error messages that leak existence of other users' data

## Testing Checklist

- [x] Database migration applied to production
- [x] All existing activities assigned to correct users
- [x] Dashboard queries filter by userId
- [x] Run Letters page filters by userId
- [x] Activities list filters by userId
- [x] Activity detail page verifies ownership
- [x] Sync action includes userId for new activities
- [x] No activities exist without userId

## Deployment Notes

This fix has been applied to:
- ✅ Production Supabase database
- ✅ All Next.js pages and server actions
- ✅ Database schema definition

**IMPORTANT**: When deploying to Vercel, ensure:
1. Code is pushed with all query updates
2. Trigger.dev tasks also respect userId filtering (already implemented in triggers)

## Future Improvements

1. **Foreign Key Constraint**
   - Add FK from `activity.user_id` to `User.userid` for referential integrity

2. **Database-Level RLS (Row Level Security)**
   - Consider adding Supabase RLS policies as additional security layer

3. **Audit Log**
   - Track any attempts to access other users' data (for security monitoring)

## Related Files Changed

- `migrations/0007_add_user_id_to_activity.sql` - Database migration
- `src/db/schema.ts` - Schema definition with userId
- `src/app/dashboard/page.tsx` - Dashboard filtering
- `src/app/dashboard/run-letters/page.tsx` - Run letters filtering
- `src/app/dashboard/activities/page.tsx` - Activities list filtering
- `src/app/dashboard/activities/[activityId]/page.tsx` - Activity detail ownership check
- `src/app/actions/sync.ts` - Sync action userId assignment

---

**Status**: ✅ RESOLVED
**Fixed By**: Claude Code
**Verified**: 2025-12-29
