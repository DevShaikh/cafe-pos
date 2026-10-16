# Cafe POS

A locally deployable cafe point-of-sale application, built as a TypeScript monorepo. The project is being developed in small phases so each layer can be understood and verified before the next is added.

## Project status

**Step 1 — Project initialization: complete.**

**Step 2 — PostgreSQL and backend foundation: in progress.** Prisma's Product schema, initial migration, and health/product API implementation are prepared. Applying the migration and verifying a real database connection requires a locally running PostgreSQL instance, which is not currently available in this environment. Order models, checkout, and POS UI remain out of scope.

## Technology

- **Client:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui (for UI components), ESLint
- **Server:** Node.js, Express, TypeScript, Zod
- **Database:** local PostgreSQL with Prisma ORM 7, a multi-file schema, and its PostgreSQL driver adapter
- **Tooling:** npm and Concurrently

The browser will communicate with the server over HTTP JSON APIs. Database access will remain on the server; the client will never connect directly to PostgreSQL.

## Repository layout

```text
.
├── client/                     # Next.js frontend
├── server/
│   ├── prisma/
│   │   ├── schema/             # Prisma 7 multi-file schema
│   │   └── migrations/         # Committed migration history
│   └── src/                    # Express API, services, and Prisma client
├── .github/
│   ├── copilot-instructions.md # Persistent project guidance
│   └── prompts/
│       └── plan-next-step.prompt.md
├── .gitignore
├── package.json                # Root development orchestration
└── README.md
```

Each application has its own `package.json` and TypeScript configuration. The root scripts coordinate the two applications without merging their dependencies.

## Prerequisites

- Node.js 20.9 or newer (use an active LTS release where possible)
- npm (installed with Node.js)
- Git
- PostgreSQL 9.6 or newer, running locally

## Getting started

From the repository root:

1. Install root and application dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Create local environment files from the examples:

   ```bash
   cp client/.env.example client/.env.local
   cp server/.env.example server/.env
   ```

   On Windows PowerShell, use `Copy-Item client/.env.example client/.env.local` and `Copy-Item server/.env.example server/.env`.

3. Edit `server/.env` and set `DATABASE_URL` to the credentials and database you created in your local PostgreSQL installation. The example file contains a deliberately non-working password placeholder.

4. Create the local database (for example, with PostgreSQL's `createdb cafe_pos` command or `CREATE DATABASE cafe_pos;` in `psql`), then generate the Prisma client and apply migrations:

   ```bash
   npm run db:generate --prefix server
   npm run db:migrate --prefix server
   ```

5. Start both applications:

   ```bash
   npm run dev
   ```

The Next.js development server uses `http://localhost:3000`. The Express server uses `http://localhost:4000`. The API allows browser requests from the configured `CLIENT_ORIGIN`, defaulting to `http://localhost:3000`. The server validates its required PostgreSQL connection string at startup; the health endpoint reports database connectivity.

To run just one application, use `npm run dev:client` or `npm run dev:server`. If port 3000 or 4000 is already in use, stop the conflicting process or configure a different available port; the server's `PORT` value is read from `server/.env`.

## Environment configuration

Environment templates are provided in `client/.env.example` and `server/.env.example`. Copy them to the local filenames above and keep local environment files out of version control. Never put credentials or server-only secrets in variables prefixed with `NEXT_PUBLIC_`; those values are exposed to client-side code.

The client uses `NEXT_PUBLIC_API_BASE_URL` as the base URL for future REST calls. The server uses `PORT` for its local listening port, `DATABASE_URL` for its PostgreSQL connection, and `CLIENT_ORIGIN` to configure CORS.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run client and server together; stop both when either exits |
| `npm run dev:client` | Run only Next.js |
| `npm run dev:server` | Run only Express |
| `npm run lint` | Lint both applications |
| `npm run typecheck` | Type-check both applications |
| `npm run build` | Build the client and compile the server |
| `npm test` | Run backend API tests |
| `npm run db:generate --prefix server` | Generate the Prisma client |
| `npm run db:validate --prefix server` | Validate the Prisma schema |
| `npm run db:migrate --prefix server` | Create/apply development migrations |
| `npm run db:status --prefix server` | Check migration status |
| `npm run db:seed --prefix server` | Opt in to insert demo products without changing existing rows |

Run commands from the repository root unless otherwise specified.

Prisma's multi-file schema is in `server/prisma/schema/`: `schema.prisma` contains the one generator and PostgreSQL datasource, and domain models live in their own files. The Prisma 7 configuration points to this directory and keeps migration history in `server/prisma/migrations/`. The generated client is shared by the backend and written to `server/src/generated/prisma/`; it is generated by the dev, build, type-check, and seed scripts.

Database credentials belong in the ignored `server/.env` file. `.env.example` contains only a placeholder. Seeding is never automatic: `npm run db:seed --prefix server` explicitly inserts three clearly labeled demo products. The seed uses fixed IDs and skips duplicates; it does not update or delete existing records.

## Roadmap

1. **Project initialization:** monorepo structure, app scaffolds, scripts, environment templates, and documentation.
2. **PostgreSQL and backend foundation:** verify local PostgreSQL, configure Prisma, define and migrate the initial Product schema, and implement validated backend health/product APIs with centralized error handling.
3. **Product catalog:** fetch products from the API and add responsive browsing, categories, search, and loading/error/empty states.
4. **Cart:** add Zustand cart state, quantity and removal actions, and display total calculations.
5. **Checkout and saved orders:** validate on the server, calculate authoritative totals from database prices, persist order snapshots transactionally, and show order history.
6. **Quality and polish:** add appropriate automated tests, accessibility and responsive checks, and operational/security documentation.

No later-phase feature should be started before its phase is approved.

## Architecture principles

- Keep request handlers focused on HTTP coordination; business rules belong in services.
- Validate untrusted API input with Zod.
- Use Prisma for server-side database access once database work begins.
- Keep TypeScript strict and avoid `any`.
- Store money in decimal-safe database types and preserve charged product name/price snapshots on order items.
- Keep environment-specific configuration outside source code and never commit credentials.
- Use shadcn/ui for frontend components. Put reusable colors in global theme tokens in `client/app/globals.css` and use semantic tokens rather than repeating custom color values in multiple components.
- Prefer the smallest implementation that supports the current phase; do not add accounts, inventory, branches, or unrelated infrastructure to the initial scope.

## Backend API (Step 2)

All routes are under `/api`. Successful responses use JSON; validation and service errors use an `{ "error": { "code": "...", "message": "..." } }` envelope.

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Check whether the API can reach PostgreSQL. Returns `200` when connected and `503` when unavailable. |
| `GET /api/products` | List available products, ordered by category then name. |
| `GET /api/products?search=latte&category=Coffee` | Filter by case-insensitive name/description search and exact category. |
| `GET /api/products?includeUnavailable=true` | Include unavailable products in the list. |
| `GET /api/products/:id` | Fetch a product by UUID. |
| `POST /api/products` | Create a product after validating the JSON body. |

Example create body:

```json
{
  "name": "Flat White",
  "description": "Double espresso with steamed milk",
  "price": "4.50",
  "category": "Coffee",
  "imageUrl": "https://example.com/flat-white.jpg"
}
```

Prices are sent and returned as decimal strings to avoid treating JavaScript floating-point numbers as authoritative money values. Product availability defaults to `true`. The initial schema intentionally contains only `Product`; order models and checkout are reserved for their roadmap steps.

## Troubleshooting

- If an npm command is blocked by local PowerShell execution policy, run the corresponding `npm.cmd` command from PowerShell.
- If npm reports a dependency or lockfile issue, run `npm install` in the affected package directory and review the resulting lockfile changes.
- Check that the configured client and server ports are available before starting both apps.

## Verification notes

- Step 1 lint, type-check, build, and combined development startup checks passed.
- Step 2 backend lint, type-check, and the five API tests passed.
- Prisma Client generation and Prisma schema validation passed.
- An initial Product migration SQL file was generated from the schema without connecting to a database.
- Local PostgreSQL connectivity, migration application, and live database-backed API behavior are **not verified** because this environment has no PostgreSQL service, client, listener, or `DATABASE_URL`.
- The prior Step 1 client dependency audit reported five high-severity findings in the Next.js ESLint tooling dependency chain (`fast-glob` → `micromatch` → `braces`). npm's suggested automatic fix downgraded the Next.js ESLint config to 14.2.35, so the project kept it aligned with Next.js 16.4.2 instead.
