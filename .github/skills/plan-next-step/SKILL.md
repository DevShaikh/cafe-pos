---
name: plan-next-step
description: Review and plan the next approved Cafe POS implementation task
disable-model-invocation: true
---
# Plan the next Cafe POS step

Use this prompt to prepare a small, reviewable implementation step. Ground the plan in the repository's current code, not only in its roadmap.

1. Read `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`, `README.md`, `.github/copilot-instructions.md`, `docs/pos-spec.md`, and `docs/decisions.md`.
2. Inspect relevant source and existing tests. Treat source as authoritative when documentation disagrees. Identify whether the request fixes current behavior or adds a planned feature.
3. State the observed current behavior, the intended result, scope boundaries, and files likely to change. Call out material uncertainties before choosing a product or architecture behavior.
4. Keep API and database work on the server; keep browser access on the HTTP API. Reuse existing patterns, Zod schemas, shared types, and semantic theme tokens.
5. Treat the status document's pending items as incomplete until source demonstrates otherwise. Current known gaps include catalog UI filters/availability, product/settings administration, tax display alignment, order correction, cash reconciliation, backup/recovery, and deeper critical-flow tests. Server-backed order creation, payments, sessions, order history, and summary reports already exist; do not describe them as local-only or unimplemented.
6. Implement only the user's requested/approved scope. Do not start a new roadmap feature simply because it is listed as next.
7. Update documentation that the change makes inaccurate. If implementation status moves, update the roadmap/spec and README status consistently.
8. Run the smallest appropriate checks after authorized code changes unless the user or applicable repository instruction prohibits them. Report commands and outcomes truthfully and distinguish static reasoning from executed checks.
9. After significant work, update `project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md` with verified progress, pending work, bugs, and decisions.
10. Summarize changed files, user-visible behavior, verification, and remaining issues. Stop at the requested scope.

## Roadmap orientation

Do not use the historical Phase A-F labels in older docs as current status. Server-backed checkout/payment, order history, sessions, and summary reports are implemented. Read the status document for current operational gaps and use `docs/pos-spec.md` for desired product behavior.
