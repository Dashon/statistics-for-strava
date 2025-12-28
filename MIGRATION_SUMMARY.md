# PostgreSQL Migration Summary

## What Changed

### 1. Database Platform
- **Before**: SQLite for local, no production database
- **After**: PostgreSQL/Supabase for ALL environments (dev, test, prod)

### 2. Configuration Files

#### `.env` (committed)
- Default configuration for all environments
- Points to Supabase pooler
- Safe placeholder password

#### `.env.local` (not committed)
- Your real credentials
- Overrides `.env` values

#### `config/packages/doctrine.yaml`
- Component-based DB configuration (individual params vs URL)
- Avoids URL encoding issues
- PostgreSQL server version specified

### 3. Migrations Fixed

**Data Type Compatibility:**
- `DATETIME` → `TIMESTAMP`
- `CLOB` → `TEXT`
- `0`/`1` → `FALSE`/`TRUE` (booleans)
- `"string"` → `'string'` (SQL standard)

**SQLite-Specific Features:**
- 14 migrations with platform checks
- Skip data transformations on PostgreSQL
- `JSON_EXTRACT` → skipped
- `__temp__` tables → skipped

### 4. Network/Connectivity

**Issue**: Render.com doesn't support IPv6
**Solution**: Use Supabase Transaction Mode pooler

- Hostname: `aws-1-ap-south-1.pooler.supabase.com`
- Port: `6543` (transaction mode)
- Username: `postgres.ncnpxfbffnooxtahxrox` (includes project ref)

## Files Modified

### Configuration
- `config/packages/doctrine.yaml`
- `.env`
- `.env.local`
- `.gitignore`

### Migrations
- 14 migration files with SQLite platform checks
- 1 migration with boolean fix
- All migrations: DATETIME→TIMESTAMP, CLOB→TEXT

### Documentation
- `DATABASE.md` (new)
- `MIGRATION_SUMMARY.md` (this file)

## Deployment Checklist

### Render.com Environment Variables

Set for BOTH services (`app` and `daemon`):

```
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ncnpxfbffnooxtahxrox
DB_PASSWORD=MpOvV8voqAbdQiNyIDR7#2xD^wl2^rge
```

### Git Commit

```bash
git add .
git commit -m "feat: Migrate to PostgreSQL/Supabase for all environments

BREAKING CHANGE: Removed SQLite support

- Configure Supabase Transaction Mode pooler for IPv4 compatibility
- Fix all migrations for PostgreSQL (DATETIME→TIMESTAMP, CLOB→TEXT, etc.)
- Use component-based DB config to avoid password encoding issues
- Skip SQLite-specific data migrations on PostgreSQL
- Update test environment to use PostgreSQL
- Add comprehensive database documentation

Fixes: Render.com deployment with IPv6 connectivity issues"
git push
```

### Deploy

1. Push code to GitHub
2. Render automatically deploys
3. Migrations run automatically
4. Check logs for success

## Troubleshooting

### If migrations fail:

1. Check environment variables are set correctly
2. Verify pooler hostname and port
3. Test connection: `psql "postgresql://postgres.ncnpxfbffnooxtahxrox:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"`

### Reset database:

```bash
# Drop all tables (use carefully!)
php -r "
\$pdo = new PDO('pgsql:host=aws-1-ap-south-1.pooler.supabase.com;port=6543;dbname=postgres', 
                 'postgres.ncnpxfbffnooxtahxrox', 
                 'PASSWORD');
\$tables = \$pdo->query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'')->fetchAll(PDO::FETCH_COLUMN);
foreach (\$tables as \$table) {
    \$pdo->exec('DROP TABLE \"' . \$table . '\" CASCADE');
}
echo 'Done';
"
```

## Benefits

1. **Consistency**: Same database for all environments
2. **Production-ready**: Using actual production database technology
3. **No schema drift**: Migrations tested against real PostgreSQL
4. **Scalability**: PostgreSQL handles concurrent connections better
5. **Features**: Access to PostgreSQL-specific features (JSONB, arrays, etc.)
