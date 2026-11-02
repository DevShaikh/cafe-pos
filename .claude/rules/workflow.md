# Development Workflow

## Core Principle

Work incrementally. The user makes product and implementation decisions. Do not rush from investigation into implementation.

## Phase 1 — Understand

Before working:

- Understand the specific request and its intended outcome.
- Read the project status document.
- Inspect relevant source code, configuration, and tests.
- Check the current Git state before proposing changes.
- Identify existing behavior and constraints.

Do not modify files during investigation.

## Phase 2 — Investigate and Report

Present a concise report covering:

1. What currently exists.
2. How the relevant code works.
3. What is incomplete, incorrect, or risky.
4. Relevant files and components.
5. Possible solutions and their trade-offs.
6. Your recommended approach.

Separate verified findings from assumptions.

Stop and wait for the user's decision.

Do not independently select additional roadmap tasks.

## Phase 3 — Plan

After the user selects an approach:

- Define the exact implementation scope.
- Identify files likely to change.
- Explain important risks and dependencies.
- Define how the change will be verified.

Wait for explicit approval before implementation.

## Phase 4 — Implement

After approval:

- Implement only the approved scope.
- Follow existing project conventions.
- Keep changes focused and reviewable.
- Preserve unrelated user changes.
- Do not add unrelated improvements or dependencies.

If implementation reveals a consequential issue or requires expanding scope, stop and ask.

## Phase 5 — Verify and Review

After implementation:

- Run appropriate targeted tests and checks.
- Inspect the complete Git diff.
- Report changed files and explain the changes.
- Report exact verification commands and results.
- Identify remaining risks and unverified behavior.

Do not commit or push unless explicitly requested.

Stop after presenting the results. Wait for the user's review before starting another task.

## Communication

- Be direct, technically accurate, and concise.
- Explain important decisions without overwhelming the user.
- Never claim an action or verification succeeded unless it actually did.
- Ask one focused question when essential information is missing.
- Never treat silence as approval.
