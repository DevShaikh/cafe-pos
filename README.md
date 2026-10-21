# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** Backend foundation and product list API are done. UI is being rebuilt against the new product & layout specification (`docs/pos-spec.md`).

---

## What it does

The cashier uses the system to:

1. Build a receipt from the menu (search + categories).
2. Choose order type (Dine in / Takeaway — label only).
3. Generate a receipt → it becomes **unpaid**.
4. Edit and regenerate an unpaid receipt if the order changes.
5. When the waiter returns with cash (or EasyPaisa / transfer confirmation), **mark the receipt as paid**.
6. Review paid history and generate a session report.

Payment is always manual. The app only records that the cashier confirmed the money was received.

Full product rules, layout, and acceptance criteria live in **[`docs/pos-spec.md`](docs/pos-spec.md)**.  
Quick locked decisions: **[`docs/decisions.md`](docs/decisions.md)**.

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Client** | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| **Server** | Node.js, Express, TypeScript, Zod |
| **Database** | SQLite (single local file) with Prisma 7 |
| **Desktop** | Electron (loads the Next.js client) |

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

`CLIENT_ORIGIN` must match the address the client runs on.  
The database is created at `server/data/cafe-pos.db` by default. To use another location:

```env
DATABASE_URL=file:./path/to/cafe-pos.db
```

### 3. Set up the database

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

The seed adds 20 demo products and is safe to run again.

### 4. Run the app

```bash
npm run dev
```

- Client: http://localhost:3001  
- API: http://localhost:3000/api  

Optional desktop window (start `npm run dev` first):

```bash
npm run desktop
```

---

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start client and server together |
| `npm run dev:client` / `npm run dev:server` | Start one of them |
| `npm run lint` | Lint client and server |
| `npm run typecheck` | Type-check client and server |
| `npm run build` | Build client and server |
| `npm test` | Run server tests |
| `npm run db:migrate --prefix server` | Create or apply database migrations |
| `npm run db:seed --prefix server` | Add the demo products |
| `npm run db:status --prefix server` | Show migration status |
| `npm run desktop` | Open the app in an Electron window |

---

## API (current)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | Welcome message |
| GET | `/api/health` | API and database status |
| GET | `/api/products` | List products |

Prices are returned as strings with two decimals (e.g. `"120.00"`). The client formats them as `PKR 120.00`.

---

## Project layout

```text
client/          Next.js app (src/app, components, store, lib)
electron/        Electron window for the desktop version
server/
  prisma/        Schema and migrations
  seeds/         Demo data
  src/           Express app: routes, controllers, services, schemas
docs/
  pos-spec.md    Full product & UI specification (source of truth)
  decisions.md   Locked decisions (quick reference)
```

---

## Roadmap

Aligned with `docs/pos-spec.md`:

| Phase | Focus |
|-------|--------|
| **A** | Application shell, compact sidebar, theme, view switching, Settings & Login (static) |
| **B** | Product catalog (placeholders, categories, search) + cart panel shell |
| **C** | Order builder (add/qty/totals/tax) + Generate receipt → unpaid |
| **D** | Orders view: edit/regenerate, Mark as paid, paid history |
| **E** | Session reports, print, accessibility & polish |
| **F** | Backend wiring (persist receipts, NextAuth, real images, configurable tax) |

Backend foundation (SQLite, product API) is already in place.

---

## Troubleshooting

- **"Could not locate the bindings file" (better-sqlite3)**  
  Your npm blocked the driver’s install script. Run:

  ```bash
  npm rebuild better-sqlite3 --prefix server
  ```

  If it is still blocked, run `npm install-scripts approve better-sqlite3` inside `server/` and rebuild.

- **Database missing or empty**  
  Run the two commands in step 3 of Getting started.

- **Keep private**  
  `.env` files and the `server/data/` folder are never committed.

---

## License

Private / portfolio project. See repository for details.
