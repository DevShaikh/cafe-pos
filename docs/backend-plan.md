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
- Product list API reads Prisma products and serializes price as a two-decimal string. The UI adds products to a Zustand cart.
- Receipt generation, 8% tax, receipt numbering, paid/unpaid state, reports, and printing are client-side. Receipts persist in browser localStorage via Zustand.
- Express mounts `/api`, Helmet, single-origin CORS, JSON/urlencoded parsers, request logging, cookie parsing, JSON 404s, and a global error handler.
- API routes currently include `GET /api`, `GET /api/health`, `GET /api/products`, `POST /api/auth/login`, and `POST /api/auth/logout`.
- Login finds active staff by UUID and checks a bcrypt PIN. With a configured `JWT_SECRET`, it signs a 12-hour JWT, writes an audit log, and sets an HTTP-only `pos_session` cookie. Production startup requires the secret; development login fails clearly until one is configured. Logout clears the cookie.
- Prisma has Product, Order, OrderItem, Payment, Settings, Staff, AuditLog, Counter and IdempotencyKey models. A default admin is seeded with PIN `1234` if no admin exists.
- The seed script inserts demo products that are missing by name and preserves existing catalog rows and order items.
- The server test file covers health success/failure, Helmet, CORS, unknown routes, malformed JSON and unexpected error masking. It does not cover product behavior, auth, order/payment behavior, or migration/data preservation.

### Not implemented (despite target decisions or page names)

- No order or payment API/controller/service exists. Orders page and reports still read the local Zustand receipt store.
- No client authentication/session state, form, current-user endpoint, route guard, auth middleware, or role/active-user enforcement exists. The login page is only `LoginPage` text.
- No edit/regenerate, void/refund, payment method capture, session/open-close model, or server-backed reports flow is present.
- Catalog search/category controls are visual only; product query schema includes filters but the controller/service do not parse/use them. Product create schema exists but there is no create route.
- Settings page, cashier identity, register status, and notification controls are placeholders/static UI.
- Product API values and all persisted monetary columns currently use JavaScript/SQLite floating-point numbers, not integer paisa. Backend tax basis points are not in the schema.
- `IdempotencyKey` is only a Prisma model. No endpoint or code uses it.
- Electron has no packaged/offline server lifecycle or build configuration in this repo. It loads `http://localhost:3001` in both packaged and development modes.

## Actual user flows

### Catalog and cart

`/` → redirect to `/catalog` → `useProducts()` → Axios request `/api/products` → Next route handler forwards to `{SERVER_URL}/api/products` → Express product controller/service → Prisma `Product.findMany()` → response with decimal-string prices → product cards add snapshots into Zustand cart.

### Receipt, payment and report today

Product cards → Zustand cart → receipt panel calculates subtotal and hardcoded 8% tax → Generate adds a receipt with local sequential number to Zustand persist → print dialog runs through `react-to-print` → cart clears. Orders page marks a local receipt paid; Reports page totals local paid receipts. The server/database is not involved in these three flows.

### Login today

The login page has no form or network call. The server login route is callable directly with `{ staffId, pin }`; a successful request sets a cookie. No server middleware reads or validates that cookie on protected operations because none are implemented. Logout only clears the browser cookie.

### Desktop today

Electron opens the local Next client URL and clears localStorage/cookies/IndexedDB before opening the window. This erases locally persisted receipts at every desktop launch and also removes the login cookie.

## Fix first: prioritized findings

1. **Resolve the destructive product migration before v1.** `20261026175721_add_pos_core_models` drops and recreates `products`. It is already applied to the local development database, so do not edit the committed migration in place without an intentional backup and migration rebaseline. Before v1, establish a safe migration history for any database that has real catalog data. The seed script now preserves existing products and order items while inserting missing demo products.
2. **Settle the money representation and migrate consistently.** Decisions say integer paisa, but Product, Order, OrderItem, Payment and Settings use `Float`; current client prices are PKR decimal numbers/strings. Choose integer minor units end-to-end before order APIs and migrate the database without rounding loss.
3. **Finish authentication before exposing order/payment writes.** Add cookie/session verification and a current-user endpoint, protect business routes, and enforce staff active/role policy. Add a client login/logout/session flow before relying on the current login route; there is currently no endpoint for the client to discover a staff UUID for the login payload.
4. **Implement order creation and payment as transactional server operations.** Server must re-read product prices, calculate totals/tax, snapshot item names/prices, assign receipt numbers, record payment/audit events, and enforce idempotency. Never accept authoritative totals or receipt numbers from the client.
5. **Move Orders and Reports to API-backed state.** Migrate existing local-state behaviors to server queries/mutations, define reconciliation for existing local receipts, and only then remove or downgrade client order persistence.
6. **Add behavioral coverage around critical paths.** Include auth failures/session behavior, order and payment transitions, replayed idempotency keys, rounding, migration preservation, seed safety and the client/server contract. Existing API tests mock only the health query.
7. **Keep client API configuration aligned.** The Next proxy reads `SERVER_URL`; README and `client/.env.example` now document that setting. Revisit this when the API proxy or local service ports change.
8. **Finish product and v1 operational flows.** Wire search/category filters and availability, edit/void rules, settings-driven tax/receipt details, and reports breakdown/printing according to the agreed scope.
9. **Defer Electron work until v1 is ready to boot.** Electron currently clears localStorage/cookies/IndexedDB at startup, which erases locally persisted receipts, and always loads localhost. Leave the Electron boot/storage lifecycle for the v1 boot milestone; resolve it before v1 desktop use.

## Recommended implementation sequence

1. Resolve the migration and seed data-safety issues; establish an explicit backup/reset policy.
2. Decide on integer paisa and revise Prisma schema/migrations/API contracts, including `taxRateBps`.
3. Complete auth and session middleware; wire the login UI and protect routes.
4. Add product filters and API contract tests if needed by the checkout flow.
5. Implement order create/read/edit-or-void and payment endpoints. Use database transactions for receipt counter, order/items, payment transition, audit events, and idempotency record.
6. Switch client receipt/orders state to server queries and mutations; retain a deliberate offline/retry strategy for the single-counter deployment.
7. Build reports from persisted data, then finish settings and v1 web boot behavior.
8. When v1 is ready to boot, address Electron startup, storage preservation, and packaging as a dedicated milestone.

## API contract status

| Route | Current behavior | Status |
| --- | --- | --- |
| `GET /api` | Welcome metadata | Implemented |
| `GET /api/health` | API and database connectivity | Implemented |
| `GET /api/products` | List all products; no filters applied | Implemented |
| `POST /api/auth/login` | `{ staffId, pin }`, sets `pos_session` cookie | Partial; no client/session guard |
| `POST /api/auth/logout` | Clears cookie | Partial; no server token revocation |
| `POST /api/orders` | Create unpaid order | Missing |
| `GET /api/orders` / `GET /api/orders/:id` | Read orders | Missing |
| `POST /api/orders/:id/payments` | Mark paid / record manual tender | Missing |
| `GET /api/reports/session` | Session summary | Missing |

## Environment and local startup

- Server reads `server/.env` (or process environment): `NODE_ENV`, `PORT`, `DATABASE_URL`, `CLIENT_ORIGIN`. SQLite defaults to `server/data/cafe-pos.db` when `DATABASE_URL` is omitted.
- The Next proxy reads `SERVER_URL` and needs a base URL for the Express service (locally, `http://localhost:3000`). This is documented in both README and `client/.env.example`.
- The exploratory Vercel configuration gives the client service `SERVER_URL` through a service binding. It is not the production deployment plan; a Vercel deployment would need a persistent hosted database such as PostgreSQL rather than this local SQLite file.

## Maintenance note

When changing code, update the relevant flow/status here, product rules in `pos-spec.md`, and implemented/target decisions in `decisions.md`. Keep roadmap claims aligned with actual routes and client behavior. This guide is a navigation and status aid, not a substitute for reading the implementation when changing it.
