# Database Configuration

This application uses **PostgreSQL via Supabase** for all environments (development, testing, and production).

## Configuration

### Environment Variables

Set these in your `.env.local` file (local development) or Render environment (production):

```bash
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=6543                                    # Transaction mode pooler
DB_NAME=postgres
DB_USER=postgres.ncnpxfbffnooxtahxrox
DB_PASSWORD=your_password_here
```

### Why Supabase Pooler?

- **Port 6543**: Transaction mode - optimized for serverless/ephemeral connections (Render.com)
- **IPv4 Compatible**: Render.com doesn't support IPv6; pooler provides IPv4 connectivity
- **Component-based config**: Avoids URL encoding issues with special characters in passwords

### Migrations

Run migrations:
```bash
bin/console doctrine:migrations:migrate
```

### SQLite Removed

Previous versions used SQLite for local development. We now use PostgreSQL for all environments to ensure consistency and avoid schema drift.

## Supabase Setup

1. Get your connection details from: Supabase Dashboard → Project Settings → Database → Connection Pooling
2. Select "Transaction" mode
3. Copy the pooler hostname (format: `aws-X-region.pooler.supabase.com`)
4. Use the pooler port `6543` (not direct connection port `5432`)

## Render.com Deployment

Set environment variables in Render dashboard for both services:
- `statistics-for-strava-app`
- `statistics-for-strava-daemon`

Migrations run automatically on deployment via the import command.
