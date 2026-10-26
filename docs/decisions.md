# Locked Decisions

Quick reference for core architectural and business logic decisions.

| Decision                    | Reason                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Currency (UI)**           | PKR, displayed as `PKR 1,200.00`. Standard JavaScript numbers.                                                |
| **Currency (Backend)**      | All money stored and transported as **integer minor units (paisa)**. No floats. 1 PKR = 100 paisa.            |
| **Print Workflow**          | Receipts are printed immediately upon generation (before payment). Matches real counter workflow.             |
| **Print Library**           | `react-to-print` with a custom 80mm thermal template.                                                         |
| **Order State (Current)**   | Persisted via Zustand `persist` (localStorage) until backend Phase F is implemented.                          |
| **Client/Server State**     | Zustand handles local state (cart, orders). TanStack Query handles server state (products).                   |
| **Order Type**              | `DINE_IN` and `TAKEAWAY` only. Label only; does not affect pricing or tax.                                    |
| **Styling**                 | Tailwind CSS v4 with semantic CSS variables (`@theme inline`). Collapsible sidebar uses shadcn/ui primitives. |
| **Tax (Current UI)**        | Hardcoded at 8%. Rounded to the nearest 2 decimals: `Math.round(subtotal * 0.08 * 100) / 100`.                |
| **Tax (Backend)**           | Stored as basis points (`taxRateBps`, e.g. 800 = 8%). Calculated server-side.                                 |
| **Receipt Numbers**         | **Server-generated** inside a transaction. Never client-side. Format: `<prefix>-<counter>` (e.g. `R-1001`).   |
| **Idempotency**             | `POST /orders` and `POST /orders/:id/payments` require an `Idempotency-Key` header to prevent duplicates.     |
| **Backend Source of Truth** | The server is the source of truth for orders, payments, and totals. The client only caches.                   |
| **Currency Formatting**     | Uses `formatPrice` in `lib/utils.ts`.                                                                         |
