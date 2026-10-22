# Locked Decisions

Quick reference for core architectural and business logic decisions.

| Decision                | Reason                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Currency**            | PKR, displayed as `PKR 1,200.00`.                                                                                                                                           |
| **Arithmetic**          | Always convert to whole **paisa integers** for math. Avoid floats entirely. Format only at the display layer.                                                               |
| **Print Workflow**      | Receipts are printed immediately upon generation (before payment). Matches real counter workflow: customer receives receipt when order is placed; payment is settled later. |
| **Print Library**       | `react-to-print` with a custom 80mm thermal template.                                                                                                                       |
| **Order State**         | Persisted via Zustand `persist` (localStorage) to survive reloads until backend Phase F is implemented.                                                                     |
| **Client/Server State** | Zustand handles local state (cart, orders). TanStack Query handles server state (products).                                                                                 |
| **Order Type**          | `DINE_IN` and `TAKEAWAY` only. Label only; does not affect pricing or tax.                                                                                                  |
| **Styling**             | Tailwind CSS v4 with semantic CSS variables (`@theme inline`). No hardcoded colors in components; use `bg-background`, `text-primary`, etc.                                 |
