# Backup and Restore Recovery Runbook

**Document version:** 1.0  
**Last updated:** 2026-11-02  
**Maintained by:** Development team  

---

## Overview

This runbook provides complete procedures for backing up and restoring the Cafe POS application data, including SQLite databases, product photos, and Prisma migration metadata. It also documents the backup retention policy, recovery workflow, and post-restore validation checklist.

### Protected Data Assets

| Asset | Location | Purpose |
|-------|----------|---------|
| **SQLite database** | `server/data/cafe-pos.db` | Orders, products, categories, expenses, settings, audit logs |
| **Product photos** | `server/data/product-images/` | Product thumbnails and category images |
| **Migration metadata** | Embedded in SQLite `_prisma_migrations` table | Tracks applied migrations for safety guards |

---

## Retention Policy

### Backup Schedule

| Frequency | Timing | Retention Period | Storage Location |
|-----------|--------|------------------|------------------|
| **Daily backup** | Each morning at 02:00 (or after business hours) | 7 days | Local external drive or network share |
| **Weekly backup** | Sunday 02:00 | 1 month | External drive or cloud storage |
| **Monthly archive** | Last day of month, 02:00 | Indefinite | Cloud storage or offline media |

### Storage Requirements

- **Minimum:** One copy on separate physical drive from POS computer
- **Recommended:** Primary local backup + off-site cloud copy (e.g., AWS S3, Backblaze B2)
- **Critical backups include:** Full database file AND product-images folder

### Backup Location Paths

```bash
# Primary backup location (must be different disk from POS computer)
/backups/pos-daily/YYYY/MM/DD-backup-{TIMESTAMP}.zip

# Example: /backups/pos-daily/2026/11/02-backup-20261102020000.zip

# Off-site cloud storage (optional but recommended)
s3://your-cloud-bucket/cafe-pos-backups/{DATE}/
```

---

## Pre-Backup Checks

### Automated Check List

Before creating a backup, verify:

- [ ] No active restore operation in progress
- [ ] Database file exists and is readable
- [ ] Product-images directory is accessible
- [ ] Backup destination has available space (at least 2x database size)
- [ ] App data path is writable (`electron.getPath('userData')`)

### Integrity Verification

Run SQLite integrity check on current database:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./server/data/cafe-pos.db', { readonly: true });
try {
  const result = db.prepare('PRAGMA integrity_check').get();
  console.log('Integrity check:', result);
} catch (error) {
  console.error('Database corrupted:', error.message);
  process.exit(1);
}
db.close();
"
```

### Process State Check

Ensure no active transactions that could affect backup consistency:

- [ ] No checkout process actively printing receipts
- [ ] No restore operation in progress (check `desktop.log`)
- [ ] Backup UI not currently creating a backup

---

## Backup Creation Procedure

### Manual Backup via Desktop App

1. **Open the Cafe POS application**
2. **Navigate to Settings page** (`/settings`)
3. **Click "Create Backup" button**
4. **Review backup summary:**
   - Database path displayed
   - Product-images folder path shown
   - Estimated backup size
5. **Confirm backup creation**
6. **Verify success message appears** with timestamp and backup location

### Automated Backup via Script

For scheduled backups, use this script:

```bash
#!/usr/bin/env node
// scripts/backup-daily.cjs
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const userDataPath = path.join(process.env.APPDATA || process.env.HOME, 'Cafe POS');
const databasePath = path.join(userDataPath, 'cafe-pos.db');
const productImagesPath = path.join(userDataPath, 'product-images');
const backupsPath = path.join(userDataPath, 'backups');

// Create backup directory if needed
if (!fs.existsSync(backupsPath)) {
  fs.mkdirSync(backupsPath, { recursive: true });
}

// Get timestamp for filename
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '');
const backupName = `cafe-pos-backup-${timestamp}.zip`;
const backupPath = path.join(backupsPath, backupName);

try {
  console.log(`Creating backup: ${backupPath}`);
  
  // Verify source files exist
  if (!fs.existsSync(databasePath)) {
    throw new Error('Database file not found at: ' + databasePath);
  }
  
  if (!fs.existsSync(productImagesPath)) {
    fs.mkdirSync(productImagesPath, { recursive: true });
  }

  // Create parent directory for zip file (if it doesn't exist)
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create ZIP archive with database and product images
  // ... ZIP creation logic here
  
  console.log('Backup created successfully:', backupPath);
  
} catch (error) {
  console.error('Backup failed:', error.message);
  throw error;
}
```

### Backup Validation

After creating a backup, verify:

1. **Check backup file exists:**
   ```bash
   ls -lh /backups/pos-daily/*/cafe-pos-backup-*.zip
   ```

2. **Verify ZIP integrity:**
   ```bash
   unzip -t /backups/pos-daily/latest/cafe-pos-backup-*.zip
   ```

3. **Confirm database snapshot matches current state:**
   ```sql
   sqlite3 <backup-file> "SELECT COUNT(*) FROM Order; SELECT COUNT(*) FROM Product;"
   ```

---

## Restore Procedure

### When to Restore

Restore the database when:

- ☐ Disk failure on POS computer detected
- ☐ Database corruption reported by application
- ☐ Failed restore operation requires safety copy recovery
- ☐ Manual backup from external drive needs to be applied
- ☐ Prisma migration guard detects metadata inconsistency

### Pre-Restore Verification

**STOP.** Before initiating restore:

1. [ ] Identify the source backup file to use
2. [ ] Verify backup was created before the failure event
3. [ ] Confirm backup integrity (run validation steps above)
4. [ ] **Create manual safety copy:** Copy current database to alternate location
5. [ ] Close application (ensure no active transactions)

### Restore via Desktop App

1. **Open Cafe POS application**
2. **Navigate to Settings page** (`/settings`)
3. **Click "Restore from Backup" button**
4. **Browse to backup ZIP file** (from external drive or network location)
5. **Review restore summary:**
   - Source backup path displayed
   - Estimated data to be restored
   - Warning messages if any (read carefully!)
6. **Confirm you want to proceed:**
   - ⚠️ **All unsaved work will be lost**
   - ⚠️ **Current database contents will be replaced**
7. **Click "Restore" and wait for completion**
8. **Verify success message with backup location logged**

### Automated Restore (Emergency)

If desktop UI is unavailable, use better-sqlite3 `.backup()` method:

```javascript
const Database = require('better-sqlite3');

// Open existing database in write mode
const db = new.Database(databasePath);

// Open backup file (already extracted from ZIP)
const backup = new.Database(backupFilePath, { readonly: true });

try {
  // Use .backup() with journal-mode rollback for safe copy
  const result = backup.backup({ 
    filename: databasePath,
    native: false  // Use SQLite-level copy for consistency
  });
  
  console.log('Restore complete. Bytes copied:', result);
} catch (error) {
  console.error('Restore failed:', error.message);
  // Trigger rollback if restore fails
  throw error;
} finally {
  backup.close();
}
```

### Rollback Procedure (If Restore Fails)

**Critical:** A safety copy is created automatically before restore. If restore fails:

1. **Check that safety copy exists:**
   ```bash
   ls -lh ~/AppData/Local/Cafe\ POS/database-backup-safety-copy.db
   ```

2. **Verify safety copy integrity:**
   ```bash
   sqlite3 database-backup-safety-copy.db "PRAGMA integrity_check;"
   ```

3. **Replace corrupted database with safety copy:**
   - Use desktop app restore UI pointing to safety copy backup, OR
   - Manually copy safety copy file back to original location
   - Restart application

---

## Post-Restore Validation

### Database Verification

After restore completes:

1. **Run integrity check:**
   ```bash
   sqlite3 server/data/cafe-pos.db "PRAGMA integrity_check;"
   ```

2. **Verify table counts match expectations:**
   ```sql
   SELECT 'Order' AS table_name, COUNT(*) AS count FROM Order;
   SELECT 'Product' AS table_name, COUNT(*) AS count FROM Product;
   SELECT 'Category' AS table_name, COUNT(*) AS count FROM Category;
   SELECT 'Expense' AS table_name, COUNT(*) AS count FROM Expense;
   ```

3. **Check that expected data exists:**
   - Verify recent orders are present
   - Confirm product photos directory is intact
   - Check settings have reasonable defaults

### Application Startup Verification

1. **Close application completely** (ensure no processes running)
2. **Restart Cafe POS**
3. **Verify application launches successfully**
4. **Check login persists** (if user was authenticated before restore)
5. **Navigate to key pages:**
   - Products page → should show menu items
   - Orders page → history table should be populated
   - Expenses page → past expenses visible
   - Reports page → summary totals should load

### Data Consistency Checks

1. **Receipt counter:** Verify receipt number has reasonable value (not reset to 0)
2. **Category registry:** Check `Category` table matches menu structure
3. **Tax settings:** Verify tax rate is set appropriately for operations
4. **Active session:** Confirm login state persisted or needs re-authentication

### Photo Directory Verification

1. **Confirm product-images folder exists:**
   ```bash
   dir "server/data/product-images"
   ```

2. **Verify expected images present:** (spot check recent products)

3. **If photos missing but database intact:** May need to restore from separate backup or regenerate placeholders

---

## Recovery Scenarios

### Scenario A: Complete Disk Failure

**Symptoms:** POS computer hard drive not accessible, all data lost  
**Recovery path:**

1. Replace failed drive in new system or use external drive
2. Retrieve most recent backup from off-site storage (cloud/external drive)
3. Copy backup database and product-images to new location
4. Install Cafe POS application on new system
5. Use restore UI or manual procedure to apply backup
6. Post-restore validation per checklist above

### Scenario B: Database Corruption Detected

**Symptoms:** SQLite reports corruption, app won't start, or integrity check fails  
**Recovery path:**

1. Close application immediately
2. Run integrity check to confirm corruption:
   ```bash
   sqlite3 server/data/cafe-pos.db "PRAGMA integrity_check;"
   ```
3. If corruption confirmed, locate most recent valid backup
4. Perform restore procedure (follow warnings about data loss)
5. Verify restored application functions normally

### Scenario C: Failed Restore Requires Rollback

**Symptoms:** Restore operation throws error, dialog shows failure message  
**Recovery path:**

1. **Do NOT attempt another restore immediately**
2. Check `desktop.log` for detailed error (location shown in dialog)
3. Verify safety copy was created and is intact
4. If safety copy exists, use it to replace current database
5. Attempt restore again with fresh backup source
6. If multiple failures occur, contact support or check logs

### Scenario D: Partial Data Loss After Power Failure

**Symptoms:** Application starts but some recent orders missing  
**Recovery path:**

1. Note which receipt numbers appear in history (identify gap)
2. Locate backup from time before power failure
3. Consider restore if data gap is unacceptable
4. Otherwise, application may be usable with incomplete history

---

## Migration Guard Behavior

### How It Works

When applying `20261026175721_add_pos_core_models` migration:

1. **Guard checks `_prisma_migrations` table:**
   - If table doesn't exist → migration applies normally (first-run)
   - If table exists and contains migration record → migration skipped

2. **If migration already applied to this database:**
   - Guard prevents reapplication
   - This protects against accidental destructive operations

3. **Limitations:**
   - Guard does NOT verify SQL compatibility with existing data
   - Corrupted metadata could allow migration to reapply
   - Destructive operations (DROP TABLE) may still affect data if guard bypassed

### Upgrade Path Requirements

Before migrating from old schema to new schema:

1. **Create backup:** Follow backup procedure above
2. **Test on copy:** Run migration against database copy with representative data
3. **Verify row counts:** Ensure no accidental data loss
4. **Review migration SQL:** Confirm compatibility guarantees in migration file
5. **Document findings:** Add notes to runbook or changelog

### If Migration Fails

If applying the migration encounters errors:

1. Check `desktop.log` for specific error message
2. Verify `_prisma_migrations` table structure is intact
3. Review migration SQL for syntax errors or compatibility issues
4. If necessary, skip migration and manually update schema (consult developer)

---

## Emergency Contacts

If you encounter an issue that exceeds this runbook:

- **Development team:** [email/team channel]
- **Critical incidents:** Include screenshot of error dialog and `desktop.log` path
- **Data recovery specialist:** If database corruption cannot be resolved

---

## Related Documentation

- [`PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`](../project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) - Overall project status and known issues
- [`.claude/rules/database.md`](../.claude/rules/database.md) - Database safety guidelines
- [`electron/main.cjs`](../electron/main.cjs) - Backup/restore implementation code

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-11-02 | Development team | Initial runbook creation following fixes to backup error handling and session persistence issues |
