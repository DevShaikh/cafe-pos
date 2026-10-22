# Cafe POS — Product & UI Specification

**Version:** 2026.10.24  
**Status:** Living specification. Phases A-D and automatic printing are complete. Phase E is in progress.  
**Audience:** Implementers (human or AI). This file is the single source of truth.

This document supersedes `docs/pos-ui-plan.md` and the earlier UI/UX Flow Specification. It incorporates the final product decisions, the speed-first layout direction, and enough detail that external screenshots are no longer required.

---

## 1. Product overview

Cafe POS is a locally running, single-cashier point-of-sale application for a cafe. It is designed to run on a desktop (Electron window) at the counter.

### 1.1 What the cashier does

1. Start a new receipt.
2. Browse or search the menu and add items.
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
- No free-text receipt label / customer name field (dropped for now).
- No reservations.
- No kitchen display or kitchen slip.
- No real payment gateway. Payment is always manual; the cashier only confirms it.
- No multi-user login for waiters. Only the cashier uses the system.
- No inventory management, stock counts, or product editing screens in the first implementation passes.
- No database persistence of receipts yet (using Zustand `persist` localStorage as a bridge). Persistence comes later with the existing Express + Prisma backend.
- No authentication implementation yet (NextAuth will be wired later). Login page is visual only.

### 1.3 Core mental model

```text
Draft cart  →  Generate receipt (prints)  →  Unpaid  →  (optional Edit / Regenerate)  →  Mark as paid
```

- Generating a receipt does **not** mean the money has been received.
- “Mark as paid” is a manual confirmation that cash (or transfer) has been received.
- Only paid receipts count toward “Cash collected” and session reports.

---

## 2. Confirmed product decisions

| #   | Topic             | Decision                                                                                                                        |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Payment lifecycle | Unpaid → Mark as paid. Cashier confirms cash / EasyPaisa / transfer outside the system, then marks paid.                        |
| 2   | Order type        | Dine in / Takeaway is only a label stored on the receipt. No different workflows or tracking.                                   |
| 3   | Tax               | Hard-coded percentage for now (default 8 %). Will become configurable later.                                                    |
| 4   | Receipt label     | Dropped. No free-text “table / customer name” field.                                                                            |
| 5   | Product images    | Placeholders only (category icon or simple colored surface). Real photos later.                                                 |
| 6   | Layout            | Compact left sidebar + right cart on desktop. Speed-first: maximise product grid visibility on New Receipt.                     |
| 7   | Currency          | PKR. Display with `Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", currencyDisplay: "code" })` → `PKR 120.00`. |
| 8   | Money arithmetic  | Always convert to whole paisa (integer) for calculations. Never use JavaScript floating-point decimals.                         |
| 9   | Users             | Cashier only. No waiter accounts.                                                                                               |
| 10  | Day / session     | Session-oriented for the current UI phase. End-of-day close + receipt number reset can be added later.                          |
| 11  | Printing          | Receipts print automatically on generation. Uses `react-to-print` with an 80mm thermal template.                                |

---

## 3. Design principles (speed-first)

1. **One primary screen does most of the work.** New Receipt is the heart of the application.
2. **One-tap add.** Clicking a product card adds one unit. Quantity steppers exist for corrections.
3. **Minimal taps to generate a receipt.** Add items → (optionally change type) → Generate & Print.
4. **Cart always visible** on the New Receipt view (desktop).
5. **Stable positions.** Product cards must not jump when filters change or while loading.
6. **Large targets.** Buttons and interactive cards are at least 44 × 44 px.
7. **No confirmation dialogs for normal actions.** Only destructive actions (Clear order) ask for confirmation.
8. **After generate, clear the cart immediately** and focus the search box so the next order can start at once.
9. **Compact chrome.** Sidebar is narrow; maximise space for products.
10. **Calm visual language.** Professional register, not playful. Warm coral/orange accent, deep charcoal sidebar, soft gray background, white content surfaces.

---

## 4. Visual design system

### 4.1 Color & theme

- Use semantic tokens from shadcn/ui + CSS variables in `globals.css`.
- Primary accent: warm coral / orange (already present in the project).
- Sidebar: deep charcoal / navy.
- Page background: soft cool gray.
- Content cards: white / near-white with subtle border and radius.
- Support both light and dark mode via `next-themes`. All colors must come from tokens; no hard-coded hex in components.

### 4.2 Typography

- One self-hosted sans-serif family (Geist Sans is already in use).
- Clear hierarchy: page title, section labels, body, captions, prices.
- Prices use the accent color and are always clearly legible.

### 4.3 Spacing & density

- Compact density overall.
- Product cards are tight enough to show multiple rows without scrolling on a typical 1440 × 900 window.
- Generous enough whitespace that the interface does not feel cramped.
- Consistent radius (use the design-token radius).

### 4.4 Components

Prefer shadcn/ui primitives:

- Button, Card, Badge, Input, ToggleGroup, DropdownMenu, Dialog, Table, Separator, ScrollArea, Tooltip, etc.

Icons: Lucide React.

Utility: `cn()` for class merging.

---

## 5. Application shell & layout

### 5.1 Desktop shell (primary)

```text
┌─────────────────────────────────────────────────────────────┐
│  Application shell (fixed height, no page scroll)           │
│  ┌──────────┬─────────────────────────────────────────────┐ │
│  │          │  Header (context label, date, actions)      │ │
│  │  Slim    ├─────────────────────────────────────────────┤ │
│  │  left    │                                             │ │
│  │  sidebar │  Main content area                          │ │
│  │          │  (changes with active view)                 │ │
│  │  - New   │                                             │ │
│  │  - Orders│                                             │ │
│  │  - Menu  │                                             │ │
│  │  - Reports                                             │ │
│  │          │                                             │ │
│  │  ─────── │                                             │ │
│  │  Settings│                                             │ │
│  │  User    │                                             │ │
│  └──────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- The whole application lives inside a single shell with one border, subtle shadow and consistent radius.
- `main` fills the viewport height. Page-level overflow is hidden.
- Internal scrolling is allowed only inside the product grid, order lists, etc.
- Minimum recommended window: 1000 × 650 (already set in Electron). Target comfortable size: 1280–1440 wide.

### 5.2 Sidebar rules

- Narrow. Prefer icons + short labels. On very narrow widths, icons only.
- Active item uses the primary accent background / foreground.
- Inactive items use muted foreground.
- Orders shows a small badge with the count of unpaid receipts when > 0.
- Bottom section: Settings, then the current user (avatar + name + role). Clicking the user opens Account settings / Sign out.
- Theme toggle can live near the bottom or in the user menu.

### 5.3 New Receipt view layout (most important)

```text
┌──────────┬────────────────────────────────┬──────────────────┐
│          │  Header + search + categories  │  Cart panel      │
│  Slim    ├────────────────────────────────┤  (fixed)         │
│  sidebar │                                │                  │
│          │  Product grid (scrolls)        │  Order type      │
│          │                                │  Line items      │
│          │                                │  Totals          │
│          │                                │  Generate btn    │
└──────────┴────────────────────────────────┴──────────────────┘
```

- Product grid and cart are the absolute focus.
- Cart is always visible on the right and does not scroll away.
- Product grid scrolls independently.
- Sidebar stays slim so the grid can show as many cards as possible.

### 5.4 Responsive behaviour (later polish)

- Desktop: sidebar + content + cart side-by-side.
- Tablet: keep two-column if possible.
- Mobile: hide desktop cart; show a compact order-summary bar that opens a bottom sheet. Bottom navigation or collapsible sidebar.

---

## 6. Navigation & views

Primary views (controlled by Next.js App Router):

| View        | Route       | Purpose                                         |
| ----------- | ----------- | ----------------------------------------------- |
| New Receipt | `/catalog`  | Build and generate receipts                     |
| Orders      | `/orders`   | Unpaid list + Mark as paid + Paid today history |
| Menu        | `/products` | Browse-only catalog (Not currently in sidebar)  |
| Reports     | `/reports`  | Session summary + print                         |
| Settings    | `/settings` | Static settings UI                              |

No “Reservations” view.

### 6.1 Header (shared)

- Small uppercase context label (e.g. “CASHIER STATION · LIVE SESSION”).
- Main title that changes with the view.
- Optional short supporting text.
- Right side: Theme Toggle + current user control.

Notifications popover:

- Title “Notifications”.
- Empty state: “No new notifications. Your register is up to date.”
- Unread indicator when needed.
- Does not navigate away.

User dropdown:

- Account settings
- Sign out

### 6.2 View-specific content

#### New Receipt (default)

- Title area: “Ready for the next receipt” or “Edit receipt #XXXX” when editing.
- Search input with icon.
- Category controls (ToggleGroup or segmented buttons): All items + the categories present in the data.
- Product grid of compact cards.
- Right-side cart panel (see section 7).

#### Orders

- Header shows unpaid total.
- List of unpaid receipts (most recent first).
  Each item: receipt number, order type, generated time, total, Edit button, Mark as paid button.
- Section “Paid today” with a compact table: Receipt · Type · Paid at · Total.

#### Menu

- Browse-only product grid (no add actions).
- Title, short description, total item count.
- Same card visual language as New Receipt but without quantity controls.

#### Reports

- Three summary cards: Cash collected, Paid orders count, Average order value.
- Sales by order type (Dine in / Takeaway) with counts and amounts.
- “Print report” button (browser print dialog or print-friendly view).
- Only paid receipts are included in cash collected and averages.

#### Settings (`/settings`)

Static UI sections:

1. Cafe profile (name, location/register label)
2. Receipt defaults (default order type, tax display)
3. Printer (name/status, Test print)
4. Notifications preferences
5. Account & permissions (cashier name, role, Sign out)

No persistence yet.

---

## 7. Current order / cart panel

Visible only on the New Receipt view (desktop).

### 7.1 Header

- Title: “New receipt” or “Edit receipt #XXXX”
- Optional three-dot menu:
  - Clear current order (asks for confirmation if items exist)
  - Print preview (static preview only; does not mark paid or save)

### 7.2 Order type

Compact ToggleGroup:

- Dine in
- Takeaway

Selected state is visually obvious. Default can be “Dine in”.

### 7.3 Line items

Each line:

- Small thumbnail or category placeholder
- Product name
- Optional short detail
- Unit price
- Quantity stepper (− / quantity / +)
- Line total

Quantity rules:

- Minus never goes below 1. To remove, use an explicit remove control or decrease to zero then remove.
- Plus increases by 1.
- Changing quantity updates totals immediately.

### 7.4 Totals

- Subtotal
- Tax (hard-coded %)
- Total (prominent)

All money values formatted as `PKR X.XX`.

### 7.5 Primary action

- New order: `Generate & Print receipt · PKR XX.XX`
- Editing: `Regenerate receipt · PKR XX.XX`
- Disabled when the cart is empty.
- After successful generate/regenerate:
  - Cart is cleared
  - Receipt number increments (for new receipts)
  - 80mm Thermal receipt automatically triggers browser print dialog
  - Search box is focused
  - For regenerate, the same receipt number is kept and the unpaid record is updated

---

## 8. Product catalog behaviour

### 8.1 Data shape (matches existing API)

```ts
type Product = {
  id: string; // UUID
  name: string;
  description: string | null;
  price: string; // "120.00"
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
```

### 8.2 Fetching

- Currently loads from `GET /api/products` via TanStack Query.
- Client-side filter by category and search is still preferred because a cafe menu is small.

### 8.3 Product card (New Receipt)

- Placeholder visual (category icon or colored surface) when `imageUrl` is null.
- Name
- Short detail / description (one line, truncated)
- Price in accent color
- Clear “add” affordance (card click or explicit + button)
- Clicking the card (or +) adds one unit to the cart.
- If the product is already in the cart, quantity increases.
- Unavailable products are either hidden or shown in a disabled state (prefer hide by default).

### 8.4 Search & categories

- Search filters by name and description (case-insensitive).
- Empty state: clear message “No menu items match your search.”
- Category tabs: “All items” + unique categories from the data.
- Active category uses primary styling.
- Filtering never clears the cart.

---

## 9. Receipt generation & order lifecycle

### 9.1 New receipt

1. Cashier adds items and adjusts quantities.
2. Selects Dine in or Takeaway.
3. Clicks “Generate & Print receipt”.
4. System creates an unpaid receipt with the next sequential number.
5. System fires the 80mm thermal print job.
6. Receipt is added to the unpaid list in Orders.
7. Cart is cleared.
8. Search is focused for the next order.

### 9.2 Edit & regenerate

1. From Orders, cashier clicks Edit on an unpaid receipt.
2. Items and order type are loaded into the cart.
3. View switches to New Receipt with title “Edit receipt #XXXX”.
4. Primary button becomes “Regenerate receipt · PKR XX.XX”.
5. Cashier changes items / quantities / type.
6. Clicking Regenerate **updates the same receipt number** (no duplicate).
7. Receipt remains unpaid until explicitly marked paid.

### 9.3 Mark as paid

1. From Orders, cashier clicks “Mark as paid”.
2. Receipt moves from unpaid to “Paid today”.
3. Paid-at timestamp is recorded.
4. Unpaid total and reports update immediately.
5. The record is never deleted from session history.

### 9.4 Receipt number

- Sequential integer within the current session (starts at 1001).
- Later (with backend) it can become day-scoped or persistent.

---

## 10. State model (current UI phase)

Using Zustand stores, with `persist` middleware for orders until the database is wired.

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
  subtotalPaisa: number;
  taxPaisa: number;
  totalPaisa: number;
  orderType: OrderType;
  status: "PAID" | "UNPAID";
  createdAt: string;
  paidAt: string | null;
};
```

All money calculations must use integer paisa. Convert only for display.

Tax formula (hard-coded):

```text
taxPaisa = Math.round(subtotalPaisa * 0.08)
totalPaisa = subtotalPaisa + taxPaisa
```

---

## 11. Reports

Derived only from **paid** receipts in the current session:

- Cash collected = sum of paid totals
- Paid order count
- Average order value
- Breakdown by order type (count + amount for Dine in and Takeaway)

Print report:

- Uses browser print dialog or a simple print-friendly view.
- Include session date, cashier name (static for now), the metrics above, and open/unpaid count + value for completeness.

Unpaid receipts never contribute to “Cash collected”.

---

## 12. Accessibility requirements

- Semantic landmarks: `main`, `header`, `nav`, `section`, `aside`.
- Every icon-only button has an accessible name (`aria-label`).
- Images have meaningful `alt` or empty `alt` if decorative.
- Full keyboard support for navigation, search, quantity controls, primary actions, dropdowns.
- Visible focus rings.
- Do not rely on colour alone for state (active, paid, unpaid).
- Minimum touch target 44 × 44 px.
- Respect `prefers-reduced-motion`.

---

## 13. Implementation phases

### Phase A — Foundation & shell

- ✅ Application shell with compact left sidebar
- ✅ Theme tokens, light/dark
- ✅ Active view switching
- ✅ Header with theme toggle
- ✅ Settings route (static)

### Phase B — Catalog & cart shell

- ✅ Product data layer (TanStack Query)
- ✅ Product grid with placeholders, categories
- ✅ Cart panel shell (order type, empty state, totals, disabled Generate button)

### Phase C — Order builder

- ✅ Full cart logic (add, increment, decrement, remove, clear)
- ✅ Live totals with tax
- ✅ Generate receipt → moves to unpaid
- ✅ 80mm automatic printing
- ✅ Clear cart after generate

### Phase D — Orders & payment

- ✅ Unpaid list
- ✅ Mark as paid → move to Paid today
- ✅ Persistence via Zustand `persist` (localStorage)

### Phase E — Reports & polish

- ⏳ Session report metrics (Current Task)
- ⏳ Print report
- ⏳ Keyboard, focus, contrast, reduced-motion pass

### Phase F — Backend wiring (later)

- ⏳ Replace local state with Express + Prisma endpoints
- ⏳ Persist receipts and line items
- ⏳ NextAuth session
- ⏳ Real product images and configurable tax

---

## 14. File & folder conventions (client)

```text
client/src/
  app/
    (main)/
      catalog/page.tsx      → New Receipt (default route)
      orders/page.tsx
      reports/page.tsx
      settings/page.tsx
    layout.tsx
    globals.css
  components/
    layout/                 → Layout wrapper, Sidebar, Navbar
    modules/
      receipt-panel.tsx     → Right side cart
      product-card.tsx      → Individual menu items
      print-receipt.tsx     → Hidden 80mm thermal template
    ui/                     → shadcn primitives
  store/                    → cart.store.ts, order.store.ts
  lib/
    hooks/                  → product.hooks.ts
    services/               → api-client.ts, product.service.ts
    utils.ts                → formatPKR, cn
  types/                    → index.ts
```

---

## 15. Acceptance checklist

A build is complete for the pure UI phase when:

- [x] Desktop POS fits in a fixed viewport without page-level scrolling.
- [x] Compact left sidebar + right cart on New Receipt.
- [x] Product cards are compact; multiple rows visible.
- [x] One-tap (or clear +) adds an item; quantity steppers work.
- [x] Generate receipt creates an unpaid receipt, prints, and clears the cart.
- [x] Mark as paid moves the receipt to Paid today.
- [x] No backend writes for receipts yet (using localStorage).
- [x] All money is handled in paisa integers and displayed as `PKR X.XX`.
- [x] Light and dark themes work via tokens.
- [x] Reports only count paid receipts.
- [ ] Print report works (browser dialog is enough).

---

## 16. Change log

- 2026-10-21: Complete rewrite. Absorbed original domain insights, new UI/UX flow, all confirmed decisions, and speed-first layout refinements. Screenshots no longer required.
- 2026-10-24: Updated status to reflect Phase A-D completion, integrated automatic thermal printing flow, and updated state model to reflect Zustand persist bridging.
