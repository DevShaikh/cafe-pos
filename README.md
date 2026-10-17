# Cafe POS

Locally deployable cafe point-of-sale application. Development follows the phases below; work only on the currently approved phase.

## Stack

- **Client:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- **Server:** Node.js, Express, TypeScript, Zod
- **Database:** PostgreSQL with Prisma ORM 7 and the PostgreSQL driver adapter
- **State and tooling:** Zustand (when cart work begins), npm, ESLint, Concurrently

The client communicates with the server over HTTP. PostgreSQL is accessed only by the server.

## Structure

```text
client/
  src/
    app/                 # Next.js App Router
    components/
    hooks/
    lib/
    store/
    types/
  public/
  .env.example
server/
  prisma/
    schema/              # Prisma 7 multi-file schema
  seeds/
  src/
    config/
    controllers/
    lib/
    middleware/
    routes/
    schemas/
    services/
    utils/
    app.ts
    app.test.ts
    server.ts
  .env                   # Local only; ignored by Git
  package.json
  tsconfig.json
.github/
  copilot-instructions.md
  prompts/plan-next-step.prompt.md
package.json
README.md
```

## Local setup

Prerequisites: Node.js 20.9 or newer, npm, Git, and a local PostgreSQL installation.

1. Install dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Copy the client template and create `server/.env` locally:

   ```powershell
   Copy-Item client/.env.example client/.env.local
   ```

   Configure `server/.env` with `NODE_ENV`, `PORT`, `DATABASE_URL`, and `CLIENT_ORIGIN`. Keep credentials private; `.env` files are ignored by Git.

3. Start PostgreSQL and create a local database named `cafe_pos`.

4. Validate/generate the Prisma client and apply pending migrations:

   ```bash
   npm run db:validate --prefix server
   npm run db:generate --prefix server
   npm run db:migrate --prefix server
   ```

5. Start the client and server together:

   ```bash
   npm run dev
   ```

The client uses port `3000` by default. The server port and allowed client origin are configured in `server/.env`.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and server |
| `npm run dev:client` / `npm run dev:server` | Start one application |
| `npm run lint` | Lint both applications |
| `npm run typecheck` | Type-check both applications |
| `npm run build` | Build both applications |
| `npm test` | Run server tests |
| `npm run db:status --prefix server` | Check Prisma migration status |
| `npm run db:seed --prefix server` | Explicitly run the configured seed |

## Current scope

The backend currently provides `GET /api/health` for checking PostgreSQL connectivity. The Prisma schema defines the Product model; product APIs and catalog UI are not yet part of the current implementation. Order models, cart, checkout, and order history remain for later approved phases.

When building frontend UI, use shadcn/ui. Put reusable colors in global theme tokens in `client/src/app/globals.css` and use those tokens rather than repeating custom colors in components.

## Roadmap

1. Project initialization
2. PostgreSQL and backend foundation
3. Product catalog
4. Cart
5. Checkout and saved orders
6. Quality and polish
