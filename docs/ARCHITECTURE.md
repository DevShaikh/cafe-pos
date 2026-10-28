# Cafe POS — Architecture Overview
**Version:** 2026.10.27

**Status:** Canonical architecture document. See [](decisions.md) for locked decisions, [](pos-spec.md) for product behavior, and [](backend-plan.md) for implementation priorities and repository state.

## 1. Executive Summary
### 1.1 Deployment assumption
Cafe POS is a single-cashier point-of-sale application for cafe operations. The current V1 targets a local desktop deployment (Electron window), running client services at localhost and Express server at localhost:3000. SQLite backs data persistence. This architecture document describes the verified stack, component responsibilities, data flows, and phased roadmap.
- **Boot work:** Electron packaging is deferred until V1 reaches operational readiness.
- **Database:** SQLite file for single-cashier use. Vercel config was exploratory; PostgreSQL would be required only if v1 becomes a hosted multi-terminal service.
- **V1 target:** Single terminal desktop (Electron) using local services.
---
## 2. Technology Stack
| Layer        | Choice                                      | Rationale                                          |
| **Client UI** | Next.js 16 (App Router), React 19, TS       | Concurrent features, file-based routing, strong tooling. |
| **HTTP Client** | Axios                                         | Service-layer HTTP abstraction.                    |
| ------------- | ------------------------------------------- | -------------------------------------------------- |
| **Client Styling** | Tailwind v4 + shadcn/ui primitives          | Utility-first with semantic CSS variables; accessible components. |
| **State**     | Zustand (persist middleware)                | Lightweight store for cart/receipts in localStorage. TanStack Query for server cache. |
| **Server**    | Express 5, TypeScript                       | Minimalist, familiar for API development.          |
| **Validation**| Zod                                          | Request/response schema validation.                 |
| **Database**  | SQLite (via Prisma)                         | Simple file-backed persistence; migrations supported. |
---
## 3. Project Structure

```text
cafe-pos/
├─ client/                     # Next.js App Router UI
│   ├─ src/                    # Application source code
│   │   ├─ app/                # Route groups: (auth), (main), (api proxy)
│   │   ├─ components/         # layout/, modules/, providers/, generated shadcn-style ui/
│   │   ├─ store/              # Zustand cart and receipt state
│   │   ├─ hooks/              # Custom React hooks
│   │   ├─ types/              # Client API and order types
│   │   └─ lib/                # API client, product service/hooks, utils, Zod response schema
│   ├─ public/                 # Static assets (icons, logos)
│   ├─ .env.example           # Environment template (CLIENT_ORIGIN, SERVER_URL)
│   └─ package.json
├─ server/                     # Express TypeScript API
│   ├─ src/                    # Server source code
│   │   ├─ config/             # Zod environment parsing (.env → typed process.env)
│   │   ├─ routes/             # API route mounting (Express router registration)
│   │   ├─ controllers/        # HTTP request/response handling; forward errors to handler
│   │   ├─ services/           # Business/data operations (Prisma-backed)
│   │   ├─ schemas/            # Zod request validation bodies
│   │   ├─ middleware/         # logging, not-found and error handling
│   │   ├─ lib/                # Prisma client, SQLite URL resolution, utilities
│   │   └─ generated/          # Prisma client (generated from prisma/schema)
├─ docs/                       # Architecture documentation (this file!)
└─ .gitignore                  # VSCode ignore patterns; no node_modules or dist/
```

---

## 4. Data Flows
