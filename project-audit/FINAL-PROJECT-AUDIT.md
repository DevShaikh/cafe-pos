# Cafe POS — Final Project Audit

**Purpose:** Practical technical assessment for a locally deployed, single-computer cafe POS  
**Audit basis:** Static review of the current repository and the Stage 1–7 audit reports  
**Execution note:** No tests, builds, type checks, linters, performance measurements, or backup/restore exercises were run for this consolidated audit.

## 1. Project Overview

Cafe POS is a local point-of-sale application for a cashier using one computer. It has a Next.js/React interface, an Express API, a SQLite database accessed through Prisma, and an Electron shell. It is not a SaaS, multi-tenant, multi-branch, or distributed system; those architectures are unnecessary for its current purpose.

The implementation has progressed beyond several older reports and the README: the current checkout creates server-backed orders, payments are recorded through the API, and authentication and cashier sessions are wired. Some older locally persisted receipts remain supported. The project is still in active development: product and settings management, recovery safeguards, and broad behavioral coverage are incomplete.

### Scope and methodology

This report consolidates `project-audit/01-project-architecture.md` through `07-npm-dependencies.md`. Significant claims were checked against current routes, controllers, services, schemas, Prisma models and migrations, client pages and stores, Electron startup, package manifests and lockfiles, tests, README, and `docs/backend-plan.md`. The current source was treated as authoritative where an older report or README disagreed with it.

This is a static review, not a penetration test or operational validation. The Stage 7 report records an `npm audit` scan dated 2026-11-01; that scan was not repeated for this consolidation. No tests were run during this audit.

## 2. Current Architecture

- **Client:** Next.js App Router and React, with TypeScript, Tailwind, shadcn/Radix UI, Zustand for cart and legacy local receipts, and TanStack Query for API data.
- **API:** Node.js and Express, with Zod request schemas, cookie-based JWT authentication, bcryptjs PIN hashing, Helmet, CORS, and a controller/service separation.
- **Database:** Local SQLite through Prisma 7 and the `better-sqlite3` adapter. Orders, items, payments, register sessions, settings, counters, audit events, and idempotency records are represented in the Prisma schema.
- **Desktop shell:** Electron opens the Next.js interface at `http://localhost:3001`. Both packaged and development branches currently use that same URL; the shell does not itself package or start the UI/API services.
- **Data flow:** The client calls the Express API over HTTP. Prisma is used on the server; the browser does not connect directly to SQLite.

The current documented implementation map is `docs/backend-plan.md`. At the time of the initial audit, the README and older reports contained stale status/runtime claims; the README and related project documents were reconciled during the subsequent documentation refresh.

## 3. What Is Already Implemented Well

- Order creation and payment recording are server-backed. The service recalculates totals rather than trusting client totals, stores money in integer paisa, snapshots product names and prices, and groups order, audit, event, counter, and idempotency writes in Prisma transactions.
- The order API uses idempotency keys to make retrying an uncertain create/payment request safer. Orders are listed with pagination; sales reports aggregate paid server orders.
- A cashier session is required to create orders. The database enforces at most one open session per staff member with a partial unique index, and session operations use transactions.
- PINs are stored as bcrypt hashes. Authentication uses an HTTP-only, SameSite=Lax cookie; the JWT expires after 12 hours. Production configuration requires a JWT secret of at least 32 characters.
- Helmet, a configured CORS origin, Zod validation for order/session/login inputs, a shared `AppError`, and a central error handler provide useful baseline safeguards.
- The schema’s integer-paisa model and order-line snapshots are a good fit for accurate receipts and stable historical records.
- SQLite is suitable for the intended single-cashier, single-computer workload. Its write concurrency limits are not, by themselves, a reason to introduce another database.
- The layered code, TypeScript, Prisma, Zod, React Query, and Zustand are proportionate to the current application. No large architectural replacement is justified.

## 4. Feature Implementation Assessment

| Area | Current state verified in source |
|---|---|
| Sign-in | Staff list and PIN login, current-session check, logout, and authenticated route gating exist. The seed includes a known default PIN; see Security. |
| Catalog | API-backed product listing and server-side optional name/category filtering exist. The catalog search field and category buttons are not connected to those filters. The product API exposes only `GET`; product creation, editing, and deletion are absent. |
| Availability | The server rejects unavailable products when creating an order. The product card does not disable or visually mark unavailable products, so a cashier can add one and only discover the problem at checkout. |
| Checkout | The client submits product IDs and quantities; the server checks availability, reads settings, calculates totals, allocates a receipt number, and creates an unpaid order. The UI then invokes browser printing. |
| Payments and orders | An unpaid server order can be marked paid with a payment method. Listing and date filters are supported. Editing or voiding orders, refunds, and cash reconciliation are not implemented. Cash received/change fields exist in the schema but the current payment flow records the order amount and method only. |
| Register sessions | Open/current/list/close flows are present. Closing is designed to reject sessions with unpaid orders, per the current backend plan; no session behavior tests were identified. |
| Reports | Server sales totals and order-type aggregates are available with date/session filters. The screen also combines legacy device-saved receipts with server orders. |
| Settings and staff management | Settings and staff administration are not complete user-facing features. The seed is the current provisioning path; the tax rate is seeded as 8%. |
| Desktop deployment | Electron is a shell around a locally served UI, not yet a self-contained offline installer. The packaged branch still points to localhost services. |

These are implementation-status statements, not performance or user-acceptance test results.

## 5. Code Quality & Maintainability

The current architecture has clear boundaries: routes map URLs, controllers adapt HTTP requests, services implement business operations, and Prisma owns database access. Zod schemas and generated Prisma types reduce avoidable input and query errors. The test command uses Node’s built-in test runner, so a new test framework is not required simply to expand server coverage.

Keep the current project structure and direct Prisma service access for this small application. A repository/DI abstraction, a second validation library, or a broad rewrite would add indirection without a demonstrated benefit. The old Stage 4 report includes duplicated, outdated examples and references to files and models not present in the current implementation; its specific sample-code findings were not treated as verified defects.

Maintainability improvements with direct value:

- Validate product query parameters instead of casting them to strings; repeated parameters can arrive as arrays.
- Keep error responses consistent and give the single route-not-found path one stable code.
- Revisit broad client catch blocks and mutation error states so failures are visible and retries are clear.
- Validate the JSON stored for idempotent replays at a typed boundary, particularly if response formats change between releases.
- Avoid adding services or abstractions until a real requirement makes them useful.

## 6. Security Assessment

### Positive controls

PIN hashes use bcryptjs; authenticated routes reload the staff member and reject inactive or missing accounts. The JWT secret is validated at startup for production. The cookie uses `httpOnly`, `SameSite=Lax`, and `secure` in production. Helmet and a single configured CORS origin are enabled. The API’s error handler avoids returning unexpected internal error details.

### Important limitations

- The seed creates an `Admin` with the known PIN `1234` when an admin does not exist, and logs that PIN. The setup instructions tell the operator to run the seed. There is no forced first-login PIN change.
- There is no login rate limiting or recorded failed-login backoff. This matters particularly because the credential is a short PIN.
- `server/src/server.ts` calls `server.listen(env.port)` without a host. Node therefore listens on the machine’s unspecified/default interfaces rather than explicitly limiting the API to loopback. For a one-computer POS, LAN exposure should be opt-in, not accidental.
- Staff roles are present in the model and token, but the current route middleware checks authentication, not role permissions. The current feature set has no admin-only management routes, so role enforcement is not yet a substitute for missing product/staff administration.
- Logout clears the browser cookie but does not revoke a JWT server-side. A copied token remains valid until expiry or staff deactivation. This is a lower-priority limitation for a single local terminal.

The Stage 5 report’s claim that `express-rate-limit` is already a direct server dependency is incorrect. The Stage 7 dependency review found it only in a transitive client tooling tree, and it is not configured in the API. The Stage 5 advice about cloud secret managers, Redis, and infrastructure is not needed for this local deployment; secure local configuration and a simple in-process login limit are more proportionate.

## 7. Error Handling & Reliability

The API has a central handler, structured error payloads, validation error formatting, explicit malformed-JSON handling, and sanitized responses for unexpected errors. Controllers generally forward exceptions to the handler. `server/src/app.test.ts` covers several global behaviors, but not the business-critical flows.

Remaining issues verified in the Stage 6 report and current sources:

- **Parser classification — Medium:** malformed JSON is mapped to a 400, but other parser errors such as an oversized body can fall into the generic 500 path. Map expected parser failures to safe 4xx responses.
- **Product query validation — Medium:** `product.controller.ts` casts query values to strings. Repeated `search` or `category` parameters can have non-string shapes; service/database failure is then reported as a 500. Validate and normalize query input at the route boundary.
- **Headers already sent — Low:** `error-handler.ts` does not explicitly delegate when response headers have already been sent. Follow Express’s standard error-middleware behavior for that case.
- **Request correlation — Low:** request completion and error logs use console output without a shared request identifier. A simple request ID in both entries would help diagnose a local failure; a large logging platform is not warranted.
- **Client feedback — Low:** error messages vary between API-derived and fixed text; the navbar logout mutation has no visible error feedback. Ensure failed actions are apparent and recoverable without displaying internal details.
- **Duplicate 404 paths — Low:** `app.ts` has an inline `NOT_FOUND` response while `middleware/not-found.ts` defines a different code/message. Keep one stable implementation.

### Local data and recovery

`electron/main.cjs` clears local storage, cookies, and other browser storage every time Electron starts. `client/src/store/order.store.ts` persists legacy receipts in local storage. Consequently, legacy device-saved receipts are erased on each Electron launch, and the cashier’s cookie is also cleared. Current server-backed orders remain in SQLite, but the behavior can destroy locally stored history and force a new login.

No checked-in backup/restore utility or practical recovery runbook was found in the reviewed files. The SQLite database is intentionally ignored by Git, which is correct for private local data but means it is not backed up by source control. A real POS needs a dated backup kept separately from the computer and a tested restore procedure.

The migration `20261026175721_add_pos_core_models` explicitly drops the old `products` table before creating the new model table. `docs/backend-plan.md` says it has already been applied to the development database. Do not rewrite migration history casually; before a database contains real catalog data, establish and test a safe upgrade/rebaseline path with a backup.

## 8. npm Dependencies Assessment

The Stage 7 inventory found three npm workspaces: root (3 direct dependencies), client (26), and server (22). The main packages are justified for their current responsibilities:

- Next/React, Tailwind, Radix/shadcn, Lucide, and `react-to-print` support the UI and browser receipt flow.
- TanStack Query handles API query/mutation state; Zustand handles the local cart and legacy persisted receipts.
- Express, Zod, Helmet, CORS, cookie-parser, bcryptjs, and jsonwebtoken cover the current HTTP, validation, and authentication stack.
- Prisma with the `better-sqlite3` adapter fits local SQLite access and transactions.
- Electron and `concurrently` support the desktop shell and local development/start scripts.

No package replacement or broad dependency reduction is recommended. Specific cleanup and compatibility notes:

1. `@tanstack/react-query-devtools` is declared in the client but no use was found.
2. `@types/bcryptjs` is redundant for the installed bcryptjs package, which ships TypeScript declarations.
3. `client/src/lib/utils.ts` imports `clsx` without declaring it directly. It currently resolves transitively; declare it if retained or consolidate after verifying class-name behavior.
4. The client uses both the `cn` package and its own `clsx` + `tailwind-merge` helper. Consolidating these is optional, but review imports and compatibility first.
5. `shadcn` is listed as a production client dependency despite its CLI/tooling role; global CSS also imports from it. Moving it to development dependencies or taking ownership of generated CSS is only appropriate after confirming production builds still work.
6. The initial Stage 7 review found the README’s Node 20.9+ minimum conflicted with locked Electron, Prisma, and `cn` engine requirements. The README now states Node 22.12+; package compatibility was not retested in this documentation refresh.

The prior Stage 7 `npm audit` snapshot (2026-11-01) reported advisory matches: root 1 high; client 3 high, 20 moderate, 2 low; server 1 high, 12 moderate. Recorded high matches included Electron 44.9.0, `body-parser` 2.3.0 through Express/tooling, `follow-redirects` 1.16.1 through Axios, and `systeminformation` 5.33.15 through shadcn tooling. Those are time-bound lockfile/advisory matches, not proof that each path is exploitable in this application. The client and server lockfiles should be re-audited before deployment; do not apply a blanket major-version upgrade without reviewing compatibility.

No new package is justified for logging, retries, rate limiting, auth, validation, HTTP, transactions, charts, CSV/PDF, background jobs, or real-time features at this stage. Use the existing stack and built-in Node test tools. There is no current product need for Redis, a distributed job runner, or a new database.

## 9. Performance Assessment for a Single-Computer POS

The architecture is appropriate for one cashier and a local SQLite file. Server-side pagination limits order-list pages to 50 by default, and checkout does not need a remote cloud service. The orders table has a unique receipt-number index; register sessions have staff/status and opened-time indexes. No explicit indexes were found for the common order date/status and paid-date report filters.

The catalog service can filter by name/category, but the current UI does not send those filters. It loads the product list without pagination. The server-side name filter uses substring matching, which may scan a larger catalog. This is unlikely to matter for a normal cafe menu; implement the visible search first, then measure before considering SQLite FTS or additional indexing.

No benchmark, profiling, large-catalog test, or long-history test was run. Do not infer measured performance from this static review. If the order history grows enough for visible slowdowns, inspect SQLite query plans and add indexes based on the actual filters; do not migrate databases or add infrastructure preemptively.

## 10. Testing & Quality Assurance

The only discovered test file is `server/src/app.test.ts`. It uses Node’s built-in test runner and covers health success/failure, a Helmet header, configured CORS, unknown-route JSON, malformed JSON, and sanitizing unexpected errors. Those are useful API foundation tests.

No client test files were found. No automated coverage was identified for login failure/authorization, order creation and server totals, payment transitions, idempotency replay/conflict, cashier session rules, unavailable products, migration preservation, seed safety, print failure/reprint, or backup restoration. The current test suite does not establish that checkout and recovery are reliable.

**No tests were run during this audit.** Builds, type checks, lint, dependency scans, browser runs, performance tests, and backup/restore exercises were also not run for this consolidation. Stage 7’s earlier `npm audit` scan is reported as historical evidence only; it was not rerun here. No claim is made that tests or builds passed.

## 11. Problems and Vulnerabilities

Priorities below distinguish confirmed behavior from risk or planned improvement. The six error-handling findings from Stage 6 are retained individually.

| # | Priority | Finding and evidence | Why it matters |
|---|---|---|---|
| 1 | **High** | **Known default admin PIN.** `server/seeds/index.ts` creates and logs PIN `1234`; README setup runs the seed. | A known credential can grant entry to the POS when the seeded account remains active. |
| 2 | **High** | **No login rate limit, and API is not explicitly loopback-bound.** No limiter is configured; `server.ts` listens without a host. | A short PIN has limited guessing space, and the API may be reachable from the local network depending on host/firewall configuration. |
| 3 | **High** | **Electron clears persisted browser data on startup.** `electron/main.cjs` clears local storage and cookies; legacy receipts persist there. | Local-only receipt history can disappear at every launch; the login cookie is also cleared. |
| 4 | **High before real data** | **Destructive historical product migration.** The migration drops `products`; current backend-plan says it was applied in development. | An existing catalog can be lost when an older database applies this migration. A safe migration path and backup are needed before real data is used. |
| 5 | **High before operation** | **No identified backup/restore workflow.** No backup utility or restore procedure was found in source/docs reviewed. | A drive or database failure could permanently remove sales and catalog records. Recovery has not been demonstrated. |
| 6 | **Medium** | **Product search and categories are visual-only in the catalog.** The input and category buttons in `catalog/page.tsx` have no handlers; `useProducts()` requests the unfiltered catalog. | Cashiers cannot use the visible controls to find products quickly. |
| 7 | **Medium** | **Unavailable products remain selectable in the UI.** The card ignores `isAvailable`; the server rejects an order containing an unavailable product. | The cashier may build an invalid cart and only learn at order submission. |
| 8 | **Medium** | **Product/settings/order administration is incomplete.** Only product GET exists; no product write, settings UI, order edit/void, refund, or cash reconciliation flow is present. | The cashier cannot maintain the menu or correct common transaction mistakes through the application. |
| 9 | **Medium** | **Client tax display is fixed at 8%, while the server reads `Settings.taxRateBps`.** `receipt-panel.tsx` calculates a displayed 8%; `order.service.ts` uses the database setting. | If the stored setting differs from 8%, the amount shown before submission can disagree with the authoritative order amount. |
| 10 | **Medium** | **Product query values are cast, not validated.** `product.controller.ts` casts query values; repeated query parameters can be arrays and fail later in the service. | Invalid client input can become a misleading server/database 500 rather than a 400. |
| 11 | **Medium** | **Expected request-parser failures are not all normalized.** The error handler specifically handles malformed JSON; other parser failures can take the generic 500 path. | Request errors are misclassified and less actionable. |
| 12 | **Low** | **Error responses after headers are sent are not explicitly delegated.** The global handler writes JSON without checking `headersSent`. | A late failure may cause a secondary response-write error. |
| 13 | **Low** | **Logs lack a shared request identifier.** Request completion and error output are separate console messages. | Local troubleshooting requires manual correlation. |
| 14 | **Low** | **Client error feedback is uneven.** Some screens use fixed messages; logout has no visible mutation error. | A cashier may not know an operation failed or how to recover. |
| 15 | **Low** | **Two route-not-found implementations use different codes/messages.** `app.ts` uses an inline `NOT_FOUND`; `middleware/not-found.ts` defines another path. | API error behavior can drift. |
| 16 | **Low / maintainability** | **Idempotency replay parses stored JSON without validating its shape.** `order.service.ts` parses `responseJson` and returns it as `unknown`. | A corrupted or obsolete stored response may not match the client contract; the value is locally generated today, so this is not evidence of an external injection path. |
| 17 | **Resolved / compatibility** | **README runtime minimum was stale.** The Stage 7 lockfile review found Electron 44.9.0, Prisma 7.10.1, and `cn` require newer Node versions than 20.9; README now states Node 22.12+. | The README mismatch is corrected. Package engine compatibility and installation were not re-tested in this documentation refresh. |
| 18 | **Dependency maintenance** | **The 2026-11-01 npm audit snapshot contained high and moderate advisory matches.** See Section 8 for packages and limitations. | The lockfiles need a fresh scan and deliberate compatible updates before deployment; the old scan is not current proof of exploitability. |
| 19 | **Resolved / documentation** | **README previously said order/payment data remained in browser state and Phase F was in progress.** Current order/payment services are server-backed, and the README/status docs have now been updated. | The known status mismatch was corrected during the documentation refresh; verify future changes keep the docs aligned. |

### Corrected or unverified claims from prior reports

- Stage 5’s claim that `express-rate-limit` is already installed directly in the server is false; no API limiter is present.
- Older reports overstate product/order management and some API/security details, and include model or file references not present in the current source. Only current-source-confirmed behavior is listed above.
- The architecture report’s concern about SQLite write concurrency is not considered a blocker for the stated single-cashier scope.
- Dependency advisories and registry versions are time-bound; current reachability and exploitability were not tested.

## 12. Recommended Improvements (Prioritized)

| Priority | Improvement | Why it matters |
|---|---|---|
| **High** | Prevent Electron startup from erasing persisted application data. Preserve required browser storage and make any intentional logout explicit; add a migration/export path for legacy local receipts if they are user data. | Avoids silent loss of local records. |
| **High** | Bind the API to `127.0.0.1` by default for one-computer operation. If LAN access is later required, make it an explicit configuration choice with appropriate authentication and firewall guidance. | Reduces unnecessary network exposure. |
| **High** | Replace the shared `1234` seed credential with secure first-run provisioning (a locally generated one-time PIN or deliberate operator setup); never print a reusable credential in logs. Add a simple login attempt limit/backoff and record failed attempts without storing PINs. | Protects access without requiring cloud services or Redis. |
| **High** | Define a safe database backup and restore procedure before real use: dated copies kept on a separate local/removable drive, retention, a pre-migration backup, and a documented restore rehearsal. | Gives the cashier a practical recovery path after hardware or database failure. |
| **High before production data** | Treat existing migrations as immutable history. Rebaseline or add a new preservation migration as needed; test the upgrade against a copy containing representative catalog data and verify row counts. | Prevents destructive changes to a live local database. |
| **High** | Add server tests for order creation totals, payment state changes, idempotent retries/conflicts, session open/close rules, unavailable products, and migration/seed safety. Use the existing Node test runner and a temporary SQLite database. | These are the financially important behaviors and currently lack direct coverage. |
| **Medium** | Wire catalog search/category controls to existing API filters, display/disable unavailable products, and provide a clear empty/error state. Add pagination or search optimization only if a real catalog needs it. | Speeds checkout and avoids late rejection of invalid carts. |
| **Medium** | Add a small product-management and settings workflow, including a single source for the tax rate shown in checkout and used by the server. | Keeps menu/pricing/tax maintainable and prevents displayed/server total drift. |
| **Medium** | Provide controlled order correction (void/edit before payment as appropriate), refund/void audit trail, and cash received/change or reconciliation if required by the cafe’s workflow. Do not silently rewrite completed receipt snapshots. | Enables recovery from normal cashier mistakes and more accurate closeout. |
| **Medium** | Validate product query schemas; normalize parser failures; resolve the duplicate 404 path; make logout and print failures visible. | Makes common failures actionable and consistent. |
| **Completed in documentation refresh** | Align README setup/runtime guidance and feature status with the current API-backed implementation and observed Node engine requirements. | Prevents incorrect setup expectations; re-verify package engines when dependencies change. |
| **Low** | Add request IDs to console logs and evaluate a simple local log-retention approach if support experience shows console output is insufficient. | Improves local diagnosis without adding a logging platform. |
| **Low** | Remove the unused React Query devtools declaration and redundant bcrypt types; declare or remove the direct `clsx` import; simplify the duplicate class helper only after behavior is checked. | Reduces dependency drift without destabilizing the application. |
| **Low** | Re-audit and update vulnerable package resolutions using compatible releases, then verify the lockfiles and supported Node version. Reclassify build-time-only dependencies where safe. | Reduces dependency risk without blind major upgrades. |
| **Low / evidence-led** | Add database indexes only after checking actual SQLite query plans and observed slowdowns; do not add full-text search, cloud monitoring, or infrastructure preemptively. | Keeps maintenance appropriate for a small local dataset. |

## 13. Simple Implementation Roadmap

### Phase 1: Critical fixes

1. Stop clearing localStorage at Electron startup; confirm that server-backed orders and any legacy local receipts survive restart as intended.
2. Bind the API to loopback by default and remove the shared seed PIN. Add first-run credential setup and basic login throttling.
3. Establish and rehearse a separate SQLite backup/restore workflow before using real sales data.
4. Review the destructive migration against a copied database; preserve migration history and create a safe forward path before deploying to any database with real catalog data.
5. Add focused tests for the core order/payment/idempotency/session paths with temporary SQLite data.

### Phase 2: Important improvements

1. Connect the catalog search/category UI to the existing server filters and visibly prevent unavailable products from being added.
2. Implement the minimum product and tax-settings maintenance needed by the cafe; ensure the UI and server use the same tax setting.
3. Add a safe order correction/void process and cash reconciliation only to the extent required by the real operating procedure.
4. Fix product query validation and the highest-impact parser, client feedback, and not-found consistency gaps.
5. Update setup and status documentation to match the code and supported Node runtime.

### Phase 3: Optional polish

1. Improve local diagnostics with request IDs and, if needed, retained local logs.
2. Add indexes or search optimization only after measuring realistic catalog/history data.
3. Add UI/browser tests for checkout, print failures, and repeat operations if manual verification becomes costly.
4. Decide whether the Electron shell should become a self-contained installer that starts the local services. Do not describe the current localhost shell as packaged/offline-ready until that is implemented and verified.
5. Remove unused/redundant dependencies and consolidate class utilities after confirming build behavior.

## 14. Final Project Readiness Assessment

The project has a sensible foundation for a local single-cashier POS: the backend uses SQLite and transactional order/payment operations, money is stored in integer paisa, order lines preserve snapshots, and the stack is not overengineered. SQLite, Prisma, Express, and the existing state/query libraries are appropriate for the intended workload.

It is **not yet ready to be trusted as the sole production POS**. The known seeded PIN, lack of throttling, non-loopback default API binding, Electron storage clearing, destructive migration history, and absence of a demonstrated backup/restore process are material security and data-integrity risks. Missing product/settings maintenance and limited critical-flow tests also make routine operation and recovery incomplete.

Address Phase 1 before entering real sales or catalog data. Then validate order/payment/session behavior and complete only the management and reporting workflows the cafe actually needs. No application source, configuration, or dependencies were changed for the initial audit or documentation refresh. Official project documentation was updated during the later authorized documentation refresh. No tests were run.
