# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** The application includes staff PIN login, cashier sessions, server-backed checkout/payments, order history, reports, product/category management, expense tracking, tax settings, and a Windows desktop packaging path. The current installer is **not release-ready**: a packaged first-run setup smoke test succeeded, but the next authenticated session check returned 401, and browser-based verification has not been authorized. Backup restoration and physical receipt-printer output also remain unverified. See [`project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`](project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) for current progress and priorities.

---

## What it does

The cashier uses the system to:

1. Sign in with a staff PIN and open a cashier session.
2. Maintain categories and menu products from the Menu screen; unavailable products remain in history but are excluded from checkout.
3. Add products to a cart and choose an order type (Dine in / Takeaway; label only).
4. Submit the order. The server validates current product data, calculates totals, saves an unpaid order, and returns receipt data for browser printing.
5. Record payment for a server-backed order after the cashier confirms cash or another manual payment method.
6. Review paginated orders and summary sales reports.
7. Record cafe purchases and calculate total expenses for selected dates and categories.
8. Configure tax and select 58mm or 80mm receipt paper; create or restore a manual local backup from Settings.

Payment is manual; the app records the cashier's confirmation and selected method. Editing, voiding, refunds, and cash reconciliation are not implemented. Legacy device-saved receipts remain separate from server orders.

Full product rules, layout, and acceptance criteria live in [`docs/pos-spec.md`](docs/pos-spec.md).  
Quick locked decisions: [`docs/decisions.md`](docs/decisions.md).  
Current architecture, implemented flows, gaps, and backend plan: [`docs/backend-plan.md`](docs/backend-plan.md).

---

## Tech stack

| Layer                | Technologies                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Client**           | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **State Management** | Zustand (cart and legacy local receipts), TanStack Query (server data)      |
| **Printing**         | `react-to-print` (configurable 58mm/80mm receipt template)                |
| **Server**           | Node.js, Express, TypeScript, Zod                                         |
| **Database**         | SQLite (single local file) with Prisma 7                                  |
| **Desktop**          | Electron (starts the packaged local Next.js client and Express API)       |

---

## Getting started

Use **Node.js 22.12+** and npm. This minimum aligns with the currently locked Electron and Prisma package engine requirements. No separate database server is required.

### 1. Clone and install

```bash
git clone https://github.com/DevShaikh/cafe-pos.git
cd cafe-pos
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Configure the server

Create `server/.env` (it is ignored by Git):

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:3001
JWT_SECRET=<paste-a-random-secret-of-at-least-32-characters>
```

Generate a local secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and replace the placeholder. Production startup requires `JWT_SECRET`; development can start without it, but login will return a configuration error until it is set.

### 3. Configure the client API proxy

Create `client/.env.local` so the Next.js API proxy can reach Express:

```env
SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 4. Set up the database

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

### 5. Run the app

```bash
npm run dev
```

- Client: http://localhost:3001
- API: http://localhost:3000/api

---

## Project layout

```text
client/          Next.js app
  src/
    app/         App Router pages: (main)/catalog, (main)/products, (main)/orders, (main)/reports, (main)/expenses, (main)/settings
    components/  layout/ (Sidebar, Navbar), modules/ (ProductCard, ReceiptPanel, PrintReceipt), ui/ (shadcn)
    lib/         hooks/ (product.hooks), services/ (api-client, product.service), utils.ts
    store/       cart.store.ts, order.store.ts
    types/       index.ts (shared types)
electron/        Electron window for the desktop version
server/
  prisma/        Schema and migrations
  seeds/         Demo data
  src/           Express app: routes, controllers, services, schemas
docs/
  pos-spec.md       Product behavior and acceptance criteria
  decisions.md      Current decisions, with implementation status
  backend-plan.md   Repository map, actual flows, risks, and next steps
```

---

## Current gaps

- Catalog search/category filters are wired; unavailable products are clearly marked and cannot be added to a receipt.
- Product and category maintenance is available at `/products`. Product records are retained and can be marked unavailable; categories with assigned products cannot be deleted.
- Expense tracking is available at `/expenses`: authenticated staff can save purchases in SQLite with a category, amount, date/time, and optional note; filtered totals are calculated across all matching records.
- Expense records are currently append-only; correcting or removing a saved entry is not yet supported.
- Settings management, stock/inventory tracking, order editing/voiding/refunds, and cash reconciliation are not implemented.
- Electron now has a Windows NSIS packaging path, bundles a Node runtime, starts the local services, uses a per-install JWT secret, and provisions the first administrator through the app instead of a default seeded PIN. The package has not passed the full login/session smoke test, so do not treat it as ready to install for a cafe.
- Settings provides local database-and-product-photo backup/restore controls. Backup creation was smoke-tested, but end-to-end restore and recovery have not been verified.
- The packaged setup API returned success during a smoke test, but the subsequent authenticated `/auth/me` request returned 401 in a PowerShell cookie-session test. Chromium/Electron cookie behavior has not been verified; browser testing was declined.
- 58mm/80mm receipt sizing is configurable, but output has not been tested with physical printer drivers.
- The Windows installer currently builds unsigned and uses Electron's default icon. Installation, upgrade, and real desktop restart behavior still need acceptance testing.
- The whole client lint command still reports the pre-existing `react-hooks/set-state-in-effect` issue on the Expenses page; targeted changed-file lint passed.

See the [project status and technical roadmap](project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) for prioritized next work and verification status. See [`docs/backend-plan.md`](docs/backend-plan.md) for the API map and implementation details.

### Windows packaging

The current packaging command is `npm run package:win`; it builds a Windows x64 NSIS installer under `artifacts/`. It requires the development/build dependencies but the intended installed application bundles its Node runtime and local services. This packaging path is still under validation and the generated installer is unsigned; do not distribute it as a production release until the authentication/session smoke test and backup/restore acceptance checks pass.
