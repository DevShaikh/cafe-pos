# Cafe POS — Locked Decisions

Quick reference. Full detail lives in `pos-spec.md`.

**Last updated:** 2026-10-21

| # | Topic | Decision |
|---|-------|----------|
| 1 | Payment lifecycle | Unpaid → Mark as paid. Manual confirmation only (cash / EasyPaisa / transfer). No payment gateway. |
| 2 | Order type | Dine in / Takeaway is a label on the receipt only. No special tracking or workflows. |
| 3 | Tax | Hard-coded percentage (default 8 %). Configurable later. |
| 4 | Receipt label | Dropped. No free-text table/customer name field. |
| 5 | Product images | Placeholders (category icon / colored surface). Real photos later. |
| 6 | Layout | Compact left sidebar + fixed right cart on New Receipt. Maximise product grid. |
| 7 | Currency | PKR, displayed as `PKR 120.00`. Arithmetic in whole paisa integers only. |
| 8 | Users | Cashier only. No waiter accounts. |
| 9 | Session model | Session-oriented for the UI phase. Day-close + number reset can come later. |
| 10 | Persistence (UI phase) | Local React / Zustand state only. No localStorage, no DB writes yet. |
| 11 | Auth (UI phase) | Login page is visual only. NextAuth later. |
| 12 | Primary action labels | “Generate receipt · PKR XX.XX” / “Regenerate receipt · PKR XX.XX” |
| 13 | After generate | Cart clears, search focuses, next receipt is ready immediately. |
| 14 | Edit behaviour | Loads unpaid receipt into cart; regenerate keeps the same receipt number. |

---

## Layout sketch (desktop)

```
┌──────────┬────────────────────────────────┬──────────────────┐
│  Slim    │  Header + search + categories  │  Cart (fixed)    │
│  sidebar │────────────────────────────────┤                  │
│  icons   │  Product grid (scrolls)        │  Type toggle     │
│  + short │                                │  Line items      │
│  labels  │                                │  Totals + Tax    │
│          │                                │  Generate btn    │
│  ──────  │                                │                  │
│  Settings│                                │                  │
│  User    │                                │                  │
└──────────┴────────────────────────────────┴──────────────────┘
```

---

## Core flow

```
New Receipt
  → add items / adjust qty / set Dine-in|Takeaway
  → Generate receipt
  → appears in Orders (Unpaid)

Orders (Unpaid)
  → Edit → back to New Receipt (editing mode) → Regenerate (same #)
  → Mark as paid → moves to Paid today

Reports
  → derived only from paid receipts
```
