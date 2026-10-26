# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** Phases A–E (UI/UX) are nearly complete. The core checkout loop, automatic thermal printing, order management, and collapsible sidebar are fully functional. The next major milestone is **Phase F (Backend Wiring)**.

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
Backend architecture and execution plan: [`docs/backend-plan.md`](docs/backend-plan.md).

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
```

### 3. Set up the database

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

### 4. Run the app

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
  pos-spec.md       Full product & UI specification (source of truth)
  decisions.md      Locked decisions (quick reference)
  backend-plan.md   Backend architecture & phased execution plan
```

---

## Roadmap

| Phase | Focus                                                       | Status         |
| ----- | ----------------------------------------------------------- | -------------- |
| **A** | Application shell, compact sidebar, theme, view switching   | ✅ Done        |
| **B** | Product catalog + cart panel shell                          | ✅ Done        |
| **C** | Order builder + Generate receipt (unpaid)                   | ✅ Done        |
| **D** | Orders view: Mark as paid, paid history                     | ✅ Done        |
| **E** | Session reports, print, accessibility & polish              | 🔄 In Progress |
| **F** | **Backend wiring** (database, auth, API, offline hardening) | ⏳ Pending     |
