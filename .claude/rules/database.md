---
paths:
  - "server/prisma/**/*"
  - "server/src/**/*.ts"
---

# Database and Prisma Rules

## Database Architecture

Preserve the existing database architecture:

- Prisma 7
- Local SQLite database
- better-sqlite3 adapter
- Split Prisma schema under server/prisma/schema/
- Migrations under server/prisma/migrations/

Do not introduce PostgreSQL, MySQL, Redis, or external database services.

## Schema Changes

Before proposing a schema change:

1. Inspect the complete relevant Prisma models.
2. Check relations, indexes, constraints, and existing data.
3. Inspect related services and API consumers.
4. Review existing migrations.
5. Identify data-loss and compatibility risks.

Prefer the smallest schema change that satisfies the approved requirement.

Do not rename, remove, or restructure existing fields without understanding
their impact on existing data and application behavior.

## Migration Safety

- Never reset the database as a shortcut.
- Never delete, rewrite, or reorder committed migrations.
- Never modify an already-applied migration to change its behavior.
- Generate new migrations for authorized schema changes.
- Inspect generated SQL before applying it.
- Test risky migrations against a separate database copy.
- Back up the database before consequential migration operations.
- Never apply destructive migrations to the user's real database
  without explicit approval.

If Prisma reports pending migrations, missing migration metadata,
or schema drift, investigate first.

Do not automatically resolve migration inconsistencies using
migrate reset, db push, or manual migration-table modifications.

## Data Integrity

- Preserve existing records and relationships.
- Use appropriate foreign keys and constraints.
- Consider SQLite limitations when designing schema changes.
- Use transactions when multiple database operations must succeed together.
- Avoid unnecessary cascading deletes.
- Preserve existing identifiers and historical records.

## POS Money and Order Data

- Store authoritative monetary amounts as integer paisa.
- Never use floating-point values as the source of truth for money.
- Preserve product names and unit prices as snapshots in completed orders.
- Historical orders must not change when product details are edited later.
- Preserve payment and receipt consistency.
- Never silently recalculate historical transactions using current settings.

## Seeds and Test Data

- Inspect existing seed behavior before changing it.
- Never assume seed execution is harmless.
- Do not overwrite existing user data with development seed data.
- Never expose or log production credentials or sensitive values.
- Use isolated test databases for destructive database tests.

## Before Database Operations

Explain the intended operation, affected data, reversibility,
backup strategy, and verification plan.

Wait for explicit approval before destructive or consequential operations.

## Verification

After authorized changes:

- Inspect the Prisma schema diff.
- Inspect generated migration SQL.
- Verify migration behavior against a database copy when appropriate.
- Run relevant database and backend tests.
- Report exactly which database was used and which commands ran.
