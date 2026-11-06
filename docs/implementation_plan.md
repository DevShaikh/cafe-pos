# Cafe POS — Implementation Plan

**Status:** Ready for implementation  
**Date:** 2026-11-05  
---
**Priority:** HIGH (Blockers before production release)

This plan addresses **five critical blockers** identified during the silent investigation phase that must be resolved before any new feature development or production deployment:

1. **Error Handling Restoration** — Restore consistent error classification and client feedback
2. **Migration Guard Enhancement** — Add row-count validation to prevent data loss
3. **Session Persistence Fix** — Remove automatic session cookie clearing on startup
4. **Backup/Restore Runbook** — Document complete backup and recovery procedures
5. **Request Correlation IDs** — Add shared request IDs for better debugging

---

## Executive Summary

### Current State
- Error handling was partially implemented but needs restoration to ensure consistent error classification, proper HTTP status codes, and meaningful client-side feedback.
- Some routes throw `AppError`, others use plain errors.
- Global error handler exists in `server/src/middleware/error-handler.ts`.
- `ERROR_CODES` enum defined in `server/src/constants/error-codes.ts`.
- `AppError` class exists in `server/src/utils/app-error.ts`.

### Proposed Fixes
1. Restore comprehensive error handling across all API routes with:
   - Consistent `AppError` usage for all business logic failures
   - Proper HTTP status code mapping
   - Request correlation IDs for traceability
   - Client-side error type classification
2. Add row count validation to migration guards
3. Remove automatic session cookie clearing from Electron startup sequence
4. Create comprehensive backup and restore documentation
5. Implement request ID generation and logging throughout the stack

---

## Issue #1: Error Handling Restoration (HIGH - Before Production)

### Problem Statement
Error handling was partially implemented but needs restoration to ensure consistent error classification, proper HTTP status codes, and meaningful client-side feedback.

### Proposed Fix
Restore comprehensive error handling across all API routes with:
1. Consistent `AppError` usage for all business logic failures
2. Proper HTTP status code mapping
3. Request correlation IDs for traceability
4. Client-side error type classification

### Files to Modify

#### 1. `server/src/utils/app-error.ts`
```typescript
import type { ErrorCode } from "../constants/error-codes";

class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  public requestId?: string;
  issues?: Array<{ path: string; message: string }>;
  
  constructor(
    message: string,
    options?: {
      code?: ErrorCode;
      statusCode?: number;
      issues?: Array<{ path: string; message: string }>;
    } & ErrorOptions
  ) {
    super(message, options);
    this.name = "AppError";
    
    const { code, statusCode, issues, ...rest } = options || {};
    Object.assign(this, rest);
    
    this.code = code || (rest.statusCode ? (ERROR_CODES as any)[Object.keys(ERROR_CODES).find(key => (ERROR_CODES as any)[key] === rest.statusCode)] : ERROR_CODES.INTERNAL_SERVER_ERROR);
    this.statusCode = statusCode || 500;
    if (issues) this.issues = issues;
  }
}

export default AppError;
```

#### 2. `server/src/middleware/error-handler.ts`
```typescript
import { ERROR_CODES } from "../constants/error-codes";
import AppError from "../utils/app-error";
import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  
  if (err instanceof AppError) {
    console.error(`[${requestId}] AppError:`, err);
    res.status(err.statusCode).json({ success: false, error: err.code, message: err.message, requestId });
    return;
  }
  
  if (err.name === "ZodError") {
    const issues = err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    console.error(`[${requestId}] Validation Error:`, err);
    res.status(400).json({ success: false, error: ERROR_CODES.VALIDATION_ERROR, issues, requestId });
    return;
  }
  
  if (err.code === "SQLITE_CONSTRAINT" || err.code === "P2002") {
    console.error(`[${requestId}] Database Constraint Violation:`, err.message);
    res.status(409).json({ success: false, error: ERROR_CODES.DATABASE_ERROR, message: "Database constraint violation", requestId });
    return;
  }
  
  console.error(`[${requestId}] Unhandled Error:`, err);
  res.status(500).json({ success: false, error: ERROR_CODES.INTERNAL_SERVER_ERROR, message: "An unexpected error occurred", requestId });
}
```

#### 3. `server/src/middleware/request-logger.ts` (New File)
```typescript
import type { Request, Response, NextFunction } from "express";

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  console.log(`[${requestId}] ${req.method} ${req.originalUrl}`);
  
  res.on("finish", () => {
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${res.get("Content-Length") || 0} bytes`);
  });
  
  next();
}
```

#### 4. `server/src/app.ts`
```typescript
// Add request logger middleware before routes
app.use(requestLogger);

// Update error handler registration
app.use(errorHandler);
```

#### 5. Client API Service - Add Request ID Header
```typescript
// In client/src/lib/services/api-client.ts or similar
const headers: HeadersInit = {
  "Content-Type": "application/json",
  "X-Request-ID": crypto.randomUUID()
};
```

---

## Issue #2: Migration Guard Enhancement (HIGH - Before Operation)

### Problem Statement
No row count validation in migration guards, risking data loss during schema updates.

### Proposed Fix
Add row count warnings and optional blocking to migration execution.

### Files to Modify

#### 1. `server/src/lib/prismaClient.ts`
```typescript
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Add migration guard function
export async function runMigrationGuard() {
  const warnings: string[] = [];
  
  try {
    // Check products table row count
    const productCount = await prisma.product.count();
    if (productCount > 0) {
      warnings.push(`⚠️ Products table has ${productCount} rows. Backup recommended before migration.`);
    }
    
    // Add more checks as needed for other tables
    const orderCount = await prisma.order.count();
    if (orderCount > 0) {
      warnings.push(`⚠️ Orders table has ${orderCount} rows. Backup recommended before migration.`);
    }
    
    if (warnings.length > 0) {
      console.warn("\n=== MIGRATION GUARD WARNINGS ===");
      warnings.forEach(w => console.warn(w));
      console.warn("==================================\n");
      // Optionally block migration: throw new Error("Migration blocked. Please backup first.");
    }
  } catch (error) {
    console.error("Migration guard check failed:", error);
  }
}
```

---

## Issue #3: Session Persistence Fix (HIGH - Before Operation)

### Problem Statement
Electron clears the session cookie on every startup, forcing users to re-login each time.

### Current State
- `electron/main.cjs` line 630 calls `await sessionCookieCleanup();`
- This function clears all cookies including login session
- localStorage receipts are preserved but not usable without authentication

### Proposed Fix
Remove automatic session cookie clearing from startup sequence.

### Files to Modify

#### 1. `electron/main.cjs`
**Changes:** Comment out or remove the session cleanup call on startup
```javascript
// Around line 630 - REMOVE OR COMMENT OUT THIS CALL
// await sessionCookieCleanup();

#### 2. `server/src/middleware/error-handler.ts`
**Changes:** Include request ID in error logs (shown in Issue #1)

#### 3. `client/src/lib/services/api-client.ts`
**Changes:** Add request ID header to all requests (shown in Issue #1)

---

## Issue #4: Backup/Restore Runbook Documentation (HIGH - Before Production)

### Problem Statement
No documented retention policy, recovery steps, or verification checklist for backup operations.

### Proposed Fix
Create comprehensive backup and restore documentation.

### Files to Create

#### 1. `docs/backup-restore-runbook.md`
See separate document created with full content including:
- Backup procedures (PowerShell scripts)
- Restore procedures
- Retention policy
- Validation checklists
- Emergency recovery steps

---

## Issue #5: Request Correlation IDs (MEDIUM - Before Production)

### Problem Statement
No request correlation IDs for debugging and traceability across distributed operations.

### Proposed Fix
Add shared request ID generation and logging throughout the stack.

### Files to Modify

#### 1. `server/src/middleware/request-logger.ts`
**Changes:** Add request ID to log entries (shown in Issue #1)

#### 2. `server/src/middleware/error-handler.ts`
**Changes:** Include request ID in error logs (shown in Issue #1)

#### 3. `client/src/lib/services/api-client.ts`
**Changes:** Add request ID header to all requests (shown in Issue #1)

---

## Testing Strategy

### Test Plan for Error Handling Restoration
- [ ] Verify `AppError` throws with correct status codes
- [ ] Verify error handler returns correct JSON structure
- [ ] Verify request ID is generated and included in responses
- [ ] Test all endpoints return proper error codes
- [ ] Test validation errors include detailed issues array
- [ ] Test database constraint violations return 409
- [ ] Login flow displays correct error messages
- [ ] Order creation shows user-friendly errors

### Test Plan for Migration Guard
- [ ] Run migration on empty database (should succeed)
- [ ] Insert test data into products table
- [ ] Run migration guard (should warn but not block)
- [ ] Verify warning message includes correct row count
- [ ] Verify database can be restored from backup

### Test Plan for Session Persistence
- [ ] Login and verify cookie is set
- [ ] Restart Electron app
- [ ] Verify session persists without re-login
- [ ] Logout and verify cookie is cleared
- [ ] Restart after logout (should require login)

### Test Plan for Backup/Restore
- [ ] Create backup on empty database
- [ ] Create backup with sample data
- [ ] Restore to isolated test environment
- [ ] Verify all data restored correctly
- [ ] Test product images load after restore
- [ ] Corrupt database file and perform emergency restore

### Test Plan for Request Correlation IDs
- [ ] Verify request ID appears in server logs
- [ ] Verify same ID throughout request lifecycle
- [ ] Verify request ID sent in all API calls
- [ ] Verify unique IDs generated for each request

---

## Implementation Order

**Recommended Order:**
1. **Session Persistence Fix** — Quick win, immediate user impact
2. **Error Handling Restoration** — Foundation for other improvements
3. **Request Correlation IDs** — Enhances error handling with traceability
4. **Migration Guard Enhancement** — Data safety before schema changes
5. **Backup/Restore Runbook** — Documentation of all lessons learned

---

## Success Criteria

### Issue #1: Error Handling Restoration
- [ ] All API routes throw `AppError` for business logic failures
- [ ] Error responses include consistent structure `{success, error, message, requestId}`
- [ ] Client displays user-friendly messages based on error code
- [ ] Request ID logged for all requests and errors

### Issue #2: Migration Guard Enhancement
- [ ] Row count warnings displayed before destructive migrations
- [ ] Migration blocked or warned when data exists
- [ ] Backup recommended in migration documentation

### Issue #3: Session Persistence Fix
- [ ] Login persists across application restarts
- [ ] Logout still works correctly
- [ ] No re-login required after normal app launch

### Issue #4: Backup/Restore Runbook
- [ ] Complete backup procedure documented
- [ ] Restore steps verified on test data
- [ ] Retention policy defined and implemented
- [ ] Post-restore validation checklist available

### Issue #5: Request Correlation IDs
- [ ] Unique request ID generated for each request
- [ ] ID included in all responses and logs
- [ ] ID traceable from client to server to database

---

## Rollback Plan

If any issue causes problems:
1. Error Handling - Revert changes to app-error.ts, error-handler.ts, and route files
2. Migration Guard - No rollback needed (only adds warnings)
3. Session Persistence - Uncomment session cleanup call in main.cjs
4. Backup Runbook - Documentation only, no code changes
5. Request IDs - Remove request ID generation from middleware

---

## Estimated Effort

| Issue | Development | Testing | Documentation | Total |
|-------|-------------|---------|---------------|-------|
| #1 Error Handling | 4 hours | 2 hours | 1 hour | 7 hours |
| #2 Migration Guard | 1 hour | 1 hour | 0.5 hours | 2.5 hours |
| #3 Session Fix | 0.5 hours | 1 hour | 0.5 hours | 2 hours |
| #4 Backup Runbook | 0.5 hours | 2 hours | 2 hours | 4.5 hours |
| #5 Request IDs | 1 hour | 1 hour | 0.5 hours | 2.5 hours |
| **Total** | **6.5 hours** | **7 hours** | **4.5 hours** | **18 hours** |

---

## Next Steps After Implementation

1. Execute all tests in testing strategy
2. Verify on isolated test environment
3. Update PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md with completion status
4. User acceptance testing with real data
5. Proceed to next feature development or release preparation

---

**Document Owner:** AI Agent  
**Last Updated:** 2026-11-05  
**Review Required:** Before implementation begins
