# Cafe POS Local Agent Rules (Qwen 9B @ 76K Context)

## 1. CRITICAL FORMATTING & TOOL CALLS

- NO MULTIPLE TOOL CALLS AT ONCE: Execute one tool at a time, wait for the result, then evaluate before proceeding.
- Always output valid tool call XML structures immediately.
- DO NOT wrap tool calls in preambles, pleasantries, or explanations.
- Keep responses strictly technical and concise to preserve token space.
- Never use placeholder comments like "// rest of code remains the same". Write out the complete, updated code block for changes.

## 2. TECH STACK BOUNDARIES

- Client: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query.
- Server: Node.js 22.12+, Express, TypeScript, Zod validation.
- Database: SQLite via Prisma 7 (Keep schemas strict).
- Desktop: Electron window orchestration.

## 3. CORE CODEBASE SAFETY LAWS

- EXACT MATCH: When editing a file, never rewrite the entire file from scratch unless authorized. Use search/replace blocks to modify only the necessary lines.
- ENFORCE TYPE SAFETY: Do not use 'any' types. Always extend or implement types from `client/src/types/` or `server/src/schemas/`.
- MONOREPO FOCUS: When executing terminal commands or installing dependencies, always ensure you target the correct directory (`--prefix client` or `--prefix server`).
- DB CHANGES: If modifying the Prisma schema, always generate a migration (`npm run db:migrate --prefix server`) and update the seeds if necessary.
- NO BROKEN HOOKS: Adhere strictly to React 19 rules. Do not update state inside a `useEffect` layout loop.

## 4. CONTEXT HUSBANDRY

- When utilizing search or grep tools, restrict scans to target sub-folders (`client/` or `server/`) instead of querying the repository root.
- Ignore build artifacts, `node_modules`, `.next`, `dist`, and `electron/out` directories entirely when reading or editing code.
