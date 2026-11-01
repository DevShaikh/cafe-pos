# Cafe POS repository instructions

## Before starting

- Read [`project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`](../project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) for current status and priorities.
- Inspect relevant current source before assuming a feature is implemented. Status/spec documents can become stale; the code is authoritative for behavior.
- Respect the user's scope. Do not start roadmap work without authorization or make consequential product/architecture decisions without asking.

## Product scope and architecture

- This is a local Cafe POS for **one computer and one cashier**, not SaaS, cloud, multi-branch, multi-tenant, or distributed software.
- Keep the existing stack: Next.js 16 App Router/React 19/strict TypeScript client; Express 5/TypeScript API; Prisma 7 with local SQLite and `better-sqlite3`; Electron is a localhost shell, not a packaged/offline runtime.
- The browser calls the API over HTTP (through the Next.js proxy). Never connect client code directly to SQLite or Prisma.
- Keep existing boundaries: client `app/`, `components/`, `lib/`, `store/`, `types/`; server `config/`, `lib/`, `middleware/`, `routes/`, `controllers/`, `services/`, `schemas/`, `utils/`; seeds in `server/seeds/`; split Prisma schema in `server/prisma/schema/`. Do not create `server/src/modules/`.
- Use integer paisa for authoritative money calculations and preserve product name/unit-price snapshots in completed order lines.
- Preserve Prisma migration history. Do not reset or delete migrations; back up and test against a copy before risky database changes.

## Implementation conventions

- Follow naming, formatting, strict typing, Zod validation, shared API response/error shapes, and UI conventions already used in the relevant files.
- Keep routes for URL mapping, controllers for HTTP adaptation, services for business logic/data operations, and Prisma queries on the server.
- Use `cn()` from `@/lib/utils`, semantic CSS tokens, and existing shadcn/Radix patterns in client UI.
- Avoid unnecessary packages, abstractions, broad rewrites, and overengineering. Preserve working functionality and make small, reviewable changes.
- Keep errors visible and actionable; do not silently swallow failures or return success-shaped fallbacks.

## Client-specific guidance

Before editing Next.js code, read `client/AGENTS.md` and the relevant guide under `client/node_modules/next/dist/docs/`. This repository enables `cacheComponents` and `partialPrefetching`; follow the installed Next version's guidance.

## Documentation and verification

- The project status/roadmap document is the primary progress tracker. `docs/pos-spec.md` describes desired user behavior; `docs/decisions.md` records durable decisions; `docs/backend-plan.md` maps backend structure and flows. Distinguish plans from implemented features.
- After significant work, update the project status document with verified completed work, pending tasks, bugs, and decisions. Update other directly affected docs when authorized.
- Run the smallest appropriate checks after authorized code changes unless the user or applicable repository instruction prohibits them. Report exact commands and results; state clearly when checks were not run.
- Never claim a feature, fix, test, build, or decision is complete without verification.

## Current verified caveats

- New order creation, manual payment, sessions, paginated order history, and summary sales reporting are server-backed. Legacy receipts may remain local.
- Product search/category UI controls are not wired to the server's optional filters; the product API has no create/update/delete routes.
- The checkout UI assumes 8% tax while the server reads the configured `Settings.taxRateBps`.
- Settings, order edit/void/refund, cash reconciliation, role-specific route policy, and report printing are incomplete.
- Electron clears browser storage on startup, including legacy local receipts and the auth cookie. It does not provide packaged service startup.
- The seed can create/log the known admin PIN `1234`; no login rate limiter is configured.

For detailed current risks and priorities, use the project status document rather than duplicating its roadmap here.
