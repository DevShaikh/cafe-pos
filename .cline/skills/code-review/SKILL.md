---
name: code-review
description: Review code changes for Cafe POS following project conventions, type safety, and security best practices. Use when reviewing pull requests, checking commits, or validating code quality before merging.
---

# Code Review Checklist

This skill helps you review code changes for the Cafe POS application following established patterns and best practices.

## Review Categories

### 1. Type Safety (CRITICAL)

- [ ] No `any` types used
- [ ] All types defined in `client/src/types/` or `server/src/schemas/`
- [ ] Zod schemas validate all API inputs
- [ ] Return types match function signatures
- [ ] Generic types have proper constraints

**Example of GOOD:**
```typescript
// ✅ Properly typed
interface Product {
  id: number;
  name: string;
  price: Decimal;
}

const product: Product = await prisma.product.findUnique({ where });
```

**Example of BAD:**
```typescript
// ❌ Never do this
const result: any = await someFunction();
```

### 2. API Boundaries (CRITICAL)

- [ ] Client code does NOT access Prisma directly
- [ ] All database queries go through Express API
- [ ] No `client/prisma` imports in frontend
- [ ] Zustand stores don't contain Prisma clients

**Violation Example:**
```typescript
// ❌ WRONG - Client accessing DB
import { prisma } from '@/lib/prisma';
const products = await prisma.product.findMany();
```

**Correct Pattern:**
```typescript
// ✅ CORRECT - API endpoint only
export async function GET(req: Request) {
  const products = await prisma.product.findMany();
  return Response.json(products);
}
```

### 3. Code Style & Patterns

#### File Editing
- [ ] Use search/replace, not full file rewrites
- [ ] Preserve existing formatting and conventions
- [ ] No placeholder comments like `// rest of code remains the same`

#### TypeScript
- [ ] Interfaces over types when possible
- [ ] Proper union types for optional values
- [ ] Discriminated unions for variant types

#### React (React 19)
- [ ] No state updates in layout loop useEffect
- [ ] Proper use of React Server Components where applicable
- [ ] Memoization only when needed

### 4. Security Checks

#### Authentication
- [ ] JWT validation on protected routes
- [ ] Cookie-based auth properly secured (HttpOnly, Secure)
- [ ] PIN hashing with bcryptjs

#### Input Validation
- [ ] All API inputs validated with Zod
- [ ] SQL injection prevention (Prisma parameterization)
- [ ] File upload size limits enforced (5MB for product photos)

#### Dependencies
- [ ] No vulnerable packages introduced
- [ ] Lock file updated after dependency changes

### 5. Error Handling

- [ ] Errors caught and logged appropriately
- [ ] User-friendly error messages
- [ ] Stack traces preserved in development
- [ ] Consistent error response format

**Example:**
```typescript
try {
  await prisma.$executeRawUnsafe(sql);
} catch (error) {
  if (error.code === 'P2002') {
    throw new DatabaseError('Foreign key constraint failed', error);
  }
  logger.error('Database error', { error, sql });
  throw new DatabaseError('Database operation failed', error);
}
```

### 6. Testing & Validation

- [ ] Unit tests for new functionality
- [ ] Integration tests for API changes
- [ ] Smoke tests pass after changes
- [ ] Build completes without warnings

## Review Workflow

### Step 1: Context Gathering

```bash
# Check what changed
git diff HEAD~1

# View specific file changes
git diff HEAD~1 -- path/to/file.ts
```

### Step 2: Run Checks

```bash
# TypeScript check
npm run typecheck --prefix client
npm run typecheck --prefix server

# Lint check
npm run lint --prefix client
npm run lint --prefix server

# Build verification
npm run build --prefix client
npm run build --prefix server
```

### Step 3: Manual Review Checklist

- [ ] Follows existing patterns
- [ ] No breaking changes to API
- [ ] Documentation updated if needed
- [ ] Project-audit.md reflects changes
- [ ] Type safety maintained

## Common Issues to Catch

### Issue #1: Multiple Tool Calls
**Problem:** Attempting parallel tool calls in single response
**Fix:** Execute one tool at a time, wait for result

### Issue #2: Type Safety Violations
**Problem:** Using `any` type
**Fix:** Define proper interface or use Zod schema

### Issue #3: Direct DB Access from Client
**Problem:** Frontend importing Prisma client
**Fix:** Move logic to API endpoint

### Issue #4: Broken React Hooks
**Problem:** State updates in layout loop useEffect
**Fix:** Use dependency array properly or refactor state management

## Related Skills

- `/cafe-pos-familiarization` - For understanding project structure
- `/database-audit` - For database-related changes
- `/release-validation` - For pre-release verification