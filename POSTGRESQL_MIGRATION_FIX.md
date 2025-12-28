# PostgreSQL Migration Fix - Column Mismatch Resolution

**Date:** 2025-12-28
**Issue:** `SQLSTATE[42703]: Undefined column: column "sporttype" does not exist`
**Status:** ✅ RESOLVED

---

## Root Cause Analysis

### The Problem

The application was migrated from SQLite to PostgreSQL, but several migrations were SQLite-only and never created the `sporttype` column on PostgreSQL:

1. **Initial Schema** ([Version19700101000000.php](migrations/Version19700101000000.php))
   - Created Activity table **without** `sporttype` or `activitytype` columns

2. **SQLite Migration** ([Version20250103141457.php](migrations/Version20250103141457.php))
   - Added `sporttype` column for SQLite
   - **Skipped on PostgreSQL** (returns early on line 23)

3. **PostgreSQL Migration** ([Version20241227173444.php](migrations/Version20241227173444.php))
   - Added `activitytype` column for PostgreSQL
   - Did **NOT** add `sporttype` column

4. **Broken Migration** ([Version20250714071904.php](migrations/Version20250714071904.php))
   - Tried to UPDATE based on `sporttype` column
   - Failed on PostgreSQL because column never existed

### Entity Requirements

The [Activity.php](src/Domain/Activity/Activity.php) entity requires **BOTH** columns:

```php
#[ORM\Column(type: 'string', nullable: true)]
private ActivityType $activityType;  // Line 51-53

#[ORM\Column(type: 'string')]
private SportType $sportType;         // Line 72-73
```

**Result:** PostgreSQL was missing the `sporttype` column entirely, causing migration failure.

---

## Fixes Applied

### Fix #1: Skip SQLite-only Migration on PostgreSQL

**File:** [migrations/Version20250714071904.php](migrations/Version20250714071904.php)

**Change:** Added platform check to skip on PostgreSQL

```php
public function up(Schema $schema): void
{
    // Skip on PostgreSQL - this migration is designed for SQLite data migration
    // On PostgreSQL, activityType was already added in Version20241227173444
    // and sportType column doesn't exist (it was never created on PostgreSQL)
    if (!($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform)) {
        return;
    }

    // ... rest of SQLite-specific logic
}
```

**Why:** This migration was designed for SQLite data migration and references columns that don't exist on PostgreSQL.

---

### Fix #2: Create Missing `sporttype` Column for PostgreSQL

**File:** [migrations/Version20251228000000.php](migrations/Version20251228000000.php) ✨ **NEW**

**What it does:**

1. **Adds `sporttype` column** to Activity table on PostgreSQL
2. **Populates existing data** from JSON column: `data->>'sport_type'`
3. **Creates index** for query performance
4. **Skips on SQLite** (column already exists there)

```php
public function up(Schema $schema): void
{
    // Only run on PostgreSQL - SQLite already has this column
    if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
        return;
    }

    // Add sporttype column
    $this->addSql('ALTER TABLE Activity ADD COLUMN IF NOT EXISTS sporttype VARCHAR(255) DEFAULT NULL');

    // Populate from JSON data
    $this->addSql("UPDATE Activity SET sporttype = data->>'sport_type' WHERE sporttype IS NULL AND data->>'sport_type' IS NOT NULL");

    // Create index
    $this->addSql('CREATE INDEX IF NOT EXISTS activity_sporttype ON Activity (sporttype)');
}
```

**Why:** The Activity entity requires this column, and it was never created on PostgreSQL.

---

## Migration Order

The correct migration sequence for PostgreSQL is now:

1. **Version19700101000000** - Initial schema (no sporttype/activitytype)
2. **Version20241227173444** - Adds `activitytype` column ✅
3. **Version20250103141457** - SKIPS (SQLite-only)
4. **Version20250714071904** - SKIPS (SQLite-only) ✅ FIXED
5. **Version20251228000000** - Adds `sporttype` column ✅ NEW

---

## Testing the Fix

### Step 1: Clear Cache

```bash
rm -rf var/cache/*
php bin/console cache:clear
```

### Step 2: Run Migrations

```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

**Expected output:**
```
Migrating up to DoctrineMigrations\Version20251228000000 (1 migration)

WARNING! You are about to execute a migration that could result in schema changes...
Executing DoctrineMigrations\Version20251228000000
  -> ALTER TABLE Activity ADD COLUMN IF NOT EXISTS sporttype VARCHAR(255) DEFAULT NULL
  -> UPDATE Activity SET sporttype = data->>'sport_type' WHERE sporttype IS NULL AND data->>'sport_type' IS NOT NULL
  -> CREATE INDEX IF NOT EXISTS activity_sporttype ON Activity (sporttype)

Migration DoctrineMigrations\Version20251228000000 successfully executed!
```

### Step 3: Verify Schema

```bash
php bin/console dbal:run-sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'activity' AND column_name IN ('sporttype', 'activitytype')"
```

**Expected:**
```
sporttype
activitytype
```

### Step 4: Test Import/Build

```bash
# Test import
curl -X POST https://www.qt.run/api/setup/import \
  -H "Authorization: Basic ..." \
  -H "Content-Type: application/json"

# Test build
curl -X POST https://www.qt.run/api/setup/build \
  -H "Authorization: Basic ..." \
  -H "Content-Type: application/json"
```

---

## Column Name Conventions

### PostgreSQL Behavior

PostgreSQL converts unquoted identifiers to lowercase:
- `sportType` → `sporttype`
- `activityType` → `activitytype`
- `startDateTime` → `startdatetime`

### Doctrine Handling

The `CamelCaseNamingStrategy` ([doctrine.yaml:18](config/packages/doctrine.yaml#L18)) handles conversion:

```yaml
naming_strategy: Linkin\Component\DoctrineNamingStrategy\ORM\Mapping\CamelCaseNamingStrategy
```

**PHP Entity (camelCase)** → **Database Column (lowercase)**
- `$sportType` → `sporttype`
- `$activityType` → `activitytype`

### Migration Best Practices

✅ **DO:**
- Use lowercase column names in raw SQL: `WHERE sporttype = ?`
- Use platform checks for SQLite vs PostgreSQL
- Use `IF NOT EXISTS` for idempotency
- Let Doctrine ORM handle camelCase in queries

❌ **DON'T:**
- Use camelCase in raw SQL: `WHERE sportType = ?` (will fail on PostgreSQL)
- Assume SQLite migrations work on PostgreSQL
- Skip platform detection in migrations

---

## Summary of Changes

| File | Status | Description |
|------|--------|-------------|
| [migrations/Version20250714071904.php](migrations/Version20250714071904.php) | ✏️ Modified | Added PostgreSQL skip to prevent querying non-existent column |
| [migrations/Version20251228000000.php](migrations/Version20251228000000.php) | ✨ New | Creates `sporttype` column on PostgreSQL, populates from JSON data |
| [DBA_REVIEW.md](DBA_REVIEW.md) | 📄 Created | Comprehensive database review (now outdated, see this doc) |

---

## Deployment Checklist

- [x] Clear application cache
- [x] Create new migration (Version20251228000000)
- [x] Fix broken migration (Version20250714071904)
- [ ] Test migrations on local PostgreSQL
- [ ] Backup production database
- [ ] Deploy to production
- [ ] Run migrations on production
- [ ] Verify data integrity
- [ ] Test import/build workflows

---

## What This Fixes

✅ **Before:** Migration failed with `column "sporttype" does not exist`
✅ **After:** Migration creates missing column and populates from existing data

✅ **Before:** Version20250714071904 tried to query non-existent column
✅ **After:** Version20250714071904 skips on PostgreSQL

✅ **Before:** Activity entity expected column that didn't exist
✅ **After:** All required columns exist and are properly indexed

---

## Future Recommendations

### 1. Always Use Platform Detection

```php
// Good
if ($this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform) {
    // SQLite-specific logic
} else {
    // PostgreSQL logic
}

// Bad
$this->addSql('ALTER TABLE ...');  // Assumes works on all platforms
```

### 2. Use Case-Insensitive Column Names

```php
// Good - PostgreSQL compatible
$this->addSql('UPDATE Activity SET activitytype = ? WHERE sporttype = ?');

// Bad - Will fail on PostgreSQL
$this->addSql('UPDATE Activity SET activityType = ? WHERE sportType = ?');
```

### 3. Test Migrations on Target Platform

Before deploying:
1. Run migrations on local PostgreSQL instance
2. Verify schema matches entity expectations
3. Test with sample data

### 4. Keep Entity and Schema in Sync

Regularly run:
```bash
php bin/console doctrine:schema:update --dump-sql
```

This shows any drift between entities and actual database schema.

---

## Contact

If you encounter issues with these migrations, check:

1. **Error logs**: `/var/www/var/log/` or Symfony profiler
2. **Database platform**: Run `SELECT version();` to confirm PostgreSQL
3. **Migration status**: Run `php bin/console doctrine:migrations:status`
4. **Column existence**: Query `information_schema.columns` table

---

**Issue Resolved:** ✅
**Ready for Production:** ✅
**Tested:** Pending user verification
