# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** The catalog is connected to the API. Staff can sign in through the client and the main UI checks the server session; order and payment data still run in browser state. Phase F is in progress. See [`docs/backend-plan.md`](docs/backend-plan.md) for the verified implementation state and priorities.

---

## What it does

The cashier uses the system to:

1. Build a receipt from the menu.
2. Choose order type (Dine in / Takeaway — label only).
3. Generate a receipt → it becomes **unpaid**, is automatically sent to the 80mm thermal printer, and the cart resets instantly.
4. Edit and regenerate an unpaid receipt if the order changes.
5. When the waiter returns with cash (or EasyPaisa / transfer confirmation), **mark the receipt as paid**.
6. Review paid history and generate a session report.

Payment is always manual. The app only records that the cashier confirmed the money was received.

Full product rules, layout, and acceptance criteria live in [`docs/pos-spec.md`](docs/pos-spec.md).  
Quick locked decisions: [`docs/decisions.md`](docs/decisions.md).  
Current architecture, implemented flows, gaps, and backend plan: [`docs/backend-plan.md`](docs/backend-plan.md).

---

## Tech stack

| Layer                | Technologies                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Client**           | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **State Management** | Zustand (client cart & orders), TanStack Query (server products)          |
| **Printing**         | `react-to-print` (80mm thermal receipt template)                          |
| **Server**           | Node.js, Express, TypeScript, Zod                                         |
| **Database**         | SQLite (single local file) with Prisma 7                                  |
| **Desktop**          | Electron (loads the Next.js client)                                       |

---

## Getting started

You need **Node.js 20.9+** and npm. No separate database server is required.

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
    app/         App Router pages: (main)/catalog, (main)/orders, (main)/reports, (main)/settings
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

## Roadmap

| Phase | Focus                                                       | Status         |
| ----- | ----------------------------------------------------------- | -------------- |
| **A** | Application shell, sidebar, theme, view switching            | ✅ Implemented |
| **B** | Product catalog and cart UI                                  | ✅ Implemented |
| **C** | Local receipt generation and thermal print template          | ✅ UI only     |
| **D** | Local unpaid/paid order views                                 | ✅ UI only     |
| **E** | Reports and accessibility polish                              | 🔄 Partial     |
| **F** | Persisted orders, payment API, authentication, recovery       | 🔄 In Progress |
