# Cafe POS Project Rules

- Treat this as a locally deployed Cafe POS for **one computer and one cashier**. Do not introduce SaaS, cloud, multi-branch, multi-tenant, or distributed-system complexity unless the user changes the product scope.
- Preserve the existing architecture: Next.js, React, TypeScript, Express, Prisma, and local SQLite. The browser communicates with the backend over HTTP; it must not access SQLite or Prisma directly.
- Before starting a new task, read `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`, then inspect the relevant current source. Treat project status and roadmap notes as a guide, not proof that a feature exists.
- Verify assumptions against actual source code. Follow the established folder boundaries, naming, types, validation, error-handling, and UI conventions.
- Avoid unnecessary dependencies, broad rewrites, abstractions, and overengineering. Prefer small, reviewable changes and preserve working functionality.
- Change only what the user authorized. Ask before consequential product or architecture decisions not already documented.
- After authorized code changes, run the smallest appropriate project checks. If an explicit instruction prevents a check or the required tool is unavailable, state that clearly and report which checks were not run. Report exact commands and results; never imply a check ran when it did not.
- After significant work, update `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md` with completed work, remaining tasks, bugs, and important decisions. Keep verified facts separate from assumptions and unverified items.
- Never describe a feature, fix, test, build, or decision as complete unless it has been verified.

## Project references

- `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md` — current cross-session project status and prioritized next steps.
- `docs/backend-plan.md` — implementation map, API flows, and known gaps; check against source because some details may become stale.
- `docs/pos-spec.md` — intended product workflow and user-facing behavior.
- `docs/decisions.md` — recorded domain and architecture decisions; distinguish decisions from implemented behavior.
- `client/AGENTS.md` — required Next.js-specific guidance before editing client code.
