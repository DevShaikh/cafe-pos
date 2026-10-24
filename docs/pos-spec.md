# Cafe POS: Product Specification and Implementation Map

**Reviewed:** 2026-10-22
**Status:** Living document. It records the current implementation and the intended product behavior separately. Code is the source for current behavior; product decisions here are the target unless explicitly marked implemented.

## 1. Product context

Cafe POS is intended to be a locally deployable, single-cashier point-of-sale tool for a cafe counter. Its core workflow is to select products, prepare an order, issue a receipt, and later record that payment was received. The cashier confirms payment outside the app (cash, EasyPaisa, or bank transfer); there is no payment gateway.

The repository currently contains a Next.js client, an Express API, a SQLite product database, and a development Electron shell. Only product data is currently backed by the API/database. The cart is in memory, while receipts are persisted in browser localStorage.

## 2. Current implementation at a glance

| Feature | Status | Current behavior |
| --- | --- | --- |
| Main shell | Partial | Sidebar, header, theme toggle, and route shell exist. Cashier/session labels are static. |
| Catalog | Partial | Product list is fetched from the API and rendered. Search, categories, and filter controls are visual only. Availability is not currently used to hide/disable cards. |
| Cart | Implemented locally | Add product, increase/decrease quantity, remove item, clear on receipt generation. Not persisted. |
| Price and tax | Partial | Product API returns prices as decimal strings; cart converts to JS numbers. Receipt math rounds item prices to paisa and applies fixed 8% tax. This does not yet meet integer-only source-of-truth decision. |
| Receipt generation | Partial | A receipt is saved locally as UNPAID, numbered from 1001, and the cart is cleared. |
| Printing | Partial / needs validation | `react-to-print` targets an 80mm template and invokes the browser print flow. This is not direct/silent printer access. Current selection reads `receipts[0]` from the component render immediately after a store update, so it can select the previous receipt (or no receipt on first checkout); the print flow should be corrected and verified before operational use. |
| Orders | Partial | Local receipts are split into unpaid and paid views. A cashier can mark unpaid as paid. Edit/regenerate is not present. |
| Reports | Placeholder | No session metrics or report generation yet. |
| Settings | Placeholder | No configurable tax or application settings yet. |
| Login/auth | Placeholder | `/login` exists, but authentication and access control are not implemented. |
| Server order persistence | Planned | Express/Prisma currently persist/read products only; orders are not sent to the server. |

### 2.1 Current route map

| URL | Purpose | Status |
| --- | --- | --- |
| `/` | Redirects to `/catalog` through Next middleware | Implemented |
| `/catalog` | Product catalog and receipt/cart panel | Partial, primary workflow |
| `/orders` | Unpaid and paid local receipts | Partial |
| `/reports` | Reporting placeholder | Not implemented |
| `/settings` | Settings placeholder | Not implemented |
| `/login` | Static login placeholder | Not implemented as authentication |

The sidebar links to Catalog, Orders, Reports, and Settings. There is no separate `/products` or Menu page.

### 2.2 Current API

| Method | URL | Behavior |
| --- | --- | --- |
| GET | `/` | API welcome response (outside `/api`) |
| GET | `/api/health` | Health response with database connectivity check |
| GET | `/api/products` | Returns all product rows; price is converted to a two-decimal string |

There are no order, payment, report, product-write, or authentication endpoints at this time. The browser uses Axios configured by `NEXT_PUBLIC_API_URL`, and product queries are managed with TanStack Query.

## 3. Intended cashier workflow

```text
Browse products -> add and adjust cart -> choose order type -> generate unpaid receipt
                                                           -> print customer receipt
Unpaid receipt -> cashier confirms payment outside app -> mark paid -> paid history/report
```

### 3.1 Receipt lifecycle and rules

- Generating a receipt records an order; it does not mean payment has been received.
- `DINE_IN` and `TAKEAWAY` are receipt labels only and do not change the price or tax calculation.
- Payment is a manual status confirmation. No provider is integrated.
- Only PAID receipts count as collected money in any future report.
- The target UI prints at generation, before payment. The present implementation only invokes the browser print flow and has the selection issue called out above.
- The target supports editing and regenerating an unpaid receipt. The current UI does not implement it.
- Receipt numbers currently begin at 1001 and increment in the persisted client store. A robust multi-session/day reset policy is not implemented.

### 3.2 Current receipt data

`Receipt` in `client/src/types/index.ts` contains UUID, receipt number, cart item snapshots, subtotal/tax/total in paisa, order type, `PAID`/`UNPAID` status, creation timestamp, and optional paid timestamp. Cart items contain product id, name, price as a JavaScript number, and quantity. Persisted receipts include those snapshots, so later product edits would not update historical lines, although product editing itself is not implemented.

The Zustand order store persists `receipts` and `nextReceiptNumber` to `localStorage` under `cafe-pos-orders`. `clearOrders` clears receipts and resets the number, but there is no UI for that action. The cart store is not persisted. Browser storage is local to a browser profile/device and is not shared with Electron sessions, another workstation, or the API database.

## 4. Intended product behavior and remaining work

This section captures the product requirements; entries marked “planned” must not be mistaken for shipped behavior.

### 4.1 Catalog and order entry

- Catalog is the primary counter screen. Product data comes from the server API.
- A product tap adds one unit. Quantity controls allow corrections; removing the final unit removes the line.
- Search should match product names (case-insensitive); category controls should filter by category; the all-items control resets filters. These controls are currently static.
- Unavailable products should not be orderable. The API includes `isAvailable`, but current catalog rendering does not enforce it.
- Product images may use a placeholder until image assets are introduced.
- Empty, loading, and API-error states should be clear. Loading and error branches currently exist; an empty successful result has no dedicated message.

### 4.2 Receipt arithmetic and currency

- Currency is PKR and display formatting belongs in a shared utility.
- Store amounts in integer paisa for calculations; use a deliberate rounding policy for tax and line totals. Avoid JavaScript floating-point values as the money source of truth.
- The current implementation does not fully comply: `Product.price` is an API string, `ProductCard` converts it with `parseFloat`, and cart state stores a `number`; receipt totals then round `price * 100`.
- Tax is currently hard-coded at 8%. Making it configurable is planned and should include how existing receipts preserve the rate/value used at creation.
- Confirm the currency output is consistently `PKR` and that product prices are converted from rupees to paisa exactly once. The shared formatter currently takes paisa and divides by 100, while the card currently passes the parsed API rupee amount directly; verify/fix this before treating displayed catalog prices as correct.

### 4.3 Orders, payment, and reports

- Orders should distinguish unpaid from paid. Current `/orders` does this and exposes Mark as paid for unpaid entries.
- Editing/regenerating an unpaid receipt, audit history for status changes, filtering, empty-state refinements, and session totals are not implemented.
- Reports should derive totals from paid receipts only and define date/session boundaries explicitly before implementation.
- Settings should provide approved application configuration (initially tax rate); it is currently a placeholder.

### 4.4 Printing

- Target receipt width is 80mm. `PrintReceipt` is a dedicated template and `react-to-print` invokes browser print UI.
- Browser print dialogs may require a user selection/confirmation; Electron silent printing and printer discovery/configuration are not implemented.
- Before relying on printing: select the newly created receipt reliably, ensure the print DOM is mounted before invoking print, avoid clearing print state on a fixed timer while printing may still be preparing, and validate print/cancel/error paths in browser and intended Electron environment.

## 5. UI, theme, and accessibility direction

### 5.1 Current visual structure

The client uses a viewport-height shell: a dark semantic-token sidebar on the left, header and content on the right. The catalog places a scrollable product grid beside a fixed-width receipt panel. Theme is controlled by `next-themes`; light and dark CSS variables are defined in `client/src/app/globals.css`. Geist is the sans family, Lucide supplies icons, and components use Tailwind utility classes and semantic color tokens.

This describes implementation structure, not a guarantee of responsive usability on narrow displays. The target is a counter/desktop layout.

### 5.2 Design principles

- Keep the catalog and cart visible together on desktop and optimize for quick item entry.
- Use clear labels, stable layout, keyboard-accessible controls, visible focus, and appropriately large targets.
- Use semantic theme tokens (for example `bg-background`, `text-primary`, and sidebar tokens) rather than hard-coded component colors.
- Use shared UI primitives where they improve consistency; Lucide for icons and `cn()` for class merging.
- Reserve confirmation dialogs for destructive actions such as clearing a draft, once such an action is exposed.

## 6. Architecture and ownership boundaries

### Client (`client/src`)

- `app/`: App Router pages and `(auth)` / `(main)` route layouts.
- `components/layout/`: sidebar, navbar, and viewport shell.
- `components/modules/`: catalog card and receipt/print workflow.
- `components/providers/`: theme and QueryClient providers.
- `components/ui/`: shared UI elements.
- `lib/hooks/`: TanStack Query hooks.
- `lib/services/`: Axios API client and product service.
- `lib/schemas/`: Zod product response schema; `Product` is inferred from it.
- `store/`: Zustand local cart and order stores.
- `types/`: API response and client receipt/order types.

### Server (`server/src` and `server/prisma`)

Requests pass through Express middleware, route, controller, service, Prisma client, and SQLite. Routes map paths; controllers adapt HTTP input/output and forward errors; services own data operations. Zod is used for environment/request validation where wired. The Prisma schema is multi-file under `server/prisma/schema`; current Product model contains name, description, Decimal price, category, optional image URL, availability, and timestamps. Seed data creates demo products.

### Desktop (`electron`)

Electron creates a desktop window for the local Next.js UI. It is currently a thin development shell, not a packaged application backend or direct printer integration.

## 7. Domain and implementation conventions

- Product `price` crosses the API as a two-decimal string, while SQLite/Prisma owns its persisted decimal representation.
- Client `Product` is derived from a single Zod schema; nullable fields and ISO date strings mirror the API response.
- Use TanStack Query for remote product state and Zustand for local cart/receipt interaction state.
- Keep HTTP concerns in controllers and persistence/business operations in services.
- Validate configuration and untrusted request payloads. Keep secrets and local database files out of Git.
- Use explicit API errors and the shared error middleware; do not hide failures behind success-shaped fallbacks.
- Maintain strict TypeScript and the existing client/server package boundaries.

## 8. Non-goals for the initial single-cashier workflow

- Table management, reservations, customer naming/receipt labels, kitchen display/slips.
- Payment gateway or automatic payment confirmation.
- Inventory tracking or product administration UI.
- Multi-cashier accounts and authentication until explicitly scoped.

## 9. Roadmap and completion criteria

| Phase | Scope | Status |
| --- | --- | --- |
| Backend foundation | Express, SQLite/Prisma, product seed/API, health endpoint | Implemented for products |
| A: Shell | Main shell, navigation, theme, route structure | Partial; static session/user labels; login remains placeholder |
| B: Catalog | API product list, card/grid, functional search/category filtering, unavailable handling | Partial; list is wired, controls and availability behavior are not |
| C: Checkout | Cart, quantity controls, accurate integer money, tax, create unpaid receipt, print | Partial; local workflow exists; money and print flow need correction/validation |
| D: Orders | Unpaid/paid views, mark paid, edit/regenerate unpaid receipt | Partial; status transition works locally; editing is absent |
| E: Reports and quality | Session reports, accessibility/responsive polish, reliable print workflow | Pending / partial print scaffold |
| F: Persistence and operational features | Server-side orders, configurable tax, authentication and deployment decisions | Planned; not started for orders/auth/settings |

Phases describe delivery slices, not claims that every criterion in a slice is complete. Only proceed into new product scope when approved by the user; fix or clarify current workflow defects within the requested task scope.

## 10. Review findings to resolve

These are static code-review observations from 2026-10-22, not runtime test results:

1. **Catalog price units:** `formatPKR` expects paisa and divides by 100, but `ProductCard` passes `parseFloat(product.price)` where the API string is in rupees. Catalog prices are therefore likely shown at one hundredth of the expected amount. Cart conversion later multiplies by 100, so the same product can appear with a mismatched card and cart price.
2. **New receipt selection:** `ReceiptPanel` calls `addReceipt` and then reads `receipts[0]` from the current React render. Zustand writes synchronously, but that render's selected value is not updated synchronously; the new receipt is not guaranteed to be selected for printing.
3. **Print lifecycle:** a one-second timeout clears the selected receipt independently of `onAfterPrint`; this can race print preparation. Validate before treating automatic print as reliable.
4. **Money representation:** cart `price` is a JS number and arithmetic converts it to paisa on each calculation. This conflicts with the integer-paisa source-of-truth decision.
5. **API documentation:** the welcome path is `/`, not `/api`; the `/api` mount currently has no root route.
6. **Feature claims:** search, categories, reports, settings, login/authentication, editing receipts, and server-backed orders are not implemented despite being described as complete in older documents.

No code has been changed as part of this documentation review. These findings should be fixed in a separately scoped implementation task.
