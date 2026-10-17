# Cafe POS project instructions

## Purpose and current scope

Build a simple, reliable, locally deployable cafe point-of-sale application in small, verifiable phases. Follow the approved roadmap in the root `README.md`. Work only on the phase the user has approved; do not jump ahead.

The current phase is **Step 2 — PostgreSQL and backend foundation**. Do not add product UI, cart behavior, checkout, or order models until their roadmap steps are explicitly approved.

## Required stack

- `client/`: Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui (Radix UI where appropriate), Zustand, Zod, React Hook Form when forms are introduced, Lucide React, and Framer Motion for restrained animation.
- `server/`: Node.js, Express, TypeScript, REST JSON APIs, Zod validation, and modular routes/controllers/services/middleware as those features are implemented.
- Keep client application source under `client/src/`. Keep backend shared configuration, Prisma access, middleware, and utilities under `server/src/config/`, `server/src/lib/`, `server/src/middleware/`, and `server/src/utils/`; organize each implemented API feature under `server/src/modules/<feature>/`.
- Database: local PostgreSQL and Prisma ORM 7 only. Use Prisma's supported PostgreSQL driver adapter. Never add MongoDB or Mongoose.
- Keep the Prisma 7 multi-file schema under `server/prisma/schema/`, with the single generator and datasource in `schema.prisma` and models separated by domain. Preserve the existing migration directory and do not reset or delete migration history.
- Tooling: npm, Git, ESLint, and Concurrently.

Use stable compatible releases and preserve the existing package/app structure.

## Architecture and quality

- The browser talks to the backend through HTTP; never connect the browser directly to PostgreSQL.
- Keep business logic out of route handlers. Use services for reusable business operations and Prisma for server-side queries.
- Validate untrusted request data with Zod. Report errors explicitly; do not silently swallow failures or return success-shaped fallbacks.
- Keep TypeScript strict. Avoid `any` unless it is demonstrably necessary and explained.
- Keep secrets and environment-specific settings out of source control. Never commit local environment files or credentials.
- Use decimal-safe monetary representations in the database; do not use floating-point arithmetic as the authoritative source of money.
- Preserve product name and unit-price snapshots for items on completed orders.
- Prefer focused, readable changes that match existing naming, formatting, and patterns. Avoid unrelated features and new infrastructure.
- Use shadcn/ui as the component library when building frontend UI. Define any reusable theme colors as global CSS theme tokens in `client/src/app/globals.css` and consume those tokens instead of repeating custom color values in components.
- Do not add order models, order APIs, checkout, or POS screens before their approved roadmap steps.
- Update directly related documentation when scripts, dependencies, configuration, or behavior change.

## Working agreement

- Inspect relevant files before editing; preserve useful existing configuration.
- Before a non-trivial change, summarize the files to be created or modified.
- Make changes only within the approved phase and explain important architectural choices in beginner-friendly language.
- Run the smallest relevant lint, type-check, build, or test command and report the actual result. Do not claim unrun checks or database connectivity.
- If a requirement is ambiguous and affects architecture or behavior, ask before choosing a consequential option.
