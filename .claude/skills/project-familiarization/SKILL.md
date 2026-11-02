---
name: project-familiarization
description: Understand and map the Cafe POS repository, architecture, current implementation, documentation, and technical risks. Use when starting a new project session, onboarding, or when the user asks for a project overview.
---

# Project Familiarization

## Objective

Build an accurate understanding of the current Cafe POS repository before investigating or implementing tasks.

This skill is read-only. Do not modify project files.

## Step 1 - Establish Repository State

Inspect:

- Current working directory.
- Git branch and working tree status.
- Recent commit history.
- Root directory structure.
- Root package.json scripts and dependencies.

Identify existing user changes. Never assume the working tree is clean.

## Step 2 - Read Project Documentation

Inspect relevant existing documentation:

- README.md
- project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md
- docs/pos-spec.md, if present
- docs/decisions.md, if present
- docs/backend-plan.md, if present
- CLAUDE.md
- Applicable .claude/rules/\*.md files

Do not assume a referenced document exists.

Treat project documentation as historical context and intended behavior, not proof of current implementation.

Flag contradictory, outdated, or future-dated information.

## Step 3 - Map the Architecture

Inspect the actual source structure.

### Client

Identify:

- Next.js application structure.
- Important routes and layouts.
- Shared components.
- API client and proxy.
- Zustand stores.
- TanStack Query usage.
- Authentication and session flow.

### Server

Identify:

- Express application entry point.
- Middleware.
- Routes and controllers.
- Services and business logic.
- Zod schemas.
- Prisma access patterns.
- Authentication and authorization.

### Database

Identify:

- Prisma configuration.
- Split schema files.
- Models and relationships.
- Migration history.
- SQLite adapter and database location.
- Seed behavior.

Never run migrations, seeds, or database mutations during familiarization.

### Electron

Identify:

- Main process.
- Preload and IPC, if present.
- Local server startup.
- Frontend startup.
- Bundled Node runtime.
- Application data paths.
- Windows packaging configuration.

## Step 4 - Understand Existing Functionality

Trace the major workflows from frontend to backend and database where practical:

- Authentication and PIN login.
- Cashier sessions.
- Products and categories.
- Cart and checkout.
- Orders and payments.
- Receipts and order history.
- Reports.
- Expenses.
- Settings.
- Backup and restore.
- Electron startup and persistence.

Distinguish implemented, partially implemented, planned, and unverified functionality.

Do not claim functionality works merely because files or UI components exist.

## Step 5 - Identify Important Risks

Look for:

- Frontend/backend contract mismatches.
- Missing validation or authorization.
- Database migration risks.
- Financial calculation inconsistencies.
- Missing tests.
- Data persistence issues.
- Desktop packaging limitations.
- Known release blockers.

Do not attempt to fix anything.

## Step 6 - Produce a Concise Report

Present:

1. Repository and Git state.
2. Technology stack.
3. Architecture overview.
4. Implemented major workflows.
5. Incomplete or partially implemented features.
6. Important technical risks.
7. Missing or outdated documentation.
8. Suggested next investigation areas.

For each significant finding, identify the supporting files or code locations.

Separate verified facts, assumptions, and unverified behavior.

## Restrictions

- Do not edit, create, delete, or rename files.
- Do not install dependencies.
- Do not run migrations or seeds.
- Do not reset databases.
- Do not commit, push, or modify Git history.
- Do not start implementing roadmap items.
- Do not produce an unnecessarily large repository dump.

Stop after presenting the report and wait for the user's next instruction.
