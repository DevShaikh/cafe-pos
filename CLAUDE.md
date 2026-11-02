# Cafe POS — Claude Code Instructions

## Project Identity

This is a locally deployed Cafe POS for one computer and one cashier.

The application is intended to work locally and offline. Do not introduce SaaS,
cloud infrastructure, multi-branch, multi-tenant, or distributed-system
complexity unless the user explicitly changes the product scope.

## Architecture

Preserve the existing architecture:

- Client: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/Radix UI.
- API: Node.js, Express, TypeScript, Zod.
- Database: Prisma 7 with local SQLite and better-sqlite3.
- Desktop: Electron for the Windows desktop application.
- State: Existing Zustand and TanStack Query patterns.

Important boundaries:

- Browser code communicates with the backend over HTTP through the Next.js proxy.
- Never access Prisma or SQLite directly from client-side code.
- Follow routes → controllers → services → Prisma on the backend.
- Use integer paisa for authoritative money calculations.
- Preserve existing order and product snapshots.
- Preserve Prisma migration history.

Do not change the established architecture without explicit authorization.

## Before Starting Any Task

1. Read `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`.
2. Inspect the relevant current source code.
3. Check existing conventions and related tests.
4. Verify whether documented features and issues still exist.
5. Identify the exact scope before making changes.

Treat documentation as guidance, not proof of implementation. Current
source code is authoritative for actual behavior.

## Working Agreement

- Do only what the user explicitly authorizes.
- Investigate before proposing implementation.
- Explain important findings and risks before changing code.
- Prefer small, focused, reviewable changes.
- Avoid unnecessary dependencies, broad rewrites, and overengineering.
- Do not silently expand the task.
- Ask before consequential product, architecture, or database decisions.
- Never overwrite or discard existing user changes.

## Git and Database Safety

- Never reset, clean, force-push, or rewrite Git history without explicit approval.
- Never discard uncommitted user changes.
- Never delete or rewrite committed Prisma migrations.
- Back up databases and test risky schema changes against copies.
- Do not run destructive database commands without explicit approval.

## Verification and Reporting

After authorized changes:

1. Run the smallest appropriate checks.
2. Report the exact commands executed.
3. Report actual results, including failures.
4. Identify checks that were not run.
5. Never claim something works without verification.

Update the project status document after significant completed work.

## Project-Specific Guidance

Read `.clinerules/cafe-pos-rules.md` for the existing project rules.

Before editing an area of the application, inspect its current implementation
and any applicable local instructions. Do not assume that referenced guidance
files exist; verify their presence first.

Keep investigations and reports focused. Avoid repeatedly loading unrelated
project files or producing unnecessarily large summaries.
