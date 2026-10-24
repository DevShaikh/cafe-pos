# Cafe POS

A locally run point-of-sale application for a single cafe counter. This is a learning and portfolio project: the current client supports product browsing, a local receipt cart, receipt creation, and manual payment tracking. It is not yet a complete production POS.

The detailed behavior and remaining requirements are in [`docs/pos-spec.md`](docs/pos-spec.md). Architectural and business decisions are summarized in [`docs/decisions.md`](docs/decisions.md). Those documents describe current implementation separately from planned behavior.

## Current capabilities and limits

- The catalog requests products from the Express API and renders product cards.
- The search field and category/filter controls are visual only; they do not filter products.
- A product can be added to the in-memory cart. Quantities can be changed and items removed.
- Checkout calculates an 8% tax, creates an unpaid receipt in Zustand, increments its receipt number, and clears the cart.
- Orders are stored in browser `localStorage`; they are not written to the backend database. Marking an unpaid receipt as paid is a manual status update.
- Receipt generation attempts to invoke the browser print flow using `react-to-print` and an 80mm template. This is not silent printer integration; it requires browser/desktop print support. The current receipt selection uses a potentially stale React render value, so verify this flow before relying on printed receipts.
- Reports and Settings are placeholders. Login is a visual placeholder and does not authenticate users. Edit/regenerate of an unpaid receipt is not implemented.
- Product prices are returned by the API as decimal strings. Current cart calculations convert those values to JavaScript numbers and back to integer paisa; integer-only money handling is a documented target that the current UI has not fully reached.

## Stack and runtime

| Area | Technology and role |
| --- | --- |
| Client | Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/Radix UI |
| Client data | TanStack Query fetches server products; Zustand stores the cart and receipts |
| API | Node.js, Express 5, TypeScript, Zod, REST JSON |
| Database | SQLite via Prisma 7 and `better-sqlite3`; currently stores products only |
| Desktop shell | Electron loads the local Next.js client |

## Setup

Requirements: Node.js 20.9+ and npm. No separate database service is needed.

```bash
git clone https://github.com/DevShaikh/cafe-pos.git
cd cafe-pos
npm install
npm install --prefix client
npm install --prefix server
```

Create `server/.env` if you need to override defaults (the file is ignored by Git):

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:3001
# Optional; defaults to file:./data/cafe-pos.db, relative to server/
# DATABASE_URL=file:./data/cafe-pos.db
```

Initialize the local database and demo products:

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

The seed command adds 20 demo products and is designed to be safe to rerun. Start the web app and API together:

```bash
npm run dev
```

- Client: <http://localhost:3001>
- API welcome: <http://localhost:3000/>
- Health: <http://localhost:3000/api/health>
- Products: <http://localhost:3000/api/products>

The Electron development window can be started separately after the client is running:

```bash
npm run desktop
```

Electron currently loads the local client URL; this is a development shell, not a packaged offline deployment.

## Routes and request flow

The root client route redirects to `/catalog`. The main shell has `/catalog`, `/orders`, `/reports`, and `/settings`; `/login` exists as a static auth placeholder. Sidebar links navigate to the four main routes.

For products, the catalog calls `useProducts` (TanStack Query), which calls `product.service.ts`, then the Axios `apiClient` configured by `NEXT_PUBLIC_API_URL`. The Express API mounts `/api/products`; the route calls a controller, which calls the Prisma-backed product service. API product prices are serialized as decimal strings. The response is cached by TanStack Query in the client.

For checkout, product-card actions update the Zustand cart. `ReceiptPanel` derives subtotal, 8% tax, and total; `order.store.ts` creates an unpaid receipt with a UUID, timestamp, and sequential number starting at 1001. The order store persists receipts and the next number under the `cafe-pos-orders` localStorage key. The cart is in memory only. The Orders page selects unpaid and paid receipts from the same store; `markAsPaid` adds a paid timestamp. Neither cart nor receipts currently use server persistence.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run client and server concurrently |
| `npm run dev:client` / `npm run dev:server` | Run one development process |
| `npm run lint` | Lint client and server |
| `npm run typecheck` | Type-check client and server |
| `npm run build` | Build client and server |
| `npm test` | Run server tests |
| `npm run verify` | Run lint, typecheck, and tests |
| `npm run db:migrate --prefix server` | Create/apply development migrations |
| `npm run db:migrate:deploy --prefix server` | Apply existing migrations for deployment |
| `npm run db:seed --prefix server` | Seed demo products |
| `npm run db:status --prefix server` | Show migration status |
| `npm run desktop` | Open Electron shell |

## Repository map

```text
client/src/app/                 Next App Router pages and route groups
client/src/components/layout/   Sidebar, header, and application shell
client/src/components/modules/  Product cards and receipt/print UI
client/src/components/providers/Theme and TanStack Query providers
client/src/components/ui/       Shared UI primitives and theme toggle
client/src/lib/hooks/           Client query hooks
client/src/lib/services/        Axios client and API service functions
client/src/lib/schemas/         Zod client schemas and inferred types
client/src/store/               Zustand cart and order stores
client/src/types/               API response and receipt types
server/src/routes/              Express route mounting
server/src/controllers/         HTTP request/response adapters
server/src/services/            Product and health business/data operations
server/src/schemas/             Zod request schemas
server/src/middleware/          Logging, not-found, and error handling
server/prisma/schema/           Prisma generator/datasource and model files
server/prisma/migrations/       SQLite migration history
server/seeds/                   Demo product seed
electron/main.cjs               Desktop window entry point
docs/                           Product specification and decisions
```

## Roadmap snapshot

See the specification for feature-level status. The shipped implementation is a foundation and first POS workflow, with several partial phases:

| Area | Current status |
| --- | --- |
| Backend foundation and product API | Implemented: health and product-list endpoints, SQLite product model, seed |
| App shell and theme | Partial: shell, navigation, theme toggle; static user/session details |
| Product catalog | Partial: remote list and cards; search/category/filter controls are not wired |
| Cart and receipt creation | Partial: local cart, quantities, tax, unpaid receipt creation; money conversion uses JS numbers |
| Orders and payments | Partial: persisted local order list and manual mark-paid; edit/regenerate is absent |
| Printing | Integrated browser print attempt; printer/device workflow and latest receipt selection need validation |
| Reports, settings, authentication, server-side orders | Not implemented beyond placeholders/foundation |

## Troubleshooting

- If `better-sqlite3` reports missing bindings, rebuild it in the server package: `npm rebuild better-sqlite3 --prefix server`.
- If the database has no products, run the migration and seed commands above.
- Ensure `NEXT_PUBLIC_API_URL` points to the API origin (for local development, `http://localhost:3000/api`) and `CLIENT_ORIGIN` matches the client origin.
- Keep `.env` files and `server/data/` local; they are not intended for source control.

## License

Private / portfolio project. See repository for details.
