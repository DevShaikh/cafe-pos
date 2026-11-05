---
name: release-validation
description: Validate Cafe POS builds, tests, and releases before deployment. Use when preparing releases, running smoke tests, or verifying build integrity before packaging.
---

# Release Validation Checklist

This skill helps you validate Cafe POS builds and releases before deployment to production.

## Pre-Release Checklist

### 1. Build Verification

```bash
# Client build
npm run build --prefix client
echo "Client build: $?"

# Server build  
npm run build --prefix server
echo "Server build: $?"

# Full project build (if applicable)
npm run build
```

**Expected Output:**
- No TypeScript errors
- No linting warnings
- Bundle sizes within acceptable limits

### 2. Type Safety Check

```bash
# Client types
npm run typecheck --prefix client

# Server types
npm run typecheck --prefix server
```

**Must Pass:**
- Zero type errors
- All imports resolve correctly
- No `any` types in new code

### 3. Lint Check

```bash
# Client lint
npm run lint --prefix client

# Server lint
npm run lint --prefix server
```

**Acceptable:**
- No critical errors
- Warnings should be documented and addressed

## Database Validation

### Migration Status

```bash
# Check migration status
npx prisma migrate status --schema=server/prisma/schema

# List all migrations
ls -la server/prisma/migrations/
```

**Verify:**
- All expected migrations applied
- No pending migrations for production
- Migration history is sequential

### Data Integrity

```bash
# Check row counts before release
npx prisma studio --schema=server/prisma/schema

# Verify critical tables have data
SELECT COUNT(*) FROM Product;
SELECT COUNT(*) FROM Category;
SELECT COUNT(*) FROM Receipt;
```

## Smoke Tests

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Session persists after page refresh
- [ ] Logout clears session properly

#### Product Management
- [ ] View products list loads
- [ ] Search products works
- [ ] Filter by category works
- [ ] Add new product succeeds
- [ ] Update existing product works
- [ ] Delete product (if allowed) works

#### Cart & Checkout
- [ ] Add items to cart
- [ ] Update quantities
- [ ] Remove items from cart
- [ ] Complete checkout flow
- [ ] Receipt generates correctly

#### Data Persistence
- [ ] Refresh page, data remains
- [ ] Restart application, session persists
- [ ] Database backup created

### Automated Smoke Tests

```bash
# Run unit tests
npm run test --prefix client
npm run test --prefix server

# Run integration tests (if available)
npm run test:integration --prefix server

# Check coverage
npm run test:coverage --prefix client
```

## Release Preparation

### 1. Update Documentation

```bash
# Update project audit
cat project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md

# Verify docs are current
ls docs/
```

**Must Include:**
- Completed features documented
- Known issues listed
- Migration notes (if applicable)

### 2. Backup Database

```bash
# Create timestamped backup
cp server/data/cafe-pos.db "server/data/cafe-pos-backup-$(date +%Y%m%d-%H%M%S).db"

# Verify backup
ls -lh server/data/cafe-pos-backup-*.db
```

### 3. Package Verification (Electron)

```bash
# Check electron build configuration
cat electron/package.json

# Verify NSIS installer path exists
ls electron/out/Release/

# Test packaged application (if available)
./electron/out/Release/cafe-pos.exe --version
```

## Post-Release Validation

### 1. Installation Verification

```bash
# Uninstall previous version
npm uninstall -g cafe-pos  # or appropriate command

# Install new version
npm install -g cafe-pos

# Verify installation
cafe-pos --version
```

### 2. Fresh Installation Test

- [ ] Application launches successfully
- [ ] Database created correctly
- [ ] Login works with default credentials
- [ ] All features accessible

### 3. Data Migration (if applicable)

```bash
# Backup old database
cp server/data/cafe-pos-old.db server/data/cafe-pos-migration-backup.db

# Run migration
npm run db:migrate --prefix server

# Verify data preserved
npx prisma studio --schema=server/prisma/schema
```

## Rollback Procedure (If Needed)

### Emergency Rollback Steps

1. **Stop current version**
   ```bash
   # Kill running processes
   taskkill /F /IM cafe-pos.exe
   ```

2. **Restore database backup**
   ```bash
   # Restore from latest good backup
   del server/data/cafe-pos.db
   copy server/data/cafe-pos-backup-YYYYMMDD-HHMMSS.db server/data/cafe-pos.db
   ```

3. **Uninstall new version**
   ```bash
   npm uninstall -g cafe-pos
   ```

4. **Reinstall previous version**
   ```bash
   # From version control or backup
   git checkout <previous-tag>
   npm install
   ```

## Validation Commands Summary

```bash
# Quick validation (run all)
echo "=== BUILD CHECK ===" && npm run build --prefix client && npm run build --prefix server
echo "=== TYPE CHECK ===" && npm run typecheck --prefix client && npm run typecheck --prefix server
echo "=== LINT CHECK ===" && npm run lint --prefix client && npm run lint --prefix server
echo "=== TEST CHECK ===" && npm run test --prefix client && npm run test --prefix server
echo "=== MIGRATION STATUS ===" && npx prisma migrate status --schema=server/prisma/schema

# Full validation (recommended before release)
npm run validate:release --prefix server  # If custom script exists
```

## Related Skills

- `/cafe-pos-familiarization` - For understanding release process
- `/database-audit` - For migration-related validation
- `/code-review` - For reviewing changes before release