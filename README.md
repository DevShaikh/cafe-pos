# Cafe POS

A locally running cafe point-of-sale app for the counter. Built as a learning and portfolio project.

**Status:** Phases A–D are complete. Receipt generation, printing, and order management (Unpaid → Paid) are fully functional. Phase E is in progress – the Reports page is the remaining UI feature.

---

## What it does

The cashier uses the system to:

1. Build a receipt from the menu (search + categories).
2. Choose order type (Dine in / Takeaway — label only).
3. Generate a receipt → it becomes **unpaid** and is automatically sent to the printer.
4. Edit and regenerate an unpaid receipt if the order changes.
5. When the waiter returns with cash (or EasyPaisa / transfer confirmation), **mark the receipt as paid**.
6. Review paid history and generate a session report (reports page coming soon).

Payment is always manual. The app only records that the cashier confirmed the money was received.

Full product rules, layout, and acceptance criteria live in [`docs/pos-spec.md`](docs/pos-spec.md).  
Quick locked decisions: [`docs/decisions.md`](docs/decisions.md).

---

## Tech stack

| Layer        | Technologies                                                                              |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Client**   | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| **Printing** | `react-to-print` (80 mm thermal receipt template)                                         |
| **Server**   | Node.js, Express, TypeScript, Zod                                                         |
| **Database** | SQLite (single local file) with Prisma 7                                                  |
| **Desktop**  | Electron (loads the Next.js client)                                                       |

---

## Getting started

You need **Node.js 20.9+** and npm. No separate database server is required.

### 1. Clone and install

```bash
git clone https://github.com/DevShaikh/cafe-pos.git
cd cafe-pos
npm install
npm install --prefix client
npm install --prefix server
```
