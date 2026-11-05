---
name: database-audit
description: Review and audit database schema changes, migrations, and data integrity. Use when modifying Prisma schema, creating migrations, or verifying data safety before deployment.
---

# Database Audit Skill

This skill helps you safely review and manage database schema changes for the Cafe POS application.

## Core Principles

- **SQLite via Prisma 7** with `better-sqlite3` adapter
- Schema is split across `server/prisma/schema/` files
- Migration history in `server/prisma/migrations/`
- **NEVER** modify production data without backup and testing

## Database Location

```
cafe-pos/
└── server/
    └── prisma/
        ├── schema/           # Prisma schema files (*.prisma)
        └── migrations/       # Migration history (timestamp_description/)
            └── 20261026175721_add_pos_core_models/
                └── migration.sql
```

## Pre-Migration Checklist

Before applying any schema changes:

### 1. Backup Verification

- [ ] Database file backed up to separate location
- [ ] Backup tested with restore procedure
- [ ] Retention policy followed (daily/weekly/monthly)

### 2. Data Integrity Check

```typescript
// Run this BEFORE destructive migrations
const rowCount = await prisma.product.count();
console.log(`Products before migration: ${rowCount}`);

const categoryCount = await prisma.category.count();
console.log(`Categories before migration: ${categoryCount}`);
```

### 3. Migration Guard Validation

The migration guard in `electron/main.cjs` (lines 116-130) checks:

- Metadata exists in migrations table
- Row counts preserved after destructive operations
- Logs explicit warnings for non-empty databases

## Schema Modification Workflow

### Step 1: Review Current Schema

```bash
# View current schema
cat server/prisma/schema/*.prisma

# Or use Prisma Studio
npx prisma studio --schema=server/prisma/schema
```

### Step 2: Plan Changes

- Identify which models are affected
- Check for foreign key relationships
- Determine if migration is additive or destructive
- Document data loss implications

### Step 3: Create Migration

```bash
# Generate migration from schema changes
cd server
npx prisma migrate dev --name descriptive_name
```

### Step 4: Review Migration SQL

```bash
# View generated migration
cat server/prisma/migrations/YYYYMMDDHHMMSS_description/migration.sql
```

Check for:
- ✅ `ALTER TABLE` statements (safe)
- ⚠️ `DROP TABLE` statements (destructive - verify row count preservation)
- ❌ Missing rollback logic

### Step 5: Test on Copy

```bash
# Create database copy for testing
cp server/data/cafe-pos.db server/data/cafe-pos-test.db

# Run migration on test copy
npx prisma migrate deploy --schema=server/prisma/schema
```

## Common Migration Patterns

### Safe Additive Changes

```sql
-- Adding new column with default
ALTER TABLE "Product" ADD COLUMN "is_featured" BOOLEAN DEFAULT false;

-- Adding new model
CREATE TABLE "Ingredient" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Destructive Changes (Use with Caution)

```sql
-- Dropping table - ONLY if no data or backup verified
DROP TABLE IF EXISTS "OldTable";

-- Must verify row counts before/after
SELECT COUNT(*) FROM "Product";  -- Before
-- ... migration ...
SELECT COUNT(*) FROM "Product";  -- After (should match)
```

## Migration Guard Implementation

Located in `electron/main.cjs`:

```typescript
async function assertSafeMigrationState() {
  // Check metadata exists
  const hasMetadata = await prisma.$queryRaw`SELECT 1 FROM sqlite_master WHERE type='table' AND name='Migration';`;
  
  // Verify row counts before destructive operations
  const productCountBefore = await prisma.product.count();
  
  if (productCountBefore > 0) {
    console.warn('⚠️ WARNING: Database contains data. Migration may cause data loss.');
  }
  
  return hasMetadata;
}
```

## Data Integrity Rules

### Category Management

- Category deletion is **REJECTED** while products remain assigned
- Category renames update all assigned products transactionally
- Existing category strings are backfilled by additive migration

### Product Management

- Products are **retained** rather than hard-deleted (order snapshots)
- Unavailable products can be hidden but not deleted
- Photo files stored in `server/data/product-images/`

## Backup & Restore Runbook

See `docs/backup-restore-runbook.md` for:

1. Retention schedule (daily/weekly/monthly)
2. Storage locations (local drive + off-site)
3. Pre-backup integrity checks
4. Step-by-step restore procedure
5. Post-restore validation checklist

## Error Handling

### Parser Errors

Classified correctly with consistent feedback:

```typescript
try {
  await prisma.$executeRawUnsafe(sql);
} catch (error) {
  if (error.code === 'P2002') {
    // Foreign key violation
    throw new DatabaseError('Foreign key constraint failed', error);
  } else if (error.code === 'P2025') {
    // Record not found
    throw new DatabaseError('Record not found', error);
  }
  throw error;
}
```

## Verification Commands

```bash
# Check migration status
npx prisma migrate status --schema=server/prisma/schema

# List all migrations
ls -la server/prisma/migrations/

# View studio (interactive DB browser)
npx prisma studio --schema=server/prisma/schema

# Reset database (DESTRUCTIVE - use with caution)
npm run db:reset --prefix server
```

## Related Skills

- `/cafe-pos-familiarization` - For overall project understanding
- `/release-validation` - For pre-release testing including DB checks