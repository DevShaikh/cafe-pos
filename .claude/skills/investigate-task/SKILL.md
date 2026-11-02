---
name: investigate-task
description: Investigate a specific Cafe POS bug, feature request, or technical issue without modifying files. Use before planning implementation.
---

# Investigate Task

## Objective
Understand the requested task and report verified findings without changing code.

## Procedure
1. Read CLAUDE.md and applicable project rules.
2. Read the project status and roadmap.
3. Check Git status and preserve existing changes.
4. Identify relevant frontend, backend, database, and Electron files.
5. Trace the affected workflow through the application.
6. Inspect related tests and existing conventions.
7. Identify root causes, dependencies, risks, and possible solutions.

## Report
Present:
- Problem understanding.
- Current implementation.
- Relevant files and code locations.
- Verified root cause or unresolved questions.
- Possible approaches and trade-offs.
- Recommended solution.
- Suggested verification.

## Restrictions
- Read-only investigation.
- No file modifications.
- No dependency installation.
- No database mutations.
- No commits or pushes.
- Do not expand the requested scope.

Stop and wait for the user's decision.
