# Locked Decisions

Quick reference for core architectural and business logic decisions.

| Decision                    | Reason                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Currency (UI)**           | PKR, displayed as `PKR 1,200.00`. Standard JavaScript numbers.                                                |
| **Currency (Backend target)** | Store and transport all money as integer minor units (paisa). 1 PKR = 100 paisa. **Not implemented:** current Prisma models use `Float` and product API returns decimal strings. |
| **Print Workflow**          | Receipts are printed immediately upon generation (before payment). Matches real counter workflow.             |
| **Print Library**           | `react-to-print` with a custom 80mm thermal template.                                                         |
| **Order State (Current)**   | Zustand `persist` in browser localStorage. Electron currently clears localStorage on startup, so this is not durable in desktop mode. |
| **Client/Server State**     | Zustand handles local state (cart, orders). TanStack Query handles server state (products).                   |
| **Order Type**              | `DINE_IN` and `TAKEAWAY` only. Label only; does not affect pricing or tax.                                    |
| **Styling**                 | Tailwind CSS v4 with semantic CSS variables (`@theme inline`). Collapsible sidebar uses shadcn/ui primitives. |
| **Tax (Current UI)**        | Hardcoded at 8%. Rounded to the nearest 2 decimals: `Math.round(subtotal * 0.08 * 100) / 100`.                |
| **Tax (Backend target)**    | Store as basis points and calculate server-side. **Not implemented:** schema currently has `taxRate Float`; no order API exists. |
| **Receipt Numbers (target)** | Generate on the server within the order transaction, formatted `<prefix>-<counter>`. **Not implemented:** current UI increments a local number. |
| **Idempotency (target)**    | Require `Idempotency-Key` for order creation/payment. A database model exists, but no middleware/service or endpoints use it. |
| **Backend Source of Truth (target)** | Server owns orders, payments, and totals. **Current:** browser Zustand store owns receipts and payment state. |
| **Currency Formatting**     | Uses `formatPrice` in `lib/utils.ts`.                                                                         |
