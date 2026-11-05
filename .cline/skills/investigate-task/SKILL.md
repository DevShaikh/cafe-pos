---
name: investigate-task
description: Investigate and diagnose issues in the Cafe POS application. Use when debugging errors, understanding unexpected behavior, or researching why something isn't working as expected.
---

# Task Investigation Guide

This skill helps you systematically investigate and diagnose issues in the Cafe POS application.

## Investigation Framework

### Step 1: Gather Information

Collect relevant context:

```bash
# Check error logs
cat server/logs/error.log | tail -50

# Check build output
npm run build --prefix client 2>&1 | grep -i error

# Check git status
git status
git diff HEAD~5 --stat
```

### Step 2: Reproduce the Issue

- Can you reproduce it consistently?
- What triggers the issue?
- Does it happen in development or production?
- Is it related to specific data or user actions?

### Step 3: Check Related Components

Identify what might be affected:

```bash
# Find related files
grep -r "functionName" client/src/ server/src/

# Check imports
grep -l "ComponentName" client/src/ server/src/

# Find type definitions
find client/src/types server/src/schemas -name "*.ts" | xargs grep -l "TypeName"
```

## Common Investigation Scenarios

### Scenario 1: Build Errors

**Symptoms:** TypeScript errors, compilation failures

**Investigation Steps:**

```bash
# Check TypeScript errors
npm run typecheck --prefix client
npm run typecheck --prefix server

# Identify specific errors
npm run build --prefix client 2>&1 | grep -A 5 "error TS"

# Check for missing dependencies
npm ls --depth=0 --prefix client
npm ls --depth=0 --prefix server
```

**Common Causes:**
- Missing type definitions
- Import path issues
- Dependency version conflicts
- Circular dependencies

### Scenario 2: Runtime Errors

**Symptoms:** Application crashes, unhandled exceptions

**Investigation Steps:**

```bash
# Check console logs
npm run dev --prefix server 2>&1 | grep -i error

# Check browser console (DevTools)
# Look for JavaScript errors in client-side code

# Check database connectivity
npx prisma studio --schema=server/prisma/schema
```

**Common Causes:**
- Database connection issues
- Missing data or records
- Invalid API requests
- State management bugs

### Scenario 3: Feature Not Working

**Symptoms:** Expected behavior not occurring

**Investigation Steps:**

```bash
# Check if feature is implemented
grep -r "featureName" client/src/ server/src/

# Verify API endpoint exists
curl http://localhost:3001/api/endpoint

# Check database state
npx prisma studio --schema=server/prisma/schema
```

**Common Causes:**
- Feature not fully implemented
- Configuration issues
- Permission/authentication problems
- Data quality issues

### Scenario 4: Performance Issues

**Symptoms:** Slow loading, timeouts, high memory usage

**Investigation Steps:**

```bash
# Profile database queries
npx prisma studio --schema=server/prisma/schema

# Check for N+1 queries
grep -r "findMany" server/src/ | grep -v "include:"

# Analyze bundle size
npm run build --prefix client 2>&1 | grep -A 10 "Bundle"
```

**Common Causes:**
- Unoptimized database queries
- Large bundle sizes
- Inefficient algorithms
- Missing caching

## Debugging Tools

### Prisma Studio (Database Browser)

```bash
npx prisma studio --schema=server/prisma/schema
```

Use to:
- View current data state
- Check relationships
- Verify migrations applied

### Network Tab (Browser DevTools)

Check API requests:
- Request/response payloads
- Status codes
- Response times
- Headers

### Server Logs

```bash
# Tail server logs
tail -f server/logs/app.log

# Filter by error level
grep "ERROR" server/logs/app.log | tail -20
```

## Verification Steps

After investigating and fixing:

1. **Reproduce original issue** - Confirm it's fixed
2. **Run related tests** - Ensure no regressions
3. **Check build** - Verify compilation succeeds
4. **Test edge cases** - Boundary conditions, error states
5. **Update documentation** - If root cause was unknown

## Related Skills

- `/cafe-pos-familiarization` - For understanding project structure
- `/database-audit` - For database-related issues
- `/release-validation` - For post-fix verification