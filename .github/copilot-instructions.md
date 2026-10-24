# Cafe POS repository instructions

## Purpose and sources of truth

Build a locally deployable, single-cashier cafe point-of-sale application in small, reviewable steps. Respect the user's requested scope and ask before taking a consequential product or architecture decision that is not already documented.

- [`docs/pos-spec.md`](../docs/pos-spec.md): current implementation, desired workflow, roadmap, and known gaps.
- [`docs/decisions.md`](../docs/decisions.md): domain and architecture decisions plus implementation differences.
- [`README.md`](../README.md): setup, commands, endpoints, and repository map.

Do not treat a planned feature in the spec as implemented. Current progress is partial across the UI workflow; see the spec's roadmap table before describing status.

## Current architecture

- `client/`: Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn/Radix UI, Zustand, TanStack Query, Zod, Lucide React.
- `server/`: Node.js, Express 5, TypeScript, REST JSON API, Zod, Prisma 7, SQLite, `better-sqlite3` adapter.
- `electron/`: development desktop shell that loads the local Next.js UI. Do not assume packaged/offline deployment or direct printer access.
- Client routes: `/catalog`, `/orders`, `/reports`, `/settings`, and static `/login`; `/` redirects to `/catalog`.
- Product data flow: UI -> TanStack Query hook -> product service -> Axios client -> `/api/products` -> Express route/controller/service -> Prisma -> SQLite. Product prices are serialized as two-decimal strings.
- Local workflow: product cards -> Zustand in-memory cart -> receipt calculation/generation -> Zustand order store persisted in localStorage -> unpaid/paid order views. No server-side order API currently exists.
- Use the existing project folder boundaries. Do not create `server/src/modules/`.

## Current capability caveats

- Catalog search/category/filter controls are visual only; availability is not enforced in the current grid.
- Reports and Settings are placeholders. Login does not authenticate. Editing/regenerating receipts is absent.
- Receipt printing uses `react-to-print` and browser print UI. Current latest-receipt selection reads a stale render value after a store update, and a timeout can race print preparation.
- The currency helper accepts paisa, but the product card currently passes the rupee amount directly. Cart money also uses JS numbers. Follow the documented integer-paisa target when working on this area and fix related conversions coherently.
- The API welcome endpoint is `/`; `/api` has no welcome route. Health and products are under `/api`.

## Required stack and project constraints

- Before editing Next.js code, read the relevant guide in `client/node_modules/next/dist/docs/`; `client/AGENTS.md` contains the local Next.js-specific instruction. `cacheComponents` and `partialPrefetching` are enabled in `client/next.config.ts`.
- Client structure: `app/`, `components/ui/`, `components/layout/`, `components/modules/`, `components/providers/`, `store/`, `lib/`, and `types/`.
- Server structure: `config/`, `lib/`, `middleware/`, `routes/`, `controllers/`, `services/`, `schemas/`, and `utils/`; seed files live in `server/seeds/`.
- Keep the Prisma 7 multi-file schema in `server/prisma/schema/`: generator/datasource in `schema.prisma`, domain models in separate files. Create migrations with `npm run db:migrate --prefix server`; preserve history and do not reset/delete migrations without approval.
- Database is local SQLite by default at `server/data/cafe-pos.db`; never commit the database or environment files. `PORT` defaults to 3000, `CLIENT_ORIGIN` to `http://localhost:3001`, and an optional `DATABASE_URL` must be a SQLite `file:` URL.
- Use compatible dependencies and preserve existing package structure. npm may block install scripts; native packages must be explicitly approved through the repository's `allowScripts` workflow.

## Architecture and quality rules

- The browser talks to the backend through HTTP only; never connect client code directly to SQLite/Prisma.
- Keep routes for URL mapping, controllers for HTTP adaptation, services for reusable business/data operations, and Prisma queries on the server.
- Validate untrusted request values with Zod. Do not silently swallow errors or return success-shaped fallbacks.
- API success shape is `{ success: true, message?, data? }`; errors are `{ error: { code, message, issues? } }` through the shared error middleware. `AppError` argument order is status code, error code, message.
- Keep client product data aligned with the API: UUID string id, string price, nullable description/image URL, ISO timestamp strings, category, and availability. Maintain one Zod schema as the source for the client `Product` type.
- Money source of truth is integer paisa. Convert API rupee strings once at a clear boundary, retain integer amounts through cart/receipt operations, and format at display boundaries. Do not use JS float arithmetic as money truth.
- Preserve product name and unit-price snapshots in completed receipt lines so future product changes do not rewrite history.
- Keep TypeScript strict; avoid `any` unless necessary and explained.
- Use `cn()` from `@/lib/utils`. Define theme colors as CSS semantic tokens in `client/src/app/globals.css` and consume tokens rather than repeating arbitrary colors.
- Prefer focused changes that match current naming and formatting. Update directly related docs when behavior, scripts, dependencies, or configuration changes.

## UI direction

- Desktop/counter-first shell with sidebar and main workspace.
- Catalog should keep a scrollable product area and visible receipt panel at desktop widths.
- Optimize checkout for few taps, clear pricing, accessible controls, visible focus, and stable layouts. Do not assume the current interface already meets every target.
- Support light/dark theme using existing tokens and `next-themes`.

## Working agreement

- Inspect relevant source and documentation before editing. Summarize intended files for substantial changes.
- Work only within the user's requested scope; do not jump into a later roadmap feature without approval.
- Do not run tests or other checks unless the user asks to test/verify. If they ask, run the smallest relevant check and report the exact command/result; never imply a check ran when it did not.
- Explain material behavior changes and architectural choices clearly. Treat assumptions as assumptions.
