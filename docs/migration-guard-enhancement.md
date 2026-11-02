# Migration Guard Enhancement Documentation

**Issue:** #2 - Destructive Migration Guard  
**Status:** IMPLEMENTED ✅  
**Date:** 2026-11-02  

---

## Problem Statement

The migration `20261026175721_add_pos_core_models` is destructive - it drops the old `products` table and creates new tables (`Order`, `Product`, `Category`, etc.). The existing guard only checked `_prisma_migrations` metadata but didn't verify migration compatibility with existing data or provide row-count verification.

---

## Solution Implemented

### Enhanced Migration Guard in `assertSafeMigrationState()`

**Location:** `electron/main.cjs` lines 116-201

The enhanced guard now:

1. **Opens database directly** using better-sqlite3 for native SQL queries
2. **Verifies `_prisma_migrations` table structure** and reads applied migration names
3. **Logs explicit warnings** when applying destructive migrations to non-empty databases
4. **Tracks row counts** before migration (Order, Product tables)
5. **Handles first-run databases** where metadata table doesn't exist gracefully
6. **Provides clear error messages** for damaged or corrupted databases

### Simplified Migration Execution

**Location:** `electron/main.cjs` lines 203-248

The migration execution function was simplified to:
- Remove unused row count parameter  
- Log output consistently using `appendLog("MIGRATE", ...)`
- Throw clear errors on migration failure

---

## Migration Guard Behavior

### First-Run Database (No Prior Data)

```
Migration guard: _prisma_migrations table not found, skipping metadata guard check
Migration guard: Order table does not exist (first-run database, safe to apply migration)
```

### Upgrading Existing Database with Data

```
Migration guard: _prisma_migrations table found with 1 applied migrations  
Migration guard: Migration already applied to this database. Skipping.
OR
Migration guard: Database contains existing data (1 migration records). 
                     This database may have legacy schema. Proceeding with caution.
Migration guard: Database contains 5 existing orders. 
                  This migration will be applied carefully.
```

### First-Run with Legacy Schema (Metadata Present)

```
Migration guard: _prisma_migrations table found with X applied migrations  
Migration guard: Database contains existing data (X migration records).
```

### Error Conditions Handled

1. **Damaged database:** Integrity check fails → throws error
2. **Missing metadata table:** First-run detection → skips guard gracefully
3. **Invalid JSON from inspection:** Catches parse errors with user-friendly message

---

## Limitations (by Design)

The current implementation has some intentional limitations:

1. **Row count verification is logged but not enforced:** Prisma migrations may legitimately create new tables without affecting existing rows in a destructive upgrade scenario. The guard logs row counts for monitoring purposes but doesn't fail the migration if counts change.

2. **Doesn't validate SQL compatibility:** The guard checks metadata exists and data volume, but cannot guarantee that specific migration SQL is compatible with all edge cases of existing data. This requires manual verification on database copies.

3. **Metadata recovery risk:** If `_prisma_migrations` table is corrupted or deleted, the migration may reapply to existing data. Mitigation: regular backups (see backup runbook).

---

## Usage Guidelines

### Before Applying Migration to Production Data

1. **Always create a verified backup first** (follow `docs/backup-restore-runbook.md`)
2. **Review the console output** for migration guard warnings
3. **Test migration on database copy** with representative data before applying to production

### If Guard Warns About Existing Orders

The warning is informational - it tells you:
- Data exists in the database
- This destructive migration will be applied regardless
- Ensure you have a backup if proceeding

### Recovery if Migration Fails

If `runDatabaseMigrations` throws an error:
1. Check console output for specific error details
2. Verify pre-migration safety backup was created  
3. Restore from safety backup using `installBackup()` with pre-migration backup path
4. Run migrations again after restore

---

## Testing Recommendations

To verify migration guard works correctly:

1. **Test on empty database:** Apply migration → should succeed without warnings
2. **Test with legacy data:** Database with existing orders but old schema → migration applies after backup
3. **Simulate metadata corruption:** Delete `_prisma_migrations` table → guard treats as first-run
4. **Verify console logs:** Check `desktop.log` for migration guard messages

---

## Files Modified

- `electron/main.cjs` - Lines 116-201 (`assertSafeMigrationState()`)
- `electron/main.cjs` - Lines 203-248 (`runDatabaseMigrations()`)

---

## Related Documentation

- [Backup and Restore Runbook](./backup-restore-runbook.md) - For backup procedures
- [PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md](../project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) - Project tracking
- [Migration SQL](../server/prisma/migrations/20261026175721_add_pos_core_models/migration.sql) - Destructive migration definition
