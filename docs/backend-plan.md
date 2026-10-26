# Repository Guide and Backend Plan

This file records the repository's current structure and behavior so implementation work can start from the checked-in code state. Update the **Verified state** and **Flows** sections whenever those flows change. Product behavior remains specified in [`pos-spec.md`](pos-spec.md); current decisions are in [`decisions.md`](decisions.md).

## Project structure and conventions

```text
client/                 Next.js 16 App Router UI (React 19, TypeScript, Tailwind v4)
  src/app/              Route groups: (auth), (main), and same-origin API proxy
  src/components/       layout/, modules/, providers/, generated shadcn-style ui/
  src/lib/               API client, product service/hooks, Zod response schema, utils
  src/store/             Zustand cart and locally persisted receipt state
  src/types/             Client API and order types
server/                 Express 5 TypeScript API
  src/config/            Zod environment parsing
  src/routes/            API route mounting
  src/controllers/       HTTP request/response handling
  src/services/          Prisma-backed business/data operations
  src/schemas/           Zod request validation
  src/middleware/        logging, not-found and error handling
  src/lib/               Prisma client and SQLite URL resolution
  prisma/schema/         Split Prisma schema files; generated client is under src/generated
  prisma/migrations/     SQLite migration history
  seeds/                 Demo settings, staff and products
electron/main.cjs        Desktop window; currently points to localhost services
docs/                    Product specification, decisions and this repository guide
scripts/                 Package version synchronization helper
```

### Code style

- Both apps use strict TypeScript. Client aliases use `@/*` → `client/src/*`; server imports are relative and use NodeNext configuration.
- Server flow is route → controller → service → Prisma. Controllers forward failures to the common error handler using `next(error)`; request bodies should be validated with Zod schemas.
- Success responses use `{ success: true, message?, data? }`; errors use `{ error: { code, message, issues? } }`.
- Client data access is Axios service → TanStack Query hook → component. Zustand owns transient cart state and currently owns order state too.
- UI uses Tailwind utility classes, semantic CSS variables, and shadcn/Radix primitives. Several generated UI wrappers retain semicolon-free formatting; follow the touched file's local style.
- Do not treat declarations in this guide or `decisions.md` as implemented behavior unless the verified state below says so.

## Verified state (reviewed 2026-10-27)

### Deployment assumption

V1 is a local, single-cashier application, so SQLite remains the selected database. The checked-in Vercel configuration was exploratory and does not make Vercel a production target. Reconsider PostgreSQL if the product changes to a hosted service shared by multiple terminals. Keep the Electron boot work deferred until v1 is ready to boot.

### Implemented

- Next.js pages exist for catalog, orders, reports, settings, and login. The root URL redirects to `/catalog`.
- Catalog fetches products through a TanStack Query hook and the browser calls the Next catch-all `/api/*` proxy, which forwards to Express using `SERVER_URL`.
- Product list API reads Prisma products and returns integer `pricePaisa` values. Product cards convert to PKR for display while the Zustand cart stores integer paisa.
- The server now supports transactional order creation and manual payment recording with integer-paisa totals, product snapshots, configured tax basis points, receipt counters, audit events, and idempotency keys. These APIs require an authenticated staff session.
- New checkout submissions use the server to calculate totals, assign receipt numbers, save orders, and return the receipt data used for printing. Orders and Reports combine server data with existing device-saved receipts; legacy local receipts remain local and are never recreated using today's product prices.
- Order history uses cursor pagination (50 orders per client request, up to 100 per API request) and optional local date filters. The sales report endpoint aggregates the full matching server date range instead of relying on loaded order pages.
- Express mounts `/api`, Helmet, single-origin CORS, JSON/urlencoded parsers, request logging, cookie parsing, JSON 404s, and a global error handler.
- API routes include `GET /api`, `GET /api/health`, `GET /api/products`, auth staff/login/logout/me routes, and authenticated order list/create/read/payment routes.
- Login finds active staff by UUID and checks a bcrypt PIN. With a configured `JWT_SECRET`, it signs a 12-hour JWT, writes an audit log, and sets an HTTP-only `pos_session` cookie. Production startup requires the secret; development login fails clearly until one is configured. Logout clears the cookie.
- Prisma has Product, Order, OrderItem, Payment, Settings, Staff, AuditLog, Counter and IdempotencyKey models. A default admin is seeded with PIN `1234` if no admin exists.
- The seed script inserts demo products that are missing by name and preserves existing catalog rows and order items.
- The server test file covers health success/failure, Helmet, CORS, unknown routes, malformed JSON and unexpected error masking. It does not cover product behavior, auth, order/payment behavior, or migration/data preservation.

### Not implemented (despite target decisions or page names)

- Existing local receipts remain in the Zustand store; new server orders are also shown in Orders and Reports. Legacy local payment actions still update only local state.
- The client has staff selection/PIN login, checks `/api/auth/me`, gates the main route group, and can clear the session cookie. The server verifies sessions for `/api/auth/me`, products, and orders; role based authorization remains undefined.
- No edit/regenerate, void/refund, or open/close cashier session model is present. Date-range sales aggregates exist, but they are not yet tied to a cashier-defined session.
- Catalog search/category controls are visual only; product query schema includes filters but the controller/service do not parse/use them. Product create schema exists but there is no create route.
- Settings page, cashier identity, register status, and notification controls are placeholders/static UI.
- Product prices and order/payment monetary columns use integer paisa in the Prisma schema; tax rates use basis points. The product API sends `pricePaisa` and order APIs return integer-paisa totals.
- Server order creation and payment recording use `IdempotencyKey`; order writes, receipt counter updates, payment transitions, events, and audit records are transactional.
- Electron has no packaged/offline server lifecycle or build configuration in this repo. It loads `http://localhost:3001` in both packaged and development modes.

## Actual user flows

### Catalog and cart

`/` → redirect to `/catalog` → session gate checks `/api/auth/me` → `useProducts()` → Axios request `/api/products` → Next route handler forwards to `{SERVER_URL}/api/products` with the session cookie → Express auth middleware → product controller/service → Prisma `Product.findMany()` → response with integer `pricePaisa` → product cards convert to PKR for display and add snapshots into Zustand cart.

### Receipt, payment and report today

Product cards → Zustand cart stores `pricePaisa` → receipt panel sends product IDs, quantities, and order type with an idempotency key → authenticated Express route re-reads products/settings, calculates integer-paisa totals, assigns a receipt number, and stores order/items/events/audit row transactionally → server response supplies receipt values to the print dialog → cart clears. Orders paginates server history and can filter by order creation date. Reports select a local date range and aggregate server sales by payment date, then add matching old local receipts. New orders are paid through the API using a selected manual payment method. Old local receipts keep their local payment behavior.

### Login today

The client loads active staff, submits `{ staffId, pin }`, and receives an HTTP-only cookie through the same-origin Next proxy. The main route group checks `/api/auth/me`; its middleware verifies the JWT and reloads the active staff record from SQLite. Logout clears the cookie. Product and order APIs also require an active session; future business routes must apply the same middleware.

### Desktop today

Electron opens the local Next client URL and clears localStorage/cookies/IndexedDB before opening the window. This erases locally persisted receipts at every desktop launch and also removes the login cookie.

## Fix first: prioritized findings

1. **Resolve the destructive product migration before v1.** `20261026175721_add_pos_core_models` drops and recreates `products`. It is already applied to the local development database, so do not edit the committed migration in place without an intentional backup and migration rebaseline. Before v1, establish a safe migration history for any database that has real catalog data. The seed script now preserves existing products and order items while inserting missing demo products.
2. **Move receipt and payment ownership to the server.** Transactional order/payment APIs and the new-order UI flow now use server totals. Preserve existing local receipts while defining a deliberate archive/import path.
3. **Finish server-side authorization.** Define role policy for business operations and add rate limiting to PIN login. Current product and order routes require an active staff session.
4. **Implement order creation and payment as transactional server operations.** Implemented for create and mark-paid flows. Keep server authoritative for prices, totals/tax, item snapshots, receipt numbers, payment events and idempotency; add coverage before relying on the flows in production.
5. **Complete Orders and Reports API-backed behavior.** Server-backed checkout, manual payment, order pagination/date filters, and date-range sales reporting are implemented. Add a cashier session lifecycle and decide how to archive local receipt history before changing its persistence.
6. **Add behavioral coverage around critical paths.** Include auth failures/session behavior, order and payment transitions, replayed idempotency keys, rounding, migration preservation, seed safety and the client/server contract. Existing API tests mock only the health query.
7. **Keep client API configuration aligned.** The Next proxy reads `SERVER_URL`; README and `client/.env.example` now document that setting. Revisit this when the API proxy or local service ports change.
8. **Finish product and v1 operational flows.** Wire search/category filters and availability, edit/void rules, settings-driven tax/receipt details, and report printing according to the agreed scope.
9. **Defer Electron work until v1 is ready to boot.** Electron currently clears localStorage/cookies/IndexedDB at startup, which erases locally persisted receipts, and always loads localhost. Leave the Electron boot/storage lifecycle for the v1 boot milestone; resolve it before v1 desktop use.

## Recommended implementation sequence

1. Resolve the migration and seed data-safety issues; establish an explicit backup/reset policy.
2. Implement transactional order/payment APIs using integer paisa, wire client flows, and add date-filtered pagination/reporting (done); keep historical local receipts visible and plan an archive/import path before removing local persistence.
3. Define role policy, add login rate limiting, and add API contract coverage for auth and order/payment behavior.
4. Add product filters and API contract tests if needed by the checkout flow.
5. Add edit/void order operations and the remaining payment tender details as v1 scope requires.
6. Wire new checkout, Orders, and Reports to server queries/mutations (basic flows done); define deliberate offline behavior, history pagination, and local receipt archival for the single-counter deployment.
7. Build reports from persisted data, then finish settings and v1 web boot behavior.
8. When v1 is ready to boot, address Electron startup, storage preservation, and packaging as a dedicated milestone.

## API contract status

| Route | Current behavior | Status |
| --- | --- | --- |
| `GET /api` | Welcome metadata | Implemented |
| `GET /api/health` | API and database connectivity | Implemented |
| `GET /api/products` | List all products; no filters applied | Implemented; requires staff session |
| `GET /api/auth/staff` | List active staff IDs and names for login selection | Implemented |
| `POST /api/auth/login` | `{ staffId, pin }`, sets `pos_session` cookie | Implemented; add rate limiting |
| `POST /api/auth/logout` | Clears cookie | Partial; no server token revocation |
| `GET /api/auth/me` | Verifies cookie and returns active staff | Implemented; used by the main UI gate |
| `POST /api/orders` | Create unpaid order from product IDs and quantities; requires `Idempotency-Key` | Implemented; authenticated |
| `GET /api/orders` / `GET /api/orders/:id` | Cursor-paginated orders (limit 1–100, optional `from`/`to` date bounds) and order details | Implemented; authenticated |
| `POST /api/orders/:id/payments` | Mark an unpaid order paid using a payment method; requires `Idempotency-Key` | Implemented; authenticated |
| `GET /api/reports/sales` | Paid-order totals and order-type breakdown for optional `from`/`to` date bounds | Implemented; authenticated; date-based, not cashier-session-based |

## Environment and local startup

- Server reads `server/.env` (or process environment): `NODE_ENV`, `PORT`, `DATABASE_URL`, `CLIENT_ORIGIN`. SQLite defaults to `server/data/cafe-pos.db` when `DATABASE_URL` is omitted.
- The Next proxy reads `SERVER_URL` and needs a base URL for the Express service (locally, `http://localhost:3000`). This is documented in both README and `client/.env.example`.
- The exploratory Vercel configuration gives the client service `SERVER_URL` through a service binding. It is not the production deployment plan; a Vercel deployment would need a persistent hosted database such as PostgreSQL rather than this local SQLite file.

## Maintenance note

When changing code, update the relevant flow/status here, product rules in `pos-spec.md`, and implemented/target decisions in `decisions.md`. Keep roadmap claims aligned with actual routes and client behavior. This guide is a navigation and status aid, not a substitute for reading the implementation when changing it.
