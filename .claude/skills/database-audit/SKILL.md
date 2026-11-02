---
name: database-audit
description: Perform a read-only audit of Cafe POS Prisma schemas, SQLite database architecture, migrations, data integrity, and financial persistence.
---

# Database Audit

## Objective
Investigate database architecture and identify data integrity risks without modifying data.

## Procedure
1. Read database.md and git-safety.md.
2. Inspect Prisma configuration and split schema files.
3. Map models, relations, indexes, and constraints.
4. Inspect migration history and migration SQL.
5. Review database adapter and database location configuration.
6. Inspect relevant services and transaction boundaries.
7. Review seed scripts and test database configuration.
8. Trace order, payment, receipt, and product snapshot persistence.
9. Check integer-paisa financial calculations.
10. Identify schema drift, migration inconsistencies, and compatibility risks.

## Report
Present:
- Current database architecture.
- Model and relationship overview.
- Migration history observations.
- Data integrity findings.
- Financial persistence findings.
- Risks and severity.
- Recommended next steps.

Separate verified findings from assumptions.

## Safety Restrictions
- Read-only audit.
- Never run migrations.
- Never run seeds.
- Never reset or delete databases.
- Never modify migration history.
- Never change migration metadata.
- Never expose database credentials or sensitive records.

Stop after presenting findings.
