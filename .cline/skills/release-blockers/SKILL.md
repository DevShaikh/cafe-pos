---
name: release-blockers
description: Identify and resolve release blockers for Cafe POS before deployment. Use when preparing for releases, encountering blocking issues, or determining what prevents a successful deployment.
---

# Release Blockers Identification

This skill helps you identify and resolve issues that block Cafe POS releases.

## What Constitutes a Release Blocker?

A **release blocker** is any issue that MUST be resolved before the application can be safely deployed to production:

### Critical Blockers (P0)
- ❌ Data loss risk from migrations
- ❌ Authentication/security vulnerabilities
- ❌ Database corruption or schema errors
- ❌ Build failures preventing packaging
- ❌ Missing critical features for core functionality

### High Priority Blockers (P1)
- ⚠️ Unresolved type errors in new code
- ⚠️ Missing error handling in API endpoints
- ⚠️ Unverified database migrations
- ⚠️ Broken dependencies or missing packages
- ⚠️ Critical test failures

### Medium Priority Blockers (P2)
- 📝 Documentation gaps
- 📝 Unresolved linting warnings
- 📝 Minor UI/UX issues
- 📝 Performance concerns
- 📝 Incomplete feature implementations

## Blocker Detection Workflow

### Step 1: Pre-Release Scan

```bash
# Check for critical errors
echo "=== BUILD ERRORS ===" && npm run build --prefix client 2>&1 | grep -i "error TS\|Failed to compile"
echo "=== SERVER ERRORS ===" && npm run build --prefix server 2>&1 | grep -i "error TS\|Failed to compile"

# Check for type errors
echo "=== TYPE ERRORS ===" && npm run typecheck --prefix client 2>&1 | head -20
npm run typecheck --prefix server 2>&1 | head -20
```

### Step 2: Database Blocker Check

```bash
# Check migration status
npx prisma migrate status --schema=server/prisma/schema

# Verify schema integrity
npx prisma db pull --schema=server/prisma/schema 2>&1 | grep -i "error\|fail"
```

**Blockers:**
- Pending migrations not applied
- Schema drift between code and database
- Missing migration rollback scripts

### Step 3: Security Blocker Check

```bash
# Check for known vulnerabilities
npm audit --prefix client
npm audit --prefix server

# Verify authentication middleware exists
grep -r "authMiddleware\|verifyToken" server/src/middleware/

# Check file upload limits
grep -r "maxSize\|limit" server/src/routes/
```

## Common Release Blockers & Solutions


## Blocker Resolution Checklist

For each identified blocker:

### P0 Critical Blockers
- [ ] Documented impact on users
- [ ] Backup created before fix
- [ ] Fix tested in development
- [ ] Rollback plan documented
- [ ] Stakeholder approval obtained

### P1 High Priority Blockers
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests added/updated
- [ ] No regressions introduced

### P2 Medium Priority Blockers
- [ ] Documented as known issue
- [ ] Workaround provided (if any)
- [ ] Scheduled for next release
- [ ] Impact assessed and accepted

## Blocker Documentation Template

```markdown
# Release Blocker: [Title]

**Severity:** P0/P1/P2  
**Status:** Open/In Progress/Resolved  
**Detected:** [Date]  
**Impact:** [Description of user impact]

## Description
[What is the blocker?]

## Root Cause
[Why does this happen?]

## Impact Assessment
- Affected users: [All/Specific segment]
- Data at risk: [Yes/No]
- Revenue impact: [High/Medium/Low]

## Resolution Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Smoke tests pass
- [ ] No regressions

## Rollback Plan
[How to revert if fix fails]

## Related Issues
- [Link to GitHub issue]
- [Link to PR]
```

## Release Go/No-Go Decision

**GO (Release Ready):**
- ✅ No P0 or P1 blockers remaining
- ✅ All smoke tests pass
- ✅ Build and type checks pass
- ✅ Database migrations verified
- ✅ Backup created

**NO-GO (Delay Release):**
- ❌ Any P0 blocker present
- ❌ Unresolved P1 blockers with known workarounds
- ❌ Critical test failures
- ❌ Security vulnerabilities identified

## Related Skills

- `/cafe-pos-familiarization` - For understanding release process
- `/database-audit` - For migration-related blockers
- `/release-validation` - For post-resolution validation
### Blocker #1: Destructive Migration Without Backup

**Symptom:** Migration drops tables without verifying data preservation

**Detection:**
```bash
cat server/prisma/migrations/YYYYMMDD*/migration.sql | grep -i "DROP TABLE"
```

**Solution:**
1. Create database backup
2. Test migration on copy
3. Verify row counts before/after
4. Add migration guard warning

### Blocker #2: Session Cookie Clearing on Startup

**Symptom:** Users must re-login after every application restart

**Detection:**
```bash
grep -n "sessionCookieCleanup" electron/main.cjs
```

**Solution:**
- Remove or comment out automatic session clearing (line ~630)
- Keep function for explicit logout actions only

### Blocker #3: Missing Type Definitions

**Symptom:** TypeScript errors due to undefined types

**Detection:**
```bash
npm run typecheck --prefix client 2>&1 | grep "Cannot find name\|Cannot find module"
```

**Solution:**
- Define proper types in `client/src/types/`
- Use Zod schemas for API validation
- Never use `any` type

### Blocker #4: Client Accessing Database Directly

**Symptom:** Frontend code imports Prisma client

**Detection:**
```bash
grep -r "import.*prisma" client/src/ 2>&1 | grep -v "node_modules"
```

**Solution:**
- Move logic to API endpoint
- Use HTTP requests from client
- Enforce API boundary in code review

### Blocker #5: Build Failures

**Symptom:** Cannot package application for distribution

**Detection:**
```bash
npm run build --prefix electron 2>&1 | tail -30
```

**Solution:**
- Fix TypeScript errors
- Resolve dependency conflicts
- Verify all assets bundled correctly
- Fix TypeScript errors
- Resolve dependency conflicts
- Verify all assets bundled correctly

## Blocker Prevention

### Automated Checks

Add to CI/CD pipeline:

```yaml
# Pre-release validation
- npm run build --prefix client
- npm run build --prefix server
- npm run typecheck --prefix client
- npm run typecheck --prefix server
- npx prisma migrate status --schema=server/prisma/schema
- npm audit --prefix client
- npm audit --prefix server
```

### Code Review Requirements

- [ ] No P0 blockers introduced
- [ ] Type safety maintained
- [ ] API boundaries respected
- [ ] Error handling added
- [ ] Tests included for new functionality