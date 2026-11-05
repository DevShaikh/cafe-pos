---
name: implementation-plan
description: Create detailed implementation plans for Cafe POS features following established architecture patterns. Use when starting new features, refactoring tasks, or breaking down complex requirements into actionable steps.
---

# Implementation Plan Generator

This skill helps you create structured implementation plans for Cafe POS development tasks.

## Planning Process

### Step 1: Understand Requirements

Before planning, clarify:

- What feature/change is needed?
- Which users are affected?
- What's the expected behavior?
- Are there existing similar features to reference?

### Step 2: Context Research

Read relevant documentation:

```bash
# Project status and roadmap
cat project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md

# Backend implementation map
cat docs/backend-plan.md

# Product specification
cat docs/pos-spec.md

# Architecture decisions
cat docs/decisions.md
```

### Step 3: Impact Analysis

Identify affected components:

- **Database**: Schema changes? New migrations needed?
- **API**: New endpoints? Modified controllers?
- **Client**: New pages? Updated components?
- **State**: New Zustand stores?
- **Tests**: Unit tests? Integration tests? Smoke tests?

## Plan Template

```markdown
# Implementation Plan: [Feature Name]

## Overview
[Brief description of what will be implemented]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Architecture Impact

### Database
- Schema changes: [none/additive/destructive]
- Migration needed: [yes/no]
- Data migration: [required/optional/not needed]

### API Changes
- New endpoints: [/endpoint1, /endpoint2]
- Modified endpoints: [/endpoint3]
- Authentication required: [yes/no]

### Client Changes
- New pages: [/page1, /page2]
- Modified components: [ComponentName]
- New stores: [StoreName]

## Implementation Steps

### Phase 1: Database (if needed)
1. Update Prisma schema
2. Generate migration
3. Test on database copy
4. Verify row counts preserved

### Phase 2: Backend API
1. Create/update route definitions
2. Implement controllers
3. Add service layer logic
4. Validate with Zod schemas
5. Add error handling

### Phase 3: Frontend Client
1. Define TypeScript types
2. Create/update components
3. Implement Zustand store (if needed)
4. Add API service calls
5. Test UI interactions

### Phase 4: Testing
1. Write unit tests
2. Run integration tests
3. Execute smoke tests
4. Verify build passes

## Files to Modify/Create

### New Files
- `path/to/newfile1.ts`
- `path/to/newfile2.ts`

### Modified Files
- `path/to/modified1.ts`
- `path/to/modified2.ts`

## Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Project-audit.md updated

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | HIGH | Backup before migration |
| Breaking API change | MEDIUM | Version endpoint, deprecate old |
| Performance regression | LOW | Profile before/after |

## Related Skills

- `/database-audit` - For database-related implementation
- `/code-review` - For reviewing the implementation
- `/release-validation` - For pre-release testing
```

## Common Implementation Patterns

### New API Endpoint

```typescript
// 1. Route definition (server/src/routes/products.ts)
router.get('/products', productController.getAllProducts);

// 2. Controller (server/src/controllers/products.ts)
export async function getAllProducts(req, res) {
  const { category, search } = req.query;
  
  // Validate with Zod
  const validated = validateProductQuery({ category, search });
  
  // Query database
  const products = await prisma.product.findMany({
    where: { ...validated.where },
    include: { category: true }
  });
  
  return res.json(products);
}

// 3. Service (server/src/services/products.ts)
export async function getProductsWithFilters(filters) {
  // Business logic here
}
```

### New Client Component

```typescript
// 1. Define types (client/src/types/products.ts)
export interface Product {
  id: number;
  name: string;
  price: Decimal;
  category?: Category;
}

// 2. Create component (client/src/components/ProductCard.tsx)
import { Card } from '@/components/ui/card';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>
    </Card>
  );
}

// 3. Use with TanStack Query (client/src/app/products/page.tsx)
'use client';

import { useQuery } from '@tanstack/react-query';

function ProductsPage() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  return (
    <div>
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Safety Rules

- ✅ Always check project-audit.md before starting
- ✅ Verify existing implementation against source code
- ✅ Use smallest appropriate changes
- ✅ Ask before consequential architecture decisions
- ✅ Update documentation after significant work

## Related Documentation

- `client/AGENTS.md` - Next.js-specific guidelines
- `.clinerules/cafe-pos-rules.md` - Project rules
- `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md` - Current status