# Prisma Migration Strategy

## Current Status

The NoVaFSM project currently has **1 migration** in the migrations directory:
- `20250111000000_add_asset_document_form_modules` - Adds Assets, Documents, and Forms modules

## ⚠️ Important Note

The existing migration **only includes the 3 newest modules** (Assets, Documents, Forms) and assumes that all base tables already exist. This means:

- ✅ For **existing databases** with base tables: This migration will work
- ❌ For **fresh/new databases**: This migration will fail (missing base tables)

## Migration Approaches

### Option 1: Generate Complete Initial Migration (Recommended for New Deployments)

For fresh database deployments, generate a complete initial migration:

```bash
cd backend

# Remove existing migrations (only do this if starting fresh!)
rm -rf prisma/migrations

# Create comprehensive initial migration
npx prisma migrate dev --name initial_complete_schema

# This will create all 26 models in a single migration
```

**When to use:**
- New production environment
- Fresh database setup
- Clean slate deployments

### Option 2: Keep Incremental History (Recommended for Existing Deployments)

If you have an existing database with the base schema already deployed:

```bash
cd backend

# The current migration is already in place
# Just run it against your database
npx prisma migrate deploy
```

**When to use:**
- Existing databases with base tables
- Continuous deployment from previous versions
- Adding new features to running systems

### Option 3: Manual Schema Baseline (For Legacy Databases)

If you have an existing database that was created without migrations:

```bash
cd backend

# Mark the current state as the baseline
npx prisma migrate resolve --applied 20250111000000_add_asset_document_form_modules

# Future migrations will build on this baseline
```

## Recommended Migration Creation Process

### For Development

```bash
cd backend

# 1. Modify prisma/schema.prisma with your changes

# 2. Generate migration with descriptive name
npx prisma migrate dev --name add_feature_name

# 3. Review the generated SQL in prisma/migrations/

# 4. Test migration on local database

# 5. Commit migration files to Git
git add prisma/migrations/
git commit -m "feat: add migration for feature_name"
```

### For Production

```bash
cd backend

# 1. Pull latest migrations from Git
git pull

# 2. Review migrations that will be applied
npx prisma migrate status

# 3. Create database backup (CRITICAL!)
# pg_dump -U user -d novafsm -f backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Apply migrations
npx prisma migrate deploy

# 5. Verify application starts successfully
npm run start:prod

# 6. If issues occur, rollback using backup
# psql -U user -d novafsm -f backup_YYYYMMDD_HHMMSS.sql
```

## Current Schema Overview

The complete schema includes **26 models**:

### Core (6 models)
- Organization (tenant)
- User
- Technician
- Customer
- Site
- TaxRate

### Pricing & Quotations (4 models)
- PriceList
- PriceItem
- Quote
- QuoteLine

### Jobs & Operations (2 models)
- Job
- Invoice

### Inventory (2 models)
- InventoryItem
- InventoryUsage

### Time & Expense (2 models)
- TimeEntry
- ExpenseEntry

### Assets & Documents (5 models) - NEW
- Asset
- Document
- FormTemplate
- FormAssignment
- FormResponse

### System (5 models)
- Sequence
- AuditLog
- OutboxEvent
- IdempotencyKey
- TokenBlacklist

## Migration Best Practices

### 1. Always Review Generated SQL
Never blindly apply migrations. Review the SQL to ensure it does what you expect.

### 2. Test on Non-Production First
Always test migrations on development and staging environments before production.

### 3. Backup Before Migrating
ALWAYS create a database backup before applying migrations to production.

### 4. Use Descriptive Migration Names
```bash
# Good
npx prisma migrate dev --name add_asset_maintenance_tracking

# Bad
npx prisma migrate dev --name update
```

### 5. Keep Migrations Small and Focused
One migration should address one feature or fix. Don't combine multiple unrelated changes.

### 6. Never Modify Existing Migrations
Once a migration is committed and deployed, never modify it. Create a new migration to fix issues.

### 7. Handle Data Migrations Carefully
If you need to migrate data (not just schema), consider:
- Using Prisma's migration API
- Writing custom SQL in the migration file
- Using a separate data migration script

## Rollback Strategy

### Development
```bash
# Undo last migration
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Recreate database
# 3. Apply all migrations
# 4. Run seed script
```

### Production (Manual Rollback)
```bash
# 1. Restore from backup (safest)
psql -U user -d novafsm -f backup_YYYYMMDD_HHMMSS.sql

# 2. OR manually create rollback SQL
# Review the failed migration's SQL
# Write inverse operations
# Apply rollback SQL manually
```

## Common Issues and Solutions

### Issue: "Table already exists" Error
**Cause:** Migration expects table to not exist, but it does.

**Solution:**
```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied <migration_name>
```

### Issue: "Foreign key constraint fails"
**Cause:** Referential integrity violation during migration.

**Solution:**
- Ensure parent tables exist before child tables
- Check data consistency
- Review migration order

### Issue: "Migration diverged"
**Cause:** Local migrations differ from database state.

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Reset to match database
npx prisma migrate resolve --rolled-back <migration_name>
```

## Environment-Specific Considerations

### Local Development
- Use `prisma migrate dev` for automatic migration and regeneration
- Frequent resets are acceptable
- Seed data after migrations

### Staging
- Use `prisma migrate deploy` for consistent state
- Mirror production as closely as possible
- Test rollback procedures

### Production
- ALWAYS backup before migrating
- Use `prisma migrate deploy` only
- Monitor application after migration
- Have rollback plan ready

## Future Migration Roadmap

When adding new features, follow this pattern:

```bash
# 1. Add model to schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_new_feature

# 3. Verify migration SQL
# 4. Test locally
# 5. Commit to Git
# 6. Deploy to staging
# 7. Deploy to production
```

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Database Schema Evolution](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)

---

**Last Updated:** 2025-11-06
**Schema Version:** 0.9.0 (26 models)
