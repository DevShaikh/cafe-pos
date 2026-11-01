# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** Staff login, cashier sessions, server-backed checkout and payments, order history, summary reports, authenticated product/category management, and expense tracking are implemented. Historical receipts may still exist only in browser storage. Settings are a placeholder. See [`project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md`](project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) for current progress and priorities; verify behavior against source before changing it.

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
| **Printing**         | `react-to-print` (80mm thermal receipt template)                          |
| **Server**           | Node.js, Express, TypeScript, Zod                                         |
| **Database**         | SQLite (single local file) with Prisma 7                                  |
| **Desktop**          | Electron (loads the Next.js client)                                       |

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
- Electron preserves browser storage and clears only the previous login cookie on startup, so staff must enter a PIN after each app launch. Legacy local receipts should remain stored; survival across a real desktop restart is not yet verified. Electron is not yet a self-contained offline installer.
- A known `1234` administrator PIN is created by the seed when no admin exists. Do not treat the seeded account as production-ready.
- Backups, restoration, and critical checkout/payment behavior have not been operationally tested.

See the [project status and technical roadmap](project-audit/PROJECT-STATUS-AND-TECHNICAL-ROADMAP.md) for prioritized next work and verification status. See [`docs/backend-plan.md`](docs/backend-plan.md) for the API map and implementation details.
