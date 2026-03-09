# Runbook: Database Migrations

## Development Migrations

```bash
cd backend

# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name <descriptive-name>

# Example
npx prisma migrate dev --name add-job-priority-field
```

## Production Migrations

```bash
cd backend

# Apply all pending migrations (no schema changes, no seed)
npx prisma migrate deploy
```

Run this as part of deployment before starting the new app version.

## Rollback

Prisma does not auto-rollback migrations. To revert:
1. Identify the migration to undo in `prisma/migrations/`
2. Write and apply a compensating migration manually
3. Or restore from database backup

## Inspecting Migration State

```bash
npx prisma migrate status   # Show applied vs pending migrations
npx prisma db pull          # Sync schema.prisma from current DB state
```

## Seeding

```bash
npm run seed    # Runs prisma/seed.ts — safe to re-run (uses upsert)
```
