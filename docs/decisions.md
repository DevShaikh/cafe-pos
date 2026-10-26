# Locked Decisions

Quick reference for core architectural and business logic decisions.

| Decision                    | Reason                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Currency (UI)**            | Display PKR with two decimals; cart and local receipt calculations use integer paisa (100 paisa = 1 PKR).      |
| **Currency (Backend)**       | Persist and transport money as integer minor units (paisa). Product prices and order/payment schema fields use integers; the product API sends `pricePaisa`. |
| **Database (v1)**            | SQLite for the local, single-cashier deployment. Vercel configuration was exploratory and is not a production hosting commitment. Revisit PostgreSQL if v1 becomes hosted/shared across terminals. |
| **JWT Secret**                | `JWT_SECRET` must be at least 32 characters and is required in production. There is no hardcoded signing fallback; development login needs a configured secret. |
| **Print Workflow**          | Receipts are printed immediately upon generation (before payment). Matches real counter workflow.             |
| **Print Library**           | `react-to-print` with a custom 80mm thermal template.                                                         |
| **Order State (Current)**   | Zustand `persist` in browser localStorage; version migration converts old decimal-PKR receipts to integer paisa. Electron currently clears localStorage on startup. |
| **Client/Server State**     | Zustand handles local state (cart, orders). TanStack Query handles server state (products).                   |
| **Order Type**              | `DINE_IN` and `TAKEAWAY` only. Label only; does not affect pricing or tax.                                    |
| **Styling**                 | Tailwind CSS v4 with semantic CSS variables (`@theme inline`). Collapsible sidebar uses shadcn/ui primitives. |
| **Tax (Current UI)**        | Hardcoded at 800 basis points (8%). Tax is rounded to the nearest paisa: `Math.round(subtotalPaisa * 800 / 10000)`. |
| **Tax (Backend)**           | Store rates as basis points (`taxRateBps`, e.g. 800 = 8%). Order/payment API calculations are not implemented yet. |
| **Receipt Numbers (target)** | Generate on the server within the order transaction, formatted `<prefix>-<counter>`. **Not implemented:** current UI increments a local number. |
| **Idempotency (target)**    | Require `Idempotency-Key` for order creation/payment. A database model exists, but no middleware/service or endpoints use it. |
| **Backend Source of Truth (target)** | Server owns orders, payments, and totals. **Current:** browser Zustand store owns receipts and payment state. |
| **Currency Formatting**     | Uses `formatPrice` in `lib/utils.ts`.                                                                         |
