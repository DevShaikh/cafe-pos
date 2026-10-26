# Cafe POS — Product & UI Specification

**Version:** 2026.10.26
**Status:** Living product specification. The catalog API is connected. Receipt, payment, and reports flows are still local UI behavior. Login and settings pages are placeholders. See [`backend-plan.md`](backend-plan.md) for repository state and implementation priorities.
**Audience:** Implementers (human or AI). This file is the single source of truth.

---

## 1. Product overview

Cafe POS is a locally running, single-cashier point-of-sale application for a cafe. It is designed to run on a desktop (Electron window) at the counter.

### 1.1 What the cashier does

1. Start a new receipt.
2. Browse or search the menu and add items. (Search and category filters are visual only; not yet wired.)
3. Adjust quantities.
4. Choose order type (Dine in / Takeaway) — this is only a label.
5. Generate a receipt (it becomes unpaid and automatically prints to the 80mm thermal printer).
6. Edit and regenerate an unpaid receipt if the customer changes the order.
7. When the waiter returns with cash (or EasyPaisa / bank transfer confirmation), mark the receipt as paid.
8. Review paid order history for the current session.
9. Generate a session report.
10. Open Settings, account actions, and notifications.

### 1.2 Explicit non-goals (current phase)

- No table management.
- No free-text receipt label / customer name field.
- No reservations.
- No kitchen display or kitchen slip.
- No real payment gateway. Payment is always manual.
- No multi-user login for waiters.
- No inventory management, stock counts, or product editing screens.
- Receipt data is held in Zustand `persist` localStorage; there is no order/payment API yet. Electron currently clears that storage at startup.
- The client provides staff selection, PIN login, session checking, and main-view gating. Product and future order/payment API routes still need server-side authentication middleware.

### 1.3 Core mental model

```text
Draft cart  →  Generate receipt (prints)  →  Unpaid  →  (optional Edit / Regenerate)  →  Mark as paid
```

---

## 2. Confirmed product decisions

| #   | Topic             | Decision                                                                                          |
| --- | ----------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Payment lifecycle | Unpaid → Mark as paid. Cashier confirms cash / EasyPaisa / transfer outside the system.           |
| 2   | Order type        | Dine in / Takeaway is only a label stored on the receipt. No different workflows.                 |
| 3   | Tax               | Hard-coded percentage for now (default 8 %), rounded to 2 decimals.                               |
| 4   | Receipt label     | Dropped. No free-text “table / customer name” field.                                              |
| 5   | Product images    | Placeholders only (Coffee icon). Real photos later.                                               |
| 6   | Layout            | Collapsible left sidebar (shadcn) + right cart on desktop.                                        |
| 7   | Currency          | PKR. Display with `Intl.NumberFormat("en-PK", { minimumFractionDigits: 2 })`. Prefix `PKR`.       |
| 8   | Money arithmetic  | **UI:** Standard JavaScript numbers. **Backend:** Integer minor units (paisa) — see Backend Plan. |
| 9   | Users             | Cashier only. No waiter accounts.                                                                 |
| 10  | Day / session     | Session-oriented for the current UI phase.                                                        |
| 11  | Printing          | Receipts print automatically on generation. Uses `react-to-print` with an 80mm thermal template.  |

---

## 3. Application shell & layout

### 3.1 Desktop shell

- **Sidebar**: Collapsible (shadcn `collapsible="icon"`). Deep espresso/dark tone. Shows dynamic unpaid orders badge. Settings and User Profile pinned to bottom.
- **Navbar**: Thin utility strip. Shows page title, live clock, theme toggle, and cashier status.
- **Main Workspace**: Off-white background in light mode, warm espresso in dark mode. Page-level overflow is hidden, internal scrolling for grids.

---

## 4. Navigation & views

Primary views (Next.js App Router):

| View        | Route       | Purpose                                           |
| ----------- | ----------- | ------------------------------------------------- |
| New Receipt | `/catalog`  | Build and generate receipts                       |
| Orders      | `/orders`   | Unpaid list + Mark as paid + Paid today history   |
| Reports     | `/reports`  | Session summary metrics (Step 1 complete) + print |
| Settings    | `/settings` | Static settings UI                                |

---

## 5. View-specific content

### 5.1 New Receipt (default)

- Header row: "Add items quickly" + Search bar (visual only, not filtering yet).
- Category pills: Static, not filtering yet.
- Product grid of compact cards with hover states.
- Right-side cart panel: Order type toggle, line items, totals, Generate button.

### 5.2 Orders

- List of unpaid receipts with "Mark as paid" button and Print button.
- Section "Paid today" with a compact table.

### 5.3 Reports

- **Summary Cards**: Cash Collected, Paid Orders count, Average Order. All math derived from `status === "PAID"` receipts.
- **Sales by Order Type**: Dine-in vs Takeaway breakdown (Pending).
- **Print Report**: A4-style summary via `react-to-print` (Pending).

---

## 6. Current order / cart panel

- **Header**: Title "New receipt", Order Type Toggle (Dine in / Takeaway).
- **Line items**: Thumbnail, Name, Unit Price, Quantity stepper, Line total.
- **Totals**: Subtotal, Tax (8%), Total.
- **Primary action**: `Generate & Print receipt`. Disabled when empty. Instantly clears cart, prints, and resets state.

---

## 7. Receipt generation & order lifecycle

1. Cashier adds items and adjusts quantities.
2. Selects Dine in or Takeaway.
3. Clicks “Generate & Print receipt”.
4. System creates an unpaid receipt, triggers 80mm print job.
5. Receipt goes to Orders list, cart clears, search focuses.
6. Cashier marks as paid when money is received.

---

## 8. State model (current UI phase)

Using Zustand stores. `order.store.ts` uses `persist` middleware for localStorage.

```ts
type OrderType = "DINE_IN" | "TAKEAWAY";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Receipt = {
  id: string;
  receiptNumber: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: OrderType;
  status: "PAID" | "UNPAID";
  createdAt: string;
  paidAt: string | null;
};
```

Tax formula:

```text
tax = Math.round(subtotal * 0.08 * 100) / 100
total = subtotal + tax
```

---

## 9. Implementation phases

### Phase A — Foundation & shell (✅ Done)

### Phase B — Catalog & cart shell (✅ Done)

### Phase C — Order builder (✅ Done)

### Phase D — Orders & payment (✅ Done)

### Phase E — Reports & polish (🔄 In Progress)

- ✅ Reports Summary Cards
- ⏳ Reports Sales Breakdown
- ⏳ Print Report
- ⏳ Keyboard, focus, contrast polish

### Phase F — Backend wiring (🔄 In progress)

- See [`docs/backend-plan.md`](backend-plan.md) for the full architecture, schema, API contract, and phased execution plan.
- Implemented so far: SQLite/Prisma models and migrations, seed script, product list API, and partial server-side login/logout endpoints.
- Still missing: durable order and payment routes, server-side auth enforcement on business APIs, server-owned totals, idempotency, and reports from persisted data.

---

## 10. Change log

- 2026-10-21: Complete rewrite. Absorbed original domain insights, new UI/UX flow, all confirmed decisions, and speed-first layout refinements.
- 2026-10-26: Updated status to reflect Phase A-D completion, integrated automatic thermal printing flow, collapsible shadcn sidebar, fixed receipt selection, and Reports Summary Cards.
- 2026-10-26: Added the repository guide reference and clarified Phase F implementation status.
