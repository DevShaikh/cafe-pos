# Windows Installation Testing Guide

**Last Updated:** 2026-11-02  
**Target Platform:** Windows 10/11 x64  

---

## Prerequisites

Before testing, ensure:

- [ ] A clean Windows 10/11 x64 installation
- [ ] At least 2GB free disk space (for Node.js + dependencies)
- [ ] Admin privileges for installer execution
- [ ] Internet connection for initial setup (then offline capability)

---

## Step 1: Build the Packaged Installer

Open Terminal/PowerShell in project root:

```powershell
# Navigate to project directory
cd "D:\1. Development\5. Personal\cafe-pos"

# Build Windows installer
npm run package:win
```

**Expected Output:**
- Build completes without errors
- Executable created at: `artifacts/Cafe-POS-Setup-*.exe`
- Size: ~50-100MB (varies with bundled Node.js)

---

## Step 2: Clean Installation Test

### 2.1 Create Test User Account

```powershell
# Open Settings → Accounts → Family & other users
# Click "Add account" → Local account → Next
# Name it "Cafe POS Test" → No password for simplicity
# Click "Next" to complete
```

### 2.2 Install on Clean Machine (or Test User)

**Option A: On Fresh Windows Installation**

1. Double-click `artifacts/Cafe-POS-Setup-*.exe`
2. Click "Yes" if SmartScreen asks about the app publisher
3. Follow installer wizard:
   - Accept license agreement
   - Choose install location (default: `%APPDATA%\Cafe POS`)
   - Click "Install"

**Option B: On Existing Machine (Test User)**

1. Switch to test user account
2. Download/installer from shared network location or USB drive
3. Run installer as administrator (right-click → "Run as administrator")

### 2.3 Verify Installation

After installation completes, check:

```powershell
# Application data directory
%APPDATA%\Cafe POS

# Should contain:
# - database.db
# - backups/
# - product-images/
# - logs/desktop.log
# - node_modules/ (bundled Node.js)
```

### 2.4 First-Run Setup

1. Launch Cafe POS from Start Menu or desktop shortcut
2. **First-run screen** should appear:
   - "Create Administrator Account"
   - Enter 4-digit PIN (e.g., `1234`)
   - Confirm password strength
3. Click "Complete Setup"

**Expected Behavior:**
- No errors during setup
- Console shows migration running (check logs)
- Migration guard warnings appear if upgrading existing database

---

## Step 3: Test Backup & Restore Workflow

### 3.1 Create Backup

In the app UI:
1. Go to **Settings → Backup**
2. Click "Create Backup"
3. Choose backup destination (e.g., external drive or network location)
4. Verify backup creates `.tar.gz` file + `backup.json` manifest

### 3.2 Exercise Restore

**Recommended:** Test restore on database copy to verify:

1. Create safety backup via UI
2. Corrupt the main database (optional, for disaster recovery test)
3. Click "Restore Backup" 
4. Verify data restored correctly
5. Check that migration guard warnings appear in `desktop.log`

**Expected Console Output:**
```
Migration guard: _prisma_migrations table found with 1 applied migrations
Migration guard: Migration already applied to this database. Skipping.
```

---

## Step 4: Test Session Persistence After Restart

### 4.1 Login

1. Click "Sign In" or use first-run admin account
2. Enter correct PIN
3. Verify dashboard loads

### 4.2 Logout

1. Go to **Settings → Logout** (or top bar logout button)
2. Confirm logout

### 4.3 Restart Application

1. Close app completely (Task Manager → End Cafe POS process)
2. Relaunch from Start Menu or shortcut

### 4.4 Verify State

**Expected Behavior:**
- Login screen appears (session cleared correctly)
- Entering correct PIN works normally
- No automatic logout on startup
- localStorage receipts persist (check if needed)

**Check `desktop.log`:**
```bash
type "%APPDATA%\Cafe POS\logs\desktop.log" | Select-String "session"
```

Should **NOT** show automatic cookie cleanup messages.

---

## Step 5: Test Migration Guard Warnings

### 5.1 Create Test Database with Data

(If you have an existing database, skip to Step 5.2)

To create a test database with sample data for migration guard testing:

```powershell
# This will be done via the Electron app UI or manually
# The migration guard should warn when applied to non-empty database
```

### 5.2 Apply Migration (Upgrade Scenario)

**Expected Console Output in `desktop.log`:**
```
Migration guard: _prisma_migrations table found with X applied migrations
Migration guard: Database contains N existing orders.
                  This migration will be applied carefully.
```

**OR if first-run:**
```
Migration guard: Order table does not exist (first-run database, safe to apply migration)
```

---

## Step 6: Test Receipt Printing

### 6.1 Create Test Order

1. Create new order with 2-3 products
2. Complete checkout
3. Verify receipt prints immediately

### 6.2 Configure Paper Width

In Settings:
1. Select **58mm** or **80mm** paper width
2. Create another order to verify template uses correct size

---

## Step 7: Verify Error Handling

### 7.1 Backup of Corrupted File

1. Create valid backup via UI
2. Replace `cafe-pos.db` with corrupted file (random bytes)
3. Attempt restore
4. Should show error message about database corruption

**Expected Console Output:**
```
Cannot proceed with restore: Source database is missing or corrupted.
Please try from a different backup.
```

### 7.2 Missing Backup File

1. Point restore UI to non-existent backup path
2. Verify clear error message appears

---

## Step 8: Test Offline Behavior

1. Disconnect from internet
2. Launch app
3. Verify all features work (except catalog search if using remote CDN)
4. Create orders, payments, backups - all should work offline

---

## Step 9: Clean Uninstallation

### 9.1 Standard Uninstall

1. Windows Settings → Apps → Uninstall "Cafe POS"
2. Verify data directory removed (optional - check if backup exists)

### 9.2 Manual Cleanup

```powershell
# Remove application data directory
Remove-Item -Path "%APPDATA%\Cafe POS" -Recurse -Force

# Remove desktop shortcut (if created)
Remove-Item -Path "$PROFILE\Desktop\Cafe POS.lnk" -ErrorAction SilentlyContinue

# Remove Start Menu program
Start-Process "shell:programs" | Out-Null
# Find Cafe POS in Programs folder, delete from there
```

---

## Step 10: Issue Status Verification Checklist

### Pre-Installation (All Issues Fixed)

| Issue | Expected Behavior | Check In `desktop.log` |
|-------|-------------------|------------------------|
| **#1 Restore Error Handling** | Clear error messages on corruption | ✅ Verified via testing |
| **#2 Migration Guard Enhancement** | Warning logs before destructive migration | See Section 5.2 above |
| **#3 Session Persistence** | Login survives restart | Check after Step 4 restart |
| **#4 Backup Runbook Available** | UI backup workflow documented | Accessible in app Settings |

---

## Step 11: Known Issues & Workarounds

### Issue #4A: User-Reported Restore Error (Status: Investigating)

Until root cause is confirmed, recommend:

1. **Manual backup before restore:** Copy `cafe-pos.db` to external drive
2. **Verify backup integrity** before attempting UI restore
3. **Check `desktop.log`** for detailed error messages during restore attempt

---

## Step 12: Final Release Checklist

Before considering release-ready:

- [ ] Test installation on Windows 10 (not just 11)
- [ ] Verify uninstall removes all files correctly
- [ ] Test restore with real backup files
- [ ] Confirm migration guard warnings in production log output
- [ ] Run through full cashier workflow: login → order → payment → report → logout

---

## Support Resources

### Log Files Location

```powershell
%APPDATA%\Cafe POS\logs\desktop.log
```

### Backup File Location

```powershell
%APPDATA%\Cafe POS\backups\
```

### Database File Location

```powershell
%APPDATA%\Cafe POS\database.db
```

---

## Conclusion

After completing all tests:

1. Update PROJECT-STATUS document with test results
2. Document any remaining issues or workarounds
3. Consider signing installer if releasing publicly

**Next Action:** Run through the installation and testing steps, then report findings.
