---
mode: agent
description: Review and plan the next approved Cafe POS implementation task
---

# Plan the next Cafe POS step

Use this prompt to prepare a small, reviewable implementation step. Ground the plan in the repository's current code, not only in its roadmap.

1. Read `README.md`, `.github/copilot-instructions.md`, `docs/pos-spec.md`, and `docs/decisions.md`.
2. Inspect the relevant source, configuration, and existing tests. Identify whether the request fixes current behavior or adds a planned feature.
3. State the observed current behavior, the intended result, scope boundaries, and files likely to change. Call out material uncertainties before choosing a product or architecture behavior.
4. Keep API and database work on the server; keep browser access on the HTTP API. Reuse existing patterns, Zod schemas, shared types, and semantic theme tokens.
5. Treat documented gaps (catalog filters, money units, print selection/lifecycle, edit/regenerate, reports/settings/auth, and server-side orders) as incomplete until the code demonstrates otherwise. Do not claim a placeholder is delivered.
6. Implement only the user's requested/approved scope. Do not start a new roadmap feature simply because it is listed as next.
7. Update documentation that the change makes inaccurate. If implementation status moves, update the roadmap/spec and README status consistently.
8. Run tests, lint, typecheck, builds, or other verification only when the user requests testing/verification. Report commands and outcomes truthfully and distinguish static reasoning from executed checks.
9. Summarize changed files, user-visible behavior, and remaining issues. Stop at the requested scope.

## Roadmap orientation

The backend foundation for products is present. Phases A-D are not all complete: the shell and core local order flow exist, while catalog filtering, reliable money-unit handling, reliable printing, order editing, reports, and several operational workflows remain partial or absent. Phase E covers reports and quality/polish; Phase F covers server-side orders and other explicitly approved persistence/auth/configuration decisions. See the feature-level status table in `docs/pos-spec.md` before selecting work.
