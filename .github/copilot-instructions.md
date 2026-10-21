# Cafe POS project instructions

## Purpose and current scope

Build a simple, reliable, locally deployable cafe point-of-sale application in small, verifiable phases. Work only on the phase the user has approved; do not jump ahead.

**Source of truth:** [`docs/pos-spec.md`](../docs/pos-spec.md)  
**Locked decisions:** [`docs/decisions.md`](../docs/decisions.md)

### Roadmap (from pos-spec.md)

| Phase              | Focus                                                                                | Status  |
| ------------------ | ------------------------------------------------------------------------------------ | ------- |
| Backend foundation | SQLite, Express, `GET /api/products`                                                 | Done    |
| **A**              | Application shell, compact sidebar, theme, view switching, Settings & Login (static) | Next    |
| **B**              | Product catalog (placeholders, categories, search) + cart panel shell                | Pending |
| **C**              | Order builder (add/qty/totals/tax) + Generate receipt → unpaid                       | Pending |
| **D**              | Orders: edit/regenerate, Mark as paid, paid history                                  | Pending |
| **E**              | Session reports, print, accessibility & polish                                       | Pending |
| **F**              | Backend wiring (persist receipts, NextAuth, real images, configurable tax)           | Later   |

Do not implement a later phase until the current one is approved. The pure UI phases (A–E) use local React/Zustand state only — no localStorage, no receipt DB writes, no auth logic.

### Core product model

- Payment is manual (cash / EasyPaisa / transfer). The cashier only confirms it.
- Dine in / Takeaway is a label only.
- Tax is hard-coded for now.
- No free-text receipt label, no table management, no kitchen slip.

## Required stack

- `client/`: Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn/ui with the `radix-nova` style (Radix UI through the `radix-ui` package, so use `asChild`), Zustand, Zod, Lucide React. Add React Hook Form when forms are introduced and Framer Motion only for restrained animation. Use `cn` from `@/lib/utils` (it re-exports the `cn` package).
- This Next.js version has breaking changes. Before writing client code, read the relevant guide in `client/node_modules/next/dist/docs/` (see `client/AGENTS.md`). `cacheComponents` and `partialPrefetching` are enabled in `client/next.config.ts`.
- `server/`: Node.js, Express 5, TypeScript, REST JSON APIs, Zod validation. Requests flow `routes/` → `controllers/` → `services/`.
- Client layout under `client/src/`: `app/` (route groups `(auth)` and `(main)`), `components/ui/` (shadcn), `components/layout/`, `components/modules/<feature>/`, `components/providers/`, `store/`, `lib/`, `types/`.
- Server layout under `server/src/`: `config/`, `lib/`, `middleware/`, `routes/`, `controllers/`, `services/`, `schemas/`, `utils/`. Seed data lives in `server/seeds/`. Do not create `server/src/modules/`.
- Database: a local SQLite file through Prisma ORM 7 and the `better-sqlite3` driver adapter. The file is `server/data/cafe-pos.db` by default; it is gitignored and must never be committed. Never add PostgreSQL, MongoDB, or Mongoose.
- Keep the Prisma 7 multi-file schema under `server/prisma/schema/`, with the single generator and datasource in `schema.prisma` and models separated by domain. Create migrations with `npm run db:migrate --prefix server`. Preserve migration history; do not reset or delete it without approval.
- Desktop: an Electron shell (`electron/main.cjs`) exists for development only. Do not add packaging or installers until approved.
- Tooling: npm, Git, ESLint, and Concurrently. npm blocks dependency install scripts by default. A new native dependency needs `npm install-scripts approve <package>`, which records it under `allowScripts` in `package.json`; commit that change.

Use stable compatible releases and preserve the existing package/app structure.

## Architecture and quality

- The browser talks to the backend through HTTP only; never connect the browser directly to the database.
- Keep business logic out of route handlers and controllers. Use services for reusable business operations and Prisma for server-side queries.
- Validate untrusted request data with Zod. Report errors explicitly; do not silently swallow failures or return success-shaped fallbacks.
- API contract. Success: `{ success: true, message?, data? }`. Errors: `{ error: { code, message, issues? } }`, produced by throwing `AppError(statusCode, code, message)` and handled by the error middleware. Note the argument order: status, code, message.
- Money. `price` is a Prisma `Decimal`. SQLite stores it as a floating-point number underneath, so do money arithmetic in application code with `Decimal`, never with SQL `SUM`. The API sends prices as strings with two decimals (for example `"120.00"`). Never use JavaScript floating-point numbers as the source of truth for money. Convert to whole **paisa** (integer) for arithmetic; display with `Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", currencyDisplay: "code" })` → `PKR 120.00`. The database and API do not include the currency prefix.
- Preserve product name and unit-price snapshots for items on completed orders.
- Client types must match the API: `id` is a UUID string, `price` is a string, `description` and `imageUrl` are nullable, dates arrive as ISO strings, and products include `category` and `isAvailable`. Keep one Zod schema as the single source for the client `Product` type; do not duplicate it.
- Keep TypeScript strict. Avoid `any` unless it is demonstrably necessary and explained.
- Keep secrets and environment-specific settings out of source control. Never commit local environment files. `server/.env` is optional (`PORT` defaults to **3000**, `CLIENT_ORIGIN` defaults to `http://localhost:3001`, and an optional SQLite `DATABASE_URL` such as `file:./data/cafe-pos.db`).
- Use shadcn/ui as the component library. Define reusable theme colors as global CSS theme tokens in `client/src/app/globals.css` and consume those tokens instead of repeating custom color values in components.
- Prefer focused, readable changes that match existing naming, formatting, and patterns. Avoid unrelated features and new infrastructure.
- Update directly related documentation when scripts, dependencies, configuration, or behavior change.

## Layout direction (Phase A+)

- Compact left sidebar (icons + short labels) + main content.
- On New Receipt: product grid scrolls; cart stays fixed on the right.
- Fixed viewport height; no page-level scroll. Internal scroll only inside grids/lists.
- Speed-first: one-tap add, minimal taps to generate, large targets (≥44 px).

## Working agreement

- Inspect relevant files before editing; preserve useful existing configuration.
- Before a non-trivial change, summarize the files to be created or modified.
- Make changes only within the approved phase and explain important architectural choices in beginner-friendly language.
- Run the smallest relevant check and report the actual result: `npm run typecheck`, `npm run lint`, `npm test`, or a build. Do not claim unrun checks or database connectivity.
- If a requirement is ambiguous and affects architecture or behavior, ask before choosing a consequential option.
