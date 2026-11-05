---
name: cafe-pos-familiarization
description: Understand the Cafe POS project architecture, tech stack, and codebase structure. Use when exploring the project, understanding existing implementations, or learning about the system before making changes.
---

# Cafe POS Project Familiarization

This skill helps you understand the Cafe POS application's architecture, technology stack, and codebase organization.

## Project Overview

**Cafe POS** is a local point-of-sale application designed for a single computer and one cashier. It is NOT a SaaS, cloud-based, multi-branch, multi-tenant, or distributed system.

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Client** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query |
| **API Server** | Node.js 22.12+, Express, TypeScript, Zod validation, JWT auth (cookies), bcryptjs, Helmet, CORS |
| **Database** | SQLite via Prisma 7 with `better-sqlite3` adapter |
| **Desktop** | Electron window orchestration with Windows NSIS packaging |

### Architecture Boundaries

- **Client-Server Communication**: Browser → HTTP → Next.js proxy → Express API
- **NO Direct DB Access**: Client code MUST NOT access Prisma or SQLite directly
- **Authentication**: Cookie-based JWT stored in browser cookies
- **Data Persistence**: 
  - Cart and receipts: Zustand stores + localStorage
  - Product photos: `server/data/product-images/`
  - Database: Local SQLite file

## Codebase Structure

```
cafe-pos/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components (shadcn/ui)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API service calls (Axios)
│   │   └── types/            # TypeScript type definitions
│   └── AGENTS.md             # Next.js-specific guidance
├── server/                   # Express API backend
│   ├── src/
│   │   ├── routes/          # Route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── prisma/          # Prisma client & schema
│   │   └── middleware/      # Auth, validation, error handling
│   ├── prisma/
│   │   ├── schema/          # Prisma schema files
│   │   └── migrations/      # Database migration history
│   └── data/                # Product images, etc.
├── electron/                 # Desktop packaging
│   ├── main.cjs             # Electron main process
│   └── package.json         # NSIS installer config
├── project-audit/           # Project status and roadmap
└── docs/                    # Documentation
```

## Key Files to Reference

### Before Making Changes

1. **`project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`** - Current implementation status, completed features, pending tasks
2. **`docs/backend-plan.md`** - API flows and known gaps
3. **`docs/pos-spec.md`** - User-facing behavior specifications
4. **`docs/decisions.md`** - Architecture decisions (distinguish from implemented behavior)
5. **`client/AGENTS.md`** - Next.js-specific coding guidelines

### Understanding the System

- **Prisma Schema**: `server/prisma/schema/*.prisma` - Split across multiple files for organization
- **Type Definitions**: `client/src/types/` and `server/src/schemas/` - Enforce type safety (NO `any`)
- **API Routes**: `server/src/routes/` - Entry points for HTTP requests
- **Zustand Stores**: `client/src/stores/` - Global state management

## Common Tasks & Guidance

### Database Operations

```bash
# Generate migration
npm run db:migrate --prefix server

# Reset database (WARNING: destructive)
npm run db:reset --prefix server
```

- Always generate migrations before schema changes
- Test on database copies, never production data directly
- Migration guard checks row counts before/after destructive operations

### API Development

1. Define route in `server/src/routes/`
2. Create controller in `server/src/controllers/`
3. Implement service logic in `server/src/services/`
4. Validate requests with Zod schemas
5. Use Prisma client for database access

### Client Component Development

1. Check existing components in `client/src/components/`
2. Use shadcn/ui components when available
3. Create Zustand store if global state needed
4. Define TypeScript types before implementation
5. Test with TanStack Query for data fetching

## Safety Rules

- ✅ **DO**: Follow existing code patterns and conventions
- ✅ **DO**: Run smallest appropriate checks after changes
- ✅ **DO**: Update project-audit.md after significant work
- ❌ **DON'T**: Introduce cloud/SaaS complexity without authorization
- ❌ **DON'T**: Access database directly from client code
- ❌ **DON'T**: Use `any` type - always define proper types

## Verification Checklist

After completing work:

- [ ] Code follows existing patterns
- [ ] TypeScript types are defined (no `any`)
- [ ] API boundaries respected (client doesn't access DB)
- [ ] Documentation updated if needed
- [ ] Project-audit.md reflects changes
- [ ] Build passes without errors

## Related Skills

- `/database-audit` - For database schema and migration work
- `/release-validation` - For pre-release testing
- `/code-review` - For code review guidelines