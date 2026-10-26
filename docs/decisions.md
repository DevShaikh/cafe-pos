# Locked Decisions

Quick reference for core architectural and business logic decisions.

| Decision                | Reason                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Currency**            | PKR, displayed as `PKR 1,200.00`. No Paisa integers are used. All math is standard JavaScript numbers, rounded safely at the point of display/storage. |
| **Print Workflow**      | Receipts are printed immediately upon generation (before payment). Matches real counter workflow.                                                      |
| **Print Library**       | `react-to-print` with a custom 80mm thermal template.                                                                                                  |
| **Order State**         | Persisted via Zustand `persist` (localStorage) to survive reloads until backend Phase F is implemented.                                                |
| **Client/Server State** | Zustand handles local state (cart, orders). TanStack Query handles server state (products).                                                            |
| **Order Type**          | `DINE_IN` and `TAKEAWAY` only. Label only; does not affect pricing or tax.                                                                             |
| **Styling**             | Tailwind CSS v4 with semantic CSS variables (`@theme inline`). Collapsible sidebar uses shadcn/ui primitives.                                          |
| **Tax**                 | Currently hardcoded at 8%. Rounded to the nearest 2 decimals: `Math.round(subtotal * 0.08 * 100) / 100`.                                               |
| **Currency Formatting** | Uses `formatPrice` (renamed from `formatPKR`) in `lib/utils.ts`.                                                                                       |
