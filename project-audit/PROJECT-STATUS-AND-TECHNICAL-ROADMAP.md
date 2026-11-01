# Cafe POS — Project Status and Technical Roadmap

**Status basis:** Current repository source, the existing consolidated audit, and available project documentation  
**Last reviewed:** 2026-11-01  
**Review type:** Source review, targeted browser verification, and requested quality checks; focused login and Orders UI follow-up verified on 2026-11-01.

> Read this document before beginning a new project task. Verify relevant details against current source before editing; this is a continuity aid, not a substitute for source review.

## Project overview

Cafe POS is a local, single-cashier point-of-sale application intended to run on one computer. It is not a SaaS, cloud, multi-branch, multi-tenant, or distributed product. The stack is deliberately local and should remain simple unless the user changes the scope.

### Architecture

- **Client:** Next.js App Router, React, and strict TypeScript; Tailwind CSS and shadcn/Radix UI.
- **API:** Node.js, Express, TypeScript, Zod request validation, cookie-based JWT authentication, bcryptjs PIN hashing, Helmet, and CORS.
- **Database:** SQLite in a local file, accessed through Prisma 7 and the `better-sqlite3` adapter.
- **Client state/data:** Zustand stores the cart and older locally persisted receipts; TanStack Query manages API queries and mutations; Axios is used by client services.
- **Desktop:** Electron opens the Next.js UI at `http://localhost:3001`. The packaged and development branches currently use the same local URL; the repository does not provide a complete packaged/offline service lifecycle.
- **API boundaries:** Browser requests go through HTTP and the Next.js proxy to Express. Client code must not access Prisma or SQLite directly.
- **Server organization:** Routes → controllers → services → Prisma. Prisma schema is split across `server/prisma/schema/`, with migration history under `server/prisma/migrations/`.

Treat the current source and this status document as the implementation references. Older supporting docs are absent from the current worktree; verify behavior against source rather than relying on prior summaries.

## Completed and currently implemented features

The following are supported by current source and/or verification completed on 2026-11-01. This is implementation status, not proof of production readiness.

- Catalog search and category filters now work against the loaded menu; unavailable products are visible but disabled by default, and can be hidden from the grid.
- Product-list query parameters are Zod-validated; repeated/invalid filters return a 400 instead of reaching the service as malformed values. The API hides unavailable products unless explicitly asked to include them.
- Product prices and server order/payment amounts use integer paisa. The API returns `pricePaisa`; display formatting occurs in the client.
- Staff list, PIN login, current-session lookup, cookie logout, and authenticated route gating are implemented. The login form now binds its visible default staff choice to the submitted ID; wrong credentials remain rejected, and the browser session survives a reload.
- Login uses four masked shadcn OTP slots for the required numeric PIN. Sign-in remains disabled until all four digits are entered and while a request is pending; changing staff clears the prior PIN and error. The login card was refined for hierarchy and narrow-screen fit. These UI states and invalid-credential feedback were checked in-browser; successful authentication behavior was verified in the prior production-browser pass.
- Cashier register sessions support opening, current/history lookup, and closing; checkout requires an open session and closing is blocked while unpaid orders remain.
- New checkout sends product IDs, quantities, order type, and an idempotency key. The server checks availability, reads settings, calculates totals, allocates a receipt number, stores product snapshots, and writes order, event, audit, counter, and idempotency data transactionally.
- Manual payment recording updates unpaid server orders with a selected method. Server-backed order history supports cursor pagination/date filters; sales reports aggregate paid orders with date/session filters.
- Orders and Reports also show historical receipts persisted in the browser. Their payment state remains local; they are not converted into server records automatically.
- Receipt printing uses `react-to-print` and a custom 80mm template through the browser print UI; print failures now retain the created receipt and expose a retry action.
- Client login, catalog, orders, reports, and receipt controls use shadcn Button/Input and Field/Select/Card/Badge primitives. Login additionally uses the official OTP input and Alert components; the `input-otp` dependency was added through the configured shadcn CLI. The configured shadcn registry does not provide the legacy Form wrapper; forms use the official Field pattern and existing Zod validation.
- The Orders page restores horizontal, wrapping order cards after adopting the shadcn Card primitive. The shared content shell and navbar now shrink at narrower desktop widths rather than overflowing. Date filters remain usable in the narrower content area.
- Checkout now presents a prominent cashier-session-required notice with instructions to open a session from the top bar. Session-check failures are distinguished from a confirmed closed session and include a retry action.
- Central API error handling, structured success/error shapes, Zod schemas for key requests, Helmet, configured CORS, and server tests exist.

## Incomplete features

- **Product management:** API currently exposes product listing only. Create/update/delete and an operational catalog editor are absent.
- **Settings:** The Settings screen is a placeholder. Server settings are seeded, but there is no user-facing settings workflow.
- **Tax consistency:** The server reads `Settings.taxRateBps`; the receipt panel currently displays/calculates a fixed 8%. The displayed estimate can differ if the stored setting changes.
- **Order correction:** No edit/regenerate, void, refund, or cashier-facing error-correction flow is implemented.
- **Cash reconciliation:** Opening/closing cash counts and cash variance are not modeled in register sessions. Payment records method and order amount, not a full tender/received/change workflow.
- **Authorization policy:** Roles exist in staff data/token, but route middleware enforces authentication rather than role-specific permissions. Define policy only when management operations exist.
- **Recovery:** No verified backup/restore tool or restore runbook was found. Electron currently clears browser storage at startup.
- **Desktop packaging:** Electron is not a self-contained offline installer and does not start packaged local services.
- **Reports:** Current summary totals and order-type breakdown exist; report printing remains pending in the product spec.
- **Accessibility/polish:** Keyboard/focus/contrast work is listed as incomplete in the product spec and has not been fully verified.

## Known bugs, risks, and issues

### Security and data integrity

1. **Known default administrator PIN:** `server/seeds/index.ts` creates an `Admin` with PIN `1234` when none exists and logs the PIN. The setup guide instructs operators to run the seed. Replace this with safe first-run provisioning before real use.
2. **No login throttling:** No rate limiter or failed-login backoff is configured. `express-rate-limit` is not a direct server dependency despite the obsolete Stage 5 report’s claim.
3. **API binding:** `server/src/server.ts` calls `server.listen(env.port)` without explicitly binding to `127.0.0.1`. Local firewall/network exposure depends on runtime defaults and environment; loopback-only should be the default for this single-computer application.
4. **Electron clears browser storage:** `electron/main.cjs` clears local storage and cookies at startup. This erases legacy local receipts and removes the login cookie. Server-backed records remain in SQLite, but local history can be lost.
5. **Destructive historical migration:** `20261026175721_add_pos_core_models` drops the old `products` table. `docs/backend-plan.md` says it was applied to the development database. Preserve migration history; test a safe upgrade/rebaseline against a copied database before any database with real catalog data is upgraded.
6. **No verified backup/recovery:** The SQLite database is local and ignored by Git. No backup/restore process has been exercised; a hardware/database failure could lose sales data.
7. **Logout does not revoke JWT server-side:** It clears the browser cookie; a copied token remains valid until expiry or staff deactivation. Lower urgency for a local single terminal, but should be documented.

### Functionality and reliability

- **Resolved 2026-11-01:** The login dropdown displayed its first staff member while its controlled state remained empty; submit therefore sent an empty ID and the API returned `400 Invalid UUID`. The selected ID is now derived from the active staff query, and browser checks confirmed invalid-credential rejection, successful redirect, and session persistence.
- **Resolved 2026-11-01:** The Orders page's order-card layout regressed because shadcn Card defaults to a column flex direction; cards now explicitly use a horizontal wrapping layout. The main shell/header also had a narrow-screen width overflow, which is corrected. Follow-up browser checks confirmed card/filter bounds at a 900px viewport.
- **Resolved 2026-11-01:** Login did not clearly communicate its disabled state and used a plain password field. It now requires a complete four-digit numeric PIN in four masked shadcn OTP slots, clears PIN/error when staff changes, and explains the incomplete state. Browser checks verified partial PIN remains disabled, complete PIN enables submit, and invalid credentials display an error.
- **Resolved 2026-11-01:** Checkout's closed-session prerequisite was easy to miss. The receipt panel now prominently explains how to open a cashier session and provides retry guidance if session status cannot be fetched. The closed-session notice was confirmed in the browser.
- **Resolved 2026-11-01:** Catalog search/category controls were inert, unavailable products could be added, and repeated product query parameters were not validated. Search/category filtering, unavailable-product UI/API handling, and Zod query validation are now implemented.
- Client checkout displays fixed 8% tax while server totals use the persisted setting.
- The error middleware explicitly maps malformed JSON but may classify other parser errors (for example oversized bodies) as generic 500 responses.
- Error handler does not explicitly delegate when response headers have already been sent.
- Request and error logs do not share a request correlation ID; error output is console-based.
- Error feedback still varies among screens; logout and receipt-print failures now have visible feedback.
- App has an inline not-found handler and a separate middleware definition with different codes/messages.
- Idempotency replay parses saved JSON without validating the response shape. The current payload is internally generated; no external injection path was established.

## Code quality and dependencies

### Strengths

- Clear route/controller/service/Prisma boundaries; strict TypeScript and generated Prisma client types.
- Zod request schemas and a shared `AppError`/error middleware.
- Transactional server order/payment flows, integer paisa, product snapshots, receipt counters, audit events, and idempotency support.
- Existing dependency choices (Next/React, Express, Prisma/SQLite, Zod, TanStack Query, Zustand, Axios, bcryptjs, JWT, Radix/shadcn, `react-to-print`, Electron) are generally aligned with current features. Avoid replacing them without a concrete need.
- Node’s built-in `node:test` runner is already used; no additional test framework is necessary to increase server coverage.

### Maintenance items

- Error normalization and 404 handling should be unified.
- Add runtime/schema validation at the idempotency replay boundary if stored response formats can change.
- Client error paths should consistently communicate failure and safe retry options.
- Client imports `clsx` without declaring it directly; `cn` and the local class merge helper overlap.
- `@tanstack/react-query-devtools` appears unused; `@types/bcryptjs` is redundant for a package that ships types.
- `shadcn` is declared as a production client dependency despite mainly being tooling, but global CSS imports it; change classification only after verifying builds.
- A prior dependency audit snapshot dated 2026-11-01 reported advisory matches: root 1 high; client 3 high, 20 moderate, 2 low; server 1 high, 12 moderate. High matches included Electron 44.9.0, `body-parser` 2.3.0, `follow-redirects` 1.16.1, and `systeminformation` 5.33.15. This is a time-bound advisory scan, not proof of exploitability. Re-run a fresh audit before deployment.
- README states Node 20.9+, while the prior locked-package engine review found installed Electron, Prisma, and `cn` require newer Node versions. Set a common tested Node minimum.
- Older Stage 1–7 reports are no longer in the audit directory; their consolidated findings are retained in `project-audit/FINAL-PROJECT-AUDIT.md`. Do not rely on their obsolete implementation examples.

## Performance considerations for one computer

- Local SQLite, Prisma, and a single cashier’s write pattern are suitable; no PostgreSQL, Redis, Kubernetes, cloud hosting, or microservices are warranted for the current scope.
- Order history uses cursor pagination (50 client page size by default; API permits up to 100). Reports aggregate server data.
- Catalog is currently unpaginated and loads all products; client-side name search is adequate for a typical cafe menu, but no benchmark was run. Measure before considering FTS or indexing.
- Existing indexes include unique receipt number and register-session staff/status and opened-time indexes. No explicit indexes were identified for common order-date/paid-date report queries. Add indexes only after checking real SQLite query plans or observed slowdown.
- Performance under a large catalog or long order history is unverified.

## Testing status

- Only discovered test file: `server/src/app.test.ts`, using Node’s built-in runner.
- Current test cases cover health success/failure, a Helmet header, configured CORS, unknown-route JSON, malformed JSON, masking unexpected errors, repeated product-filter rejection, and unavailable-product API filtering.
- **Verified 2026-11-01:** `npm run lint`, `npm run typecheck`, `npm run test` (9 passing), and `npm run build` passed. Production-browser checks covered login validation/rejection/success/session persistence, catalog search/category/empty-state behavior, and order/report filter controls.
- **Verified 2026-11-01 follow-up:** `npm run lint --prefix client`, `npm run typecheck --prefix client`, and `npm run build --prefix client` passed after the login OTP, Orders layout, and session guidance changes. Browser checks covered login button state and masked PIN at desktop/mobile sizes, invalid-credential feedback, Orders layout at 900px, and the closed-session checkout notice. The browser test used a stubbed API for login UI and session-required presentation; it was not a new successful-authentication integration test.
- No client automated tests were found. Automated coverage remains absent for order totals, payment transitions, idempotency replay/conflict, cashier session constraints, migration preservation, seed safety, print failure/retry, and backup restoration. The receipt print-failure flow was not manually exercised because browser print dialogs are not available in the automated browser session.
- No performance or backup/restore exercise was run. The previous `npm audit` scan is historical and was not repeated for this update.

## Documentation status and source-of-truth cautions

The consolidated audit and the status document were consulted. Several prior supporting docs are absent from the current worktree; this update intentionally changes only this status document, as requested.

Documentation was reconciled on 2026-11-01. The root README, backend plan, product specification, decisions, Copilot instructions, Cline rules, and next-step planning skill now reflect current implementation or point to this status document. `docs/STATE-ANALYSIS.md` is retained only as a pointer because it was not approved for deletion. `client/AGENTS.md` retains the generated Next.js guidance and should be read before client changes.

Continue to treat current source as authoritative for behavior. Use this document for progress and update it after significant work.

## Current development phase

**Post-core API integration; operational hardening and completion of practical single-counter workflows.** Server-backed login, sessions, checkout, payment, order history, and summary reporting are present. The product documentation still labels some earlier work as Phase E/F in progress; it has not been reconciled. This phase assessment is a synthesis of current source and docs, not a formal release declaration.

## Prioritized roadmap

### Phase 1 — Protect access and records before real operation

1. Stop Electron from clearing persistent application data on startup; make logout intentional and verify legacy receipt persistence across restart.
2. Bind the API to loopback by default and replace the shared seed PIN with safe local first-run credential provisioning. Add a proportionate login attempt limit/backoff.
3. Define and rehearse a SQLite backup/restore procedure, storing backups separately from the computer.
4. Review the destructive products migration against a copied database; establish a safe forward migration/rebaseline path without rewriting committed migration history.
5. Add focused automated coverage for order creation/totals, payment, idempotency, sessions, and migration/seed safety.

### Phase 2 — Improve daily cashier operations

1. Use the same configured tax rate in the checkout display and server calculation.
2. Add minimal product/settings maintenance and safe order correction/void controls according to the agreed cafe workflow.
3. Improve parser/not-found error normalization and continue testing logout and receipt print failure/retry feedback.
4. Reconcile README and decision/spec status with verified behavior; document supported Node runtime.

### Phase 3 — Optional, evidence-led polish

1. Add request IDs and simple local log retention if support needs justify it.
2. Add indexes or search optimization only after measuring representative local data.
3. Expand client/browser tests for printing, accessibility, and repeat operations.
4. Decide whether to make Electron a self-contained desktop installer that starts local services; do not claim packaged/offline readiness until verified.
5. Remove unused/redundant dependencies or consolidate the class helper after checking builds and behavior.

## Recommended next task

**Fix the Electron startup storage wipe in `electron/main.cjs`.** Preserve required local receipt storage across application restarts, while keeping logout a deliberate user action. Before changing behavior, decide whether cookies should persist too; then verify the receipt store survives a desktop restart and that the expected login flow still works. This directly addresses a confirmed local data-loss issue and is a focused first hardening task.

## Important decisions to preserve

- Keep the product local and single-cashier; SQLite remains appropriate.
- Keep integer paisa as the money source of truth; do not use floating-point values as authoritative monetary amounts.
- The server owns new order totals, receipt numbers, payments, and snapshots. Preserve legacy local receipts deliberately until an archive/import policy is chosen.
- Orders print when created, before payment; payments are manual confirmations, not payment-gateway transactions.
- Preserve committed Prisma migration history. Back up and test against a copy before risky schema changes.
- The 2026-11-01 documentation refresh and subsequent UI follow-up are reflected in this status document. The follow-up added the `input-otp` client dependency via the configured shadcn CLI; unrelated worktree changes were left untouched.
