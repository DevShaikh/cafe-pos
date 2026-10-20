# Cafe POS: plan (Phase 3 detail, later phases outlined)

Save as `docs/pos-ui-plan.md`. Tick the boxes as steps finish and add a line to the change log at the bottom.

**Last updated:** 2026-10-19 (version 5: two billing styles supported)
**Working method:** one step at a time. Every step ends with a check (typecheck, lint, tests, build, or a visual check). We do not start the next step until the check passes.

## Progress (Phase 3: product catalog UI)

- [x] Step 0: Housekeeping before UI work
- [x] Step 1: Fonts and client environment
- [ ] Step 2: Data layer (product schema, API client, price helper)
- [ ] Step 3: Server touch-ups the UI depends on
- [ ] Step 4: App shell and theme tokens
- [ ] Step 5: Catalog (categories, search, product grid, states)
- [ ] Step 6: Order panel shell
- [ ] Step 7: Quality pass (accessibility, responsive, light/dark) and docs update

## 1. How the cafe works (this drives the design)

Customers sit wherever they like and stay as long as they like, often 2 to 3 hours. They do not call a waiter until they want something. Then the same waiter comes, the customer says what they want ("3 chai and 1 paratha"), and the waiter goes away and brings it. The customer does not know whether the waiter generated a receipt first, and does not need to. This repeats as often as the customer likes during the stay.

When the customer is ready to leave, they call the same waiter and say "bring the bill". The waiter comes straight back with a receipt. The customer gives cash, the waiter takes it to the counter and brings back the change.

Behind the scenes, the waiter reaches the cashier and the kitchen in one of two ways:

- **Flow A, kitchen first:** the waiter tells the kitchen, serves, and goes to the counter later. The cashier enters the order and prints the receipt.
- **Flow B, counter first:** the waiter goes to the counter first. The cashier enters the order and prints the receipt. The waiter takes it to the kitchen, serves, and keeps the receipt for the bill.

When a customer orders more after a receipt was already made, cafes handle the final bill in one of two ways. The app supports both:

- **Style 1, a receipt per order round:** each round has its own receipt, and the waiter adds the receipts up by hand when the customer asks for the bill.
- **Style 2, one receipt at the end:** the waiter gives the cashier the full list of everything the customer had, and the cashier generates a single receipt with all the items. If an earlier receipt for that customer already exists, it is replaced by the combined one (see "Reopen as draft" in Phase 6).

At the end of the day (EOD) the cashier adds up the amounts of all generated receipts and matches the total with the cash in the counter, manually. There is no fixed closing time.

What this means for the app:

1. **The cashier is the only user.** The app runs at the counter. Waiters do not use it.
2. **One printout per receipt.** The receipt contains everything: items, quantities, prices and the total. Depending on the cafe, a customer gets one receipt per order round (Style 1) or a single receipt for the whole stay (Style 2). A separate kitchen slip is a later feature.
3. **Both flows are the same screen.** Build the order, then press "Generate receipt". The app does not need to know which flow was used.
4. **No open orders, no holding, no payment status.** The waiter holds the paper receipts, not the app. Generating a receipt counts as a sale. Cash handling (taking money, giving change) happens outside the app.
5. **The cashier is often serving a waiter who is standing and waiting.** Speed matters more than anything else on the POS screen (see the design principles in section 7).
6. **End-of-day count.** The app lists the receipts of the day with their total, so the cashier can compare it with the cash.
7. **The "day" is closed by the cashier,** not by midnight. Closing the day starts a new day and restarts the receipt numbering.
8. **No table management.** A receipt is identified by an automatic receipt number plus an optional free-text label (for example a table number or a customer name). The label helps a waiter match a stack of receipts to one customer.

## 2. Goal and scope of Phase 3

Build the main POS screen: a navigation sidebar, a product catalog with category tabs and search, and an empty order panel on the right. No order logic yet.

In scope: layout, theming, catalog, loading/empty/error states, data fetching, price formatting, small server fixes the UI needs.

Out of scope for Phase 3: adding items to an order, totals, generating receipts, printing, end-of-day, history, login, product management.

## 3. Roadmap (re-sliced for the real workflow)

1. ~~Project setup~~
2. ~~SQLite and backend foundation~~
3. **Product catalog** (this plan)
4. **Order builder:** a local draft order on the POS screen: add items, quantity, remove, optional note per item, optional label, totals.
5. **Receipts:** "Generate receipt" saves the order (it cannot be edited afterwards) with a receipt number, and prints one receipt. Printing starts with the browser print dialog.
6. **End of day:** list of the day's receipts with count and total, close the day (resets the numbering), receipt history with reprint. Tax and discount rules are decided here.
7. **Quality, polish and the desktop installer** (including silent printing to the counter printer).

## 4. Decisions

Defaults assumed. Edit this table if you decide differently, then tell me.

| #   | Decision                               | Chosen                                                                                                                                                         |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Look                                   | Slim icon sidebar, catalog in the middle, order panel on the right. Light and dark through theme tokens. Accent color: keep the current amber.                 |
| 2   | Product photos                         | Category-icon placeholders now. `imageUrl` is null for all seed data. Real images come with product management.                                                |
| 3   | Phasing                                | The roadmap in section 3. The order panel exists as an empty shell in Phase 3, so later phases do not change the layout.                                       |
| 4   | Tax, discounts                         | Deferred to Phase 6.                                                                                                                                           |
| 5   | Input hardware                         | Mouse and touch both supported. Buttons and cards are at least 44 px tall. No hover-only actions.                                                              |
| 6   | Delivery of changes                    | I send the files for each step. You apply them and run the check.                                                                                              |
| 7   | Fonts                                  | One self-hosted sans-serif family.                                                                                                                             |
| 8   | Receipt identification                 | Automatic receipt number plus an optional free-text label. No table management.                                                                                |
| 9   | Users                                  | Cashier only, no login for waiters.                                                                                                                            |
| 10  | Printing                               | One receipt with everything on it. The kitchen slip (second print) is a later feature.                                                                         |
| 11  | Payment                                | Not tracked in the app. Cash only. A generated receipt counts as a sale.                                                                                       |
| 12  | Customer orders more after the receipt | Either a new receipt for the new items (Style 1) or one combined receipt at the end (Style 2). Both are supported. Confirmed.                                  |
| 13  | End of day                             | The cashier closes the day. Receipt numbers restart after closing. Confirmed.                                                                                  |
| 14  | Mistakes                               | A receipt can be voided later (kept in history, left out of the total). Not in Phase 5. Confirmed.                                                             |
| 15  | Speed first                            | The POS screen is designed for a cashier serving a waiter who is waiting. See section 7.                                                                       |
| 16  | Combined receipt                       | Entering all items at the end works from Phase 5. Replacing an earlier receipt with a combined one comes in Phase 6 as "Reopen as draft". No open orders list. |

## 5. What the example screens gave us

All five examples share one layout: navigation, then a product grid with categories and search, then an order panel with totals and a main action.

Taken: slim icon sidebar, category chips with icons, search field, card grid, right-hand order panel, accent-colored prices, large touch targets.

Left for later or not needed: tables and table maps, hold/open orders, a separate kitchen print, discounts and coupons, customers, reports and dashboards, delivery, reservations, stock counts, ratings, "popular dishes".

## 6. Baseline (state of the repo when this plan was written)

API (Express, SQLite, Prisma 7):

- `GET /api`, `GET /api/health`, `GET /api/products`
- Products: `id` (UUID string), `name`, `description` (nullable), `price` (string with two decimals), `category`, `imageUrl` (nullable), `isAvailable`, `createdAt`, `updatedAt` (ISO strings)
- Success shape `{ success, message, data }`. Error shape `{ error: { code, message } }`.
- 20 seeded products in 6 categories.

Client (Next.js 16.4.2, React 19.3, Tailwind 4, shadcn `radix-nova`, Zustand, zod):

- Placeholder pages only: `(dashboard)` layout with a navbar and theme toggle, `/` dashboard text, `/products`, `/login`, empty cart module.
- `cartStore.ts` is a skeleton. `clearCartStore` does not clear anything. It is rebuilt in Phase 4.
- Two duplicate `Product` definitions (`types/index.ts`, `lib/schemas/productSchema.ts`) that do not match the API.
- Fonts: Inter, Geist and Geist Mono are loaded from Google, but only Inter (`--font-sans`) and Geist Mono (`--font-mono`) are wired into the theme. The Geist sans variable is unused.
- No API client, no environment variable for the API address.

Known open items (fixed by the steps below): database file still tracked in git, `CLIENT_ORIGIN` default is 3000 while the client runs on 3001, `productService` swaps `AppError` arguments, product list ignores availability and ordering.

## 7. Target screen

```
┌──────┬──────────────────────────────────┬────────────────────┐
│ nav  │ Title · date · search            │ New order          │
│ icons│ [All] [Tea] [Paratha] [Eggs] ... │ (empty state)      │
│      │ ┌────┐ ┌────┐ ┌────┐ ┌────┐      │                    │
│ POS  │ │card│ │card│ │card│ │card│      │                    │
│      │ └────┘ └────┘ └────┘ └────┘      │ Subtotal           │
│ ◐    │ ...                              │ Total              │
│      │                                  │ [Generate receipt] │
└──────┴──────────────────────────────────┴────────────────────┘
```

- Target widths: 1024 to 1920 px, landscape. The Electron window already has a minimum width of 1000.
- Sidebar: icons only. Only routes that exist are shown. "Receipts" and "End of day" are added in Phase 6. The theme toggle sits at the bottom.
- Product grid scrolls on its own. The sidebar and the order panel stay fixed.
- The order panel has one main button, "Generate receipt". It exists from Phase 3 and stays disabled until Phase 5.

**Design principles (speed first):**

- One tap on a product card adds one item. Tapping again adds another. Quantity buttons are for corrections.
- The search box is easy to reach and can be typed into at any time ("chai", "par"), because many orders are fast and verbal.
- Making a normal receipt takes as few taps as possible: add items, then "Generate receipt". No confirmation dialogs for normal actions. Only "Clear order" asks, and only when the order has items.
- After a receipt is generated, the order clears immediately so the cashier can start the next one, with the search box focused again.
- Product cards keep a stable position (no layout jumping while loading or filtering), so the cashier can learn where things are.
- Large cards and buttons (44 px or more) and clear contrast, since the screen may be used quickly, in a hurry, or by touch.

## 8. Architecture decisions

- **Data fetching.** The client fetches all products once and filters by category and search in the browser (a cafe menu is small, and filtering is instant). Final approach is confirmed after reading the Next.js fetching and caching guides in `client/node_modules/next/dist/docs/` (required by `client/AGENTS.md`). Starting recommendation: client-side fetching, which also keeps the Electron option open. A fetching library (for example TanStack Query) is reconsidered in Phase 6, when the day's receipts need listing and refreshing.
- **Where an order lives (Phases 4 and 5).** The order is a local draft in the browser until "Generate receipt". Then it is saved in the database as a finished receipt and cannot be edited. The server recomputes the total with `Decimal` from the saved product prices, and the printed receipt uses the server's numbers.
- **Types.** One Zod schema in `client/src/lib/schemas/productSchema.ts` is the single source for the `Product` type. The API response is parsed with it. The duplicate in `types/index.ts` is removed.
- **Money.** Prices stay strings from the API. For arithmetic, convert to whole paisa (integer). Format with `Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", currencyDisplay: "code" })`, which gives `PKR 120.00`. Never add prices as JavaScript decimals.
- **Theme.** Colors are tokens in `client/src/app/globals.css`. Components use tokens only. Both light and dark are supported.
- **Components.** shadcn/ui on Radix (`asChild`). Icons from Lucide. Classes merged with `cn`.
- **Routing.** `/` becomes the POS screen. `/products` is kept for future product management.
- **Client environment.** `NEXT_PUBLIC_API_URL`, documented in `client/.env.example`. The value is baked into the build.
- **Folders.**
  - `components/layout/`: AppShell, Sidebar, Topbar
  - `components/modules/products/`: ProductsModule, CategoryTabs, ProductSearch, ProductGrid, ProductCard, skeleton, empty state, error state
  - `components/modules/cart/`: OrderPanel
  - `lib/api/`: client and product calls
  - `lib/money.ts`: price helpers

## 9. Steps (Phase 3)

### Step 0: Housekeeping before UI work

- [ ] Finish stopping git from tracking `server/data/cafe-pos.db`: add the ignore rules to `.gitignore` and run `git rm -r --cached server/data`.
- [ ] Change the `CLIENT_ORIGIN` default in `server/src/config/env.ts` from `http://localhost:3000` to `http://localhost:3001`.
- [ ] Run `npm run typecheck`, `npm run lint` and `npm test` from the project root.

Done when: `git ls-files server/data` prints nothing, `git status` is clean after a commit, and all three checks pass.

### Step 1: Fonts and client environment

- [ ] Replace the three Google fonts with one self-hosted sans-serif family. Remove the unused variables from the theme.
- [ ] Add `client/.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:3000/api` (adjust to your server port).
- [ ] Create your own `client/.env.local` from it (not committed).

Files: `client/src/app/layout.tsx`, `client/src/app/globals.css`, `client/package.json`, `client/.env.example`.

Done when: `npm run build --prefix client` succeeds without internet access and the page shows the new font.

### Step 2: Data layer

- [ ] One Zod `Product` schema and the response envelope schema, matching the API.
- [ ] Remove the duplicate `Product` type.
- [ ] A small typed API client that reads `NEXT_PUBLIC_API_URL` and turns the server's `{ error: { code, message } }` into a typed error.
- [ ] `getProducts()` built on it.
- [ ] `lib/money.ts` with `parsePriceToPaisa` and `formatPrice`.
- [ ] Unit tests for the money helpers and the schema (test runner decided in this step; recommendation: `node:test` with `tsx`, as on the server).

Done when: typecheck, lint and the new tests pass.

### Step 3: Server touch-ups the UI depends on

- [ ] Fix the `AppError` argument order in `productService` (status, code, message) and keep the original error as `cause`.
- [ ] Sort products by category, then name.
- [ ] Hide unavailable products by default. Support `?includeUnavailable=true` using the existing `productListQuerySchema`.
- [ ] Remove the copy-pasted comment in `product.routes.ts`.
- [ ] Product tests against a temporary SQLite file created from the migration SQL: list, ordering, availability filter, error shape.

Done when: `npm test --prefix server` passes with the new tests, and `curl http://localhost:3000/api/products` returns sorted, available products.

### Step 4: App shell and theme tokens

- [ ] `AppShell`: sidebar, top bar, content area. Replace the old `Navbar`.
- [ ] Sidebar with icons, an active state (`aria-current`), and the theme toggle at the bottom.
- [ ] Top bar with the title and today's date.
- [ ] Set theme tokens (surfaces, accent, radius) for light and dark.
- [ ] `/` renders the POS screen layout (three zones).

Done when: typecheck, lint and build pass, and the shell looks right in light and dark at 1280×800 and 1920×1080 (your visual check).

### Step 5: Catalog

- [ ] `ProductsModule` fetches products and holds the selected category and search text.
- [ ] `CategoryTabs`: "All" plus the categories found in the data, each with a Lucide icon (fallback icon for unknown names).
- [ ] `ProductSearch`: filters by name and description, with a clear button.
- [ ] `ProductGrid` and `ProductCard`: icon placeholder, name, price in the accent color, "Unavailable" state. Cards are not wired to an order yet, but have an `onSelect` prop ready for Phase 4.
- [ ] Loading skeleton, empty state (no products / no search results) and error state with a Retry button.

Done when: with the API running you see 20 products in 6 categories, search and category filtering work, and stopping the API shows the error state with a working Retry.

### Step 6: Order panel shell

- [ ] `OrderPanel` in `modules/cart/`: heading "New order", an optional label field (layout only, not working yet), empty message, static Subtotal and Total showing `PKR 0.00`, and one disabled button: "Generate receipt".
- [ ] No state and no order logic.

Done when: typecheck, lint and build pass, and the panel stays fixed while the grid scrolls.

### Step 7: Quality pass and docs

- [ ] Keyboard: logical tab order, visible focus rings, search reachable without a mouse.
- [ ] Screen readers: labels on icon buttons, results count announced, `aria-current` on navigation.
- [ ] Contrast checked in light and dark.
- [ ] Layout checked at 1024, 1280, 1440 and 1920 px wide.
- [ ] Respect reduced-motion settings.
- [ ] Update the roadmap in `README.md` and `.github/copilot-instructions.md` to the phases in section 3, and add a short "how the cafe works" note to the instructions file.

Done when: `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all pass, and the visual review is signed off.

## 10. Definition of done for Phase 3

- The POS screen at `/` shows all available products with working category tabs and search, in light and dark.
- The order panel shell is in place with a disabled "Generate receipt" button.
- Loading, empty and error states exist and were tested.
- The client `Product` type matches the API and exists once.
- Prices display as `PKR 120.00`, and no price arithmetic uses JavaScript decimals.
- All checks pass. Docs and roadmap are updated.

## 11. Later phases (preview, planned in detail when they start)

**Phase 4, order builder (local draft)**

- Rebuild `cartStore`: items keyed by product id, each storing a snapshot (`name`, `unitPricePaisa`, `quantity`, optional note), plus an optional label. Actions: add, increment, decrement, remove, clear.
- Totals in whole paisa, with unit tests.
- Wire `ProductCard` selection and the real `OrderPanel`.
- Decide whether the draft survives a page reload.

**Phase 5, receipts**

- Order model: receipt number, optional label, total, timestamp, and items with name and unit price snapshots. Receipts cannot be edited after they are generated. The model leaves room for "voided" and "replaces receipt" so Phase 6 needs no redesign.
- API: create a receipt (the server recomputes the total with `Decimal`) and read it back.
- "Generate receipt" saves the order and prints one receipt through the browser print dialog, then clears the draft, shows a short confirmation with the receipt number, and focuses the search box for the next order.

**Phase 6, end of day**

- List of the day's receipts with count and total, for the manual cash check.
- Close the day: starts a new day and restarts receipt numbering.
- Receipt history with reprint, and voiding a receipt (kept in history, left out of the total).
- **Reopen as draft:** copy a past receipt's items and label into a new draft. The cashier adds the new items and generates one combined receipt. In the same save, the server voids the old receipt, so the day's total stays correct.
- Decide tax and discount rules. Check the tax and invoice requirements that apply to restaurants in your province before building this phase.

**Phase 7, polish and desktop**

- Electron installer, silent printing to the counter printer, backups of the database file, error logging.

## 12. Parked ideas

Kitchen slip as a second print, frequently ordered products shown first, hold/open orders, payment status and methods, table maps, waiter accounts and login, discounts and coupons, customer records, reports and dashboards, a product management screen, real product photos, keyboard shortcuts, kitchen display screen, takeaway/delivery tracking.

## 13. Risks and open questions

- Next.js 16 has `cacheComponents` and `partialPrefetching` enabled. The data-fetching approach must follow the bundled docs. Confirm at the start of Step 2.
- Desktop packaging (Phase 7) decides how the client is served in production. Keep data fetching in client components until then.
- Printing: the browser print dialog is enough to start. Silent printing to a thermal printer from Electron (paper width, drivers) needs a small test with the real printer before Phase 7. Which printer model you have matters.
- Wrong receipts: because receipts cannot be edited and nothing tracks payment, mistakes are handled by voiding and generating a new receipt. This is planned for Phase 6.
- Receipt numbering restarts when the cashier closes the day. If the cashier forgets to close the day, numbers and totals run on. The end-of-day screen should show when the current day started.
- Client test runner is not chosen yet (Step 2).
- "Reopen as draft" must void the old receipt in the same save that creates the combined one. Otherwise the same sales are counted twice in the end-of-day total.

## 14. Verification limits

The assistant cannot open a browser or load Google Fonts in its environment. It verifies with typecheck, lint, tests, builds and server-side render checks. Visual results are checked by you in the browser. Send screenshots of anything that looks wrong.

## Change log

- 2026-10-19: Plan created.
- 2026-10-19: Added the cafe workflow, re-sliced the roadmap, added decisions 8 to 11.
- 2026-10-19: Version 3. Single receipt with everything on it (no kitchen slip, no open orders, no payment status). Added the end-of-day count and the cashier-closed day. Phase 5 is now Receipts and Phase 6 is End of day. Order panel button is "Generate receipt". Added decisions 12 to 14.
- 2026-10-19: Version 4. Confirmed decisions 12 to 14. Added the real customer flow (long stays, several order rounds, waiter brings the bill), a label for matching receipts, speed-first design principles, and a note about avoiding double counting.
- 2026-10-19: Version 5. Both billing styles are supported (a receipt per round, or one combined receipt at the end). Added "Reopen as draft" to Phase 6 for replacing an earlier receipt, added decision 16, and removed the combined-bill printout idea.
- 2026-10-19: Step 0 done.
- 2026-10-20: Step 1 done. Added calendar versioning (scripts/update-version.ts and the git pushv alias).
