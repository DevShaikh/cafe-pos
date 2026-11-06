# Cafe POS — Backup and Restore Runbook

**Version:** 1.0  
**Last Updated:** 2026-11-05  
**Owner:** AI Agent

---

## Table of Contents

1. [Overview](#overview)
2. [Backup Procedures](#backup-procedures)
3. [Restore Procedures](#restore-procedures)
4. [Retention Policy](#retention-policy)
5. [Validation Checklists](#validation-checklists)
6. [Emergency Recovery](#emergency-recovery)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This runbook provides step-by-step instructions for backing up and restoring the Cafe POS SQLite database. It includes PowerShell scripts, manual procedures, and validation checklists to ensure data integrity.

### Database Location

- **Path:** `data/cafe-pos.db`
- **Format:** SQLite 3
- **Size:** Typically 10-50 MB (varies with product catalog size)

---

## Backup Procedures

### Method 1: PowerShell Script (Recommended for Automation)

#### Prerequisites
- Windows PowerShell 5.0+
- Administrator privileges (if needed for file access)

#### Script: `backup-database.ps1`

```powershell
# Cafe POS Database Backup Script
# Usage: .\backup-database.ps1 -Source "data/cafe-pos.db" -Destination "backups/"

param(
    [string]$Source = "data/cafe-pos.db",
    [string]$Destination = "backups",
    [string]$BackupName = "cafe-pos-backup",
    [switch]$Compress,
    [switch]$Verify
)

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $Destination "$BackupName-$Timestamp.db"
$LogFile = Join-Path $Destination "$BackupName-$Timestamp.log"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cafe POS Database Backup" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Create backup directory if it doesn't exist
if (-not (Test-Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Write-Host "[INFO] Created backup directory: $Destination" -ForegroundColor Green
}

# Check source file exists
if (-not (Test-Path $Source)) {
    Write-Host "[ERROR] Source database not found: $Source" -ForegroundColor Red
    exit 1
}

$SourceSize = (Get-Item $Source).Length / 1MB
Write-Host "[INFO] Source database size: $([math]::Round($SourceSize, 2)) MB" -ForegroundColor Yellow

# Perform backup using SQLite command line
Write-Host "[INFO] Creating backup..." -ForegroundColor Yellow
$BackupCommand = "sqlite3 `"$Source`" ".backup `"$BackupFile`""

try {
    & $BackupCommand
    Write-Host "[SUCCESS] Backup created: $BackupFile" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Verify backup integrity if requested
if ($Verify) {
    Write-Host "[INFO] Verifying backup integrity..." -ForegroundColor Yellow
    $VerifyCommand = "sqlite3 `"$BackupFile`" ".integrity_check"
    try {
        $IntegrityResult = & $VerifyCommand 2>&1
        if ($IntegrityResult -match "^ok$") {
            Write-Host "[SUCCESS] Backup integrity verified" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Integrity check returned: $IntegrityResult" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
    }
}

# Compress backup if requested
if ($Compress) {
    Write-Host "[INFO] Compressing backup..." -ForegroundColor Yellow
    $ZipFile = "$BackupFile.zip"
    Compress-Archive -Path $BackupFile -DestinationPath $ZipFile -Force
    Write-Host "[SUCCESS] Backup compressed: $ZipFile" -ForegroundColor Green
}

# Cleanup old backups (keep last 7 days)
Write-Host "[INFO] Cleaning up old backups..." -ForegroundColor Yellow
$OldBackups = Get-ChildItem -Path $Destination -Filter "*.db" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-7)
} | Sort-Object LastWriteTime -Descending

foreach ($OldBackup in $OldBackups) {
    Remove-Item $OldBackup.FullName
    Write-Host "[INFO] Removed old backup: $($OldBackup.Name)" -ForegroundColor Gray
}

$BackupSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup Complete" -ForegroundColor Cyan
Write-Host "Finished: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Backup file: $BackupFile" -ForegroundColor Cyan
Write-Host "Backup size: $([math]::Round($BackupSize, 2)) MB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

#### How to Run

```powershell
# Navigate to script directory
cd path\to\scripts

# Run backup (default settings)
.\backup-database.ps1

# Run with compression
.\backup-database.ps1 -Compress

# Run with verification
.\backup-database.ps1 -Verify

# Custom destination
.\backup-database.ps1 -Destination "D:\Backups\CafePOS"
```

### Method 2: Manual Copy (Quick Backup)

#### Steps

1. **Close the Cafe POS application** to ensure no active connections
2. **Navigate to the data directory:**
   ```
   C:\path\to\cafe-pos\data\
   ```
3. **Copy the database file:**
   - Source: `cafe-pos.db`
   - Destination: External drive or backup folder
4. **Verify the copy** by checking file size matches

#### PowerShell One-Liner

```powershell
Copy-Item "data/cafe-pos.db" "D:\Backups\CafePOS\" -Force
```

---

## Restore Procedures

### Method 1: PowerShell Script (Recommended)

#### Script: `restore-database.ps1`

```powershell
# Cafe POS Database Restore Script
# Usage: .\restore-database.ps1 -Source "backups/cafe-pos-backup-20261105_120000.db" -Destination "data/"

param(
    [string]$Source,
    [string]$Destination = "data",
    [switch]$Force,
    [switch]$VerifyAfter
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cafe POS Database Restore" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check source file exists
if (-not (Test-Path $Source)) {
    Write-Host "[ERROR] Backup file not found: $Source" -ForegroundColor Red
    exit 1
}

$SourceSize = (Get-Item $Source).Length / 1MB
Write-Host "[INFO] Source backup size: $([math]::Round($SourceSize, 2)) MB" -ForegroundColor Yellow

# Check destination directory
if (-not (Test-Path $Destination)) {
    Write-Host "[ERROR] Destination directory not found: $Destination" -ForegroundColor Red
    exit 1
}

$ExistingDb = Join-Path $Destination "cafe-pos.db"

if (Test-Path $ExistingDb) {
    $ExistingSize = (Get-Item $ExistingDb).Length / 1MB
    Write-Host "[WARNING] Existing database found: $ExistingDb ($([math]::Round($ExistingSize, 2)) MB)" -ForegroundColor Yellow
    
    if (-not $Force) {
        $Response = Read-Host "This will overwrite the existing database. Continue? (y/n)"
        if ($Response -ne "y") {
            Write-Host "[INFO] Restore cancelled by user" -ForegroundColor Yellow
            exit 0
        }
    }
    
    Remove-Item $ExistingDb -Force
    Write-Host "[INFO] Removed existing database" -ForegroundColor Gray
}

# Perform restore
Write-Host "[INFO] Restoring database..." -ForegroundColor Yellow
Copy-Item $Source $ExistingDb -Force

$RestoredSize = (Get-Item $ExistingDb).Length / 1MB
Write-Host "[SUCCESS] Database restored: $([math]::Round($RestoredSize, 2)) MB" -ForegroundColor Green

# Verify integrity if requested
if ($VerifyAfter) {
    Write-Host "[INFO] Verifying restored database..." -ForegroundColor Yellow
    $VerifyCommand = "sqlite3 `"$ExistingDb`" ".integrity_check"
    try {
        $IntegrityResult = & $VerifyCommand 2>&1
        if ($IntegrityResult -match "^ok$") {
            Write-Host "[SUCCESS] Database integrity verified" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Integrity check failed: $IntegrityResult" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restore Complete" -ForegroundCo
Write-Host "[SUCCESS] Database restored: $([math]::Round($RestoredSize, 2)) MB" -ForegroundColor Green

# Verify integrity if requested
if ($VerifyAfter) {
    Write-Host "[INFO] Verifying restored database..." -ForegroundColor Yellow
    $VerifyCommand = "sqlite3 `"$ExistingDb`" \".integrity_check\""
    try {
        $IntegrityResult = & $VerifyCommand 2>&1
        if ($IntegrityResult -match "^ok$") {
            Write-Host "[SUCCESS] Database integrity verified" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Integrity check failed: $IntegrityResult" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[ERROR] Verification failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restore Complete" -ForegroundColor Cyan
Write-Host "Finished: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Database: $ExistingDb" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

#### How to Run

```powershell
# Navigate to script directory
cd path\to\scripts

# Restore with verification (RECOMMENDED)
.\restore-database.ps1 -Source "backups/cafe-pos-backup-20261105_120000.db" -VerifyAfter

# Force restore without confirmation
.\restore-database.ps1 -Source "backups/latest.db" -Force
```

### Method 2: Manual Restore

#### Steps

1. **Close the Cafe POS application** completely
2. **Navigate to the data directory:**
   ```
   C:\path\to\cafe-pos\data\
   ```
3. **Rename the existing database** (backup before overwrite):
   ```
   cafe-pos.db → cafe-pos.db.old
   ```
4. **Copy the backup file** to `data/cafe-pos.db`
5. **Verify file size** matches expected range (10-50 MB)
6. **Start the application** and verify data integrity

---

## Retention Policy

### Backup Schedule

| Environment | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Production | Daily at 2 AM | 7 days | Local + External Drive |
| Development | Weekly on Sunday | 4 weeks | Local only |
| Testing | As needed | 30 days | Cloud storage |

### Storage Locations

1. **Primary:** `backups/` folder in application directory
2. **Secondary:** External USB drive (weekly)
3. **Tertiary:** Cloud storage (monthly, optional)

### Cleanup Rules

- Automatic cleanup of backups older than 7 days (production)
- Manual review before deleting backups older than 30 days
- Keep at least one backup from each month for compliance


---

## Validation Checklists

### Pre-Backup Checklist

- [ ] Cafe POS application is closed
- [ ] No active user sessions detected
- [ ] Sufficient disk space available (minimum 100 MB free)
- [ ] Backup destination is writable
- [ ] Current database file exists and is not corrupted
- [ ] Network connection stable (if cloud backup)

### Post-Backup Checklist

- [ ] Backup file created successfully
- [ ] File size matches expected range (10-50 MB for production)
- [ ] Integrity check passed (if verification enabled)
- [ ] Backup stored in at least two locations (recommended)
- [ ] Log file shows no errors
- [ ] Timestamp on backup file is current
- [ ] Old backups cleaned up according to retention policy

### Pre-Restore Checklist

- [ ] Correct backup file selected (verify timestamp)
- [ ] Cafe POS application is closed
- [ ] Current database backed up (create new backup before restore)
- [ ] Sufficient disk space available
- [ ] Administrator privileges if needed
- [ ] Rollback plan documented

### Post-Restore Checklist

- [ ] Database file restored successfully
- [ ] File size matches source backup
- [ ] Integrity check passed
- [ ] Application starts without errors
- [ ] Login works correctly
- [ ] Product catalog loads completely
- [ ] Recent orders are visible
- [ ] User sessions can be created
- [ ] All features tested (POS, reporting, etc.)

### Emergency Recovery Checklist

- [ ] Backup file located and verified
- [ ] Current database backed up before restore
- [ ] Restore procedure documented
- [ ] Test environment available for practice
- [ ] Contact list ready (IT support, vendor)
- [ ] Estimated recovery time documented

---

## Emergency Recovery

### Scenario 1: Database Corruption

**Symptoms:**
- Application fails to start
- SQLite error messages in console
- File size is 0 bytes or unusually large

**Recovery Steps:**

1. **Stop the application immediately**
2. **Locate the most recent valid backup** (check timestamps)
3. **Create a new backup of current state** (even if corrupted) for forensics
4. **Perform restore using Method 1 or 2**
5. **Verify integrity and functionality**
6. **Document the incident**

### Scenario 2: Accidental Data Deletion

**Symptoms:**
- Orders missing from database
- Products not appearing in catalog
- User data lost

**Recovery Steps:**

1. **Assess the extent of data loss** (check recent orders, products)
2. **Identify appropriate backup** (find backup before deletion occurred)
3. **Create new backup of current state**
4. **Restore from identified backup**
5. **Verify all critical data is restored**
6. **Review deletion cause and prevent recurrence**

### Scenario 3: Complete System Failure

**Symptoms:**
- Operating system crash
- Application files missing
- Database file inaccessible

**Recovery Steps:**

1. **Boot from recovery media or alternate OS**
2. **Access the data directory** (may require mounting drives)
3. **Locate backup files** on external drive or network share
4. **Restore to new system or repaired system**
5. **Verify all functionality**
6. **Update backup procedures to include off-site storage**

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Actual Time |
|----------|------------|-------------|
| Database corruption | 30 minutes | ___ |
| Accidental deletion | 1 hour | ___ |
| Complete system failure | 4 hours | ___ |

---

## Troubleshooting

### Common Issues

#### Issue: Backup fails with "database is locked"

**Solution:**
- Ensure Cafe POS application is completely closed
- Check for background processes using the database:
  ```powershell
  Get-Process | Where-Object {$_.Path -like "*cafe-pos*"}
  ```
- Wait and retry backup

#### Issue: Restore fails with "file is corrupted"

**Solution:**
- Verify backup file integrity before restore:
  ```powershell
  sqlite3 "backup-file.db" ".integrity_check"
  ```
- Try an older backup if available
- Check disk for errors using `chkdsk`

#### Issue: Application won't start after restore

**Solution:**
- Verify database schema matches application version:
  ```powershell
  sqlite3 "data/cafe-pos.db" ".schema"
  ```
- Run Prisma migrations if needed:
  ```bash
  npm run db:migrate --prefix server
  ```
- Check application logs for specific errors

#### Issue: Products not appearing after restore

**Solution:**
- Verify products table has data:
  ```sql
  SELECT COUNT(*) FROM Product;
  ```
- Check product image paths are valid
- Clear browser cache and localStorage
- Re-login to refresh session

### Diagnostic Commands

```powershell
# Check database file size
Get-Item "data/cafe-pos.db" | Select-Object Name, Length, LastWriteTime

# View recent backup files
Get-ChildItem "backups/*.db" | Sort-Object LastWriteTime -Descending | Select-Object -First 10

# Test SQLite integrity
sqlite3 "data/cafe-pos.db" ".integrity_check"

# List all tables and row counts
sqlite3 "data/cafe-pos.db" "SELECT name, COUNT(*) FROM sqlite_master WHERE type='table';"
```

---

## Appendix

### Backup File Naming Convention

```
cafe-pos-backup-YYYYMMDD_HHMMSS.db
Example: cafe-pos-backup-20261105_120000.db
```

### Contact Information

| Role | Name | Contact |
|------|------|--------|
| System Administrator | [Name] | [Email/Phone] |
| Database Support | [Name] | [Email/Phone] |
| Vendor Support | [Company] | [Phone Number] |

### Related Documentation

- [Project Status and Technical Roadmap](./PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md)
- [Implementation Plan](./implementation_plan.md)
- [System Architecture Documentation]

---

**Document Owner:** AI Agent  
**Last Updated:** 2026-11-05  
**Review Required:** Before next backup operation