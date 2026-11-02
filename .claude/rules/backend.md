---
paths:
  - "server/src/**/*.ts"
---

# Backend Development Rules

## Technology

Preserve the existing backend stack:

- Node.js
- Express 5
- TypeScript
- Zod
- Prisma 7
- SQLite
- better-sqlite3

Do not introduce another backend framework, ORM, database, or unnecessary dependency.

## Architecture

Follow the established backend structure:

- config/ - configuration
- lib/ - shared infrastructure
- middleware/ - request middleware
- routes/ - URL and HTTP route definitions
- controllers/ - HTTP request and response handling
- services/ - business logic and database operations
- schemas/ - Zod validation schemas
- utils/ - shared utilities

Maintain this flow:

Routes -> Controllers -> Services -> Prisma

Do not create server/src/modules/ or introduce a different architecture.

## API Design

- Follow existing REST API conventions.
- Keep controllers focused on HTTP concerns.
- Keep business logic inside services.
- Validate untrusted request data using Zod.
- Follow existing response and error structures.
- Use appropriate HTTP status codes.
- Avoid duplicating business logic across controllers.
- Do not expose internal errors or sensitive information to clients.

## Database Access

- Access Prisma only from backend code.
- Follow existing Prisma query and transaction patterns.
- Avoid unnecessary database queries.
- Handle database errors explicitly.
- Preserve existing relationships and data integrity.
- Do not modify database schemas or migrations without authorization.

## Authentication and Security

- Follow existing cookie-based JWT authentication.
- Preserve existing PIN hashing and authentication conventions.
- Never store plaintext PINs or passwords.
- Never expose JWT secrets, credentials, or environment variables.
- Follow existing authorization middleware.
- Do not weaken authentication or security controls to make tests pass.
- Validate and sanitize untrusted input appropriately.

## POS Business Logic

- The server is authoritative for new order totals, payments,
  receipt numbers, and completed order snapshots.
- Use integer paisa for monetary calculations.
- Never use floating-point arithmetic as the source of truth for money.
- Preserve product names and unit-price snapshots in completed order lines.
- Follow existing transaction boundaries for operations that must
  succeed or fail together.
- Do not silently change tax, discount, payment, or receipt behavior.

## Error Handling

- Use existing error-handling middleware and response conventions.
- Do not silently swallow exceptions.
- Do not return success-shaped fallback responses after failures.
- Log useful diagnostic information without exposing secrets.
- Handle expected validation and business-rule failures explicitly.

## Before Editing

- Inspect the relevant route, controller, service, schema, and tests.
- Trace the complete request flow before changing behavior.
- Verify actual database models and relations.
- Check existing API consumers before changing response contracts.
- Identify compatibility risks before implementation.

## Verification

- Run relevant backend tests.
- Run TypeScript checks where appropriate.
- Verify affected API behavior.
- Report exact commands and results.
