---
paths:
  - "client/**/*.{ts,tsx}"
  - "server/src/**/*.ts"
  - "server/prisma/**/*"
---

# Cafe POS Business Rules

## Product Scope

- This is a local POS for one computer and one cashier.
- Preserve the existing product workflows.
- Do not assume multi-cashier, multi-branch, or cloud requirements.
- Do not introduce inventory, refunds, stock management, or other
  unimplemented features without explicit authorization.

## Orders and Checkout

- The server is authoritative for new order creation and order totals.
- Never trust client-calculated totals as authoritative.
- Validate product information and prices on the server.
- Preserve completed order line snapshots.
- Do not silently change checkout behavior or existing order semantics.
- Preserve transaction consistency when creating orders and payments.

## Money and Tax

- Use integer paisa for authoritative monetary calculations.
- Avoid floating-point arithmetic for financial calculations.
- Inspect existing rounding rules before changing calculations.
- Do not hardcode tax rates when the application supports configuration.
- Verify that frontend and backend tax calculations agree.
- Never silently change tax, discount, or payment calculations.

## Payments and Cashier Sessions

- Inspect existing payment and session workflows before changing them.
- Preserve payment-to-order relationships.
- Prevent duplicate payment processing where appropriate.
- Do not invent cash reconciliation or session-closing behavior.
- Keep authorization and cashier-session rules consistent with existing code.

## Receipts and History

- Preserve receipt number uniqueness and historical order data.
- Do not modify completed order snapshots when product details change.
- Understand the distinction between legacy local receipts and newer
  server-backed orders before changing receipt behavior.
- Do not delete or migrate legacy receipt data without explicit approval.

## Reports and Settings

- Verify report calculations against their underlying transactions.
- Do not assume report totals are correct merely because the UI displays them.
- Inspect the source of configurable settings before changing behavior.
- Keep historical transactions consistent with the rules that applied
  when they were completed.

## Before Changing Business Behavior

1. Trace the complete workflow from UI to API to database.
2. Identify all affected screens, endpoints, services, and models.
3. Check existing behavior and historical data implications.
4. Explain any inconsistencies between frontend and backend.
5. Present the proposed behavior and wait for approval.

Never invent business rules to fill gaps in the implementation.
