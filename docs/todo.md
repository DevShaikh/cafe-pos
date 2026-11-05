# Cafe POS — Agent Todo List

> Source: `DevShaikh/cafe-pos` audit. This file is the authoritative backlog for the repo. Work top-down unless a dependency is noted. Mark tasks complete only when acceptance criteria are met and verified.

---

## 🚨 P0 — Release Blockers (must finish before any "release-ready" claim)

### [ ] 1. Windows Installer Acceptance Test (clean machine)

- **Why:** Packaging pipeline exists but has never been validated on a clean Windows install.
- **Scope:**
  - Build NSIS installer via existing Electron pipeline.
  - Install on a clean Windows 10/11 VM (no Node, no dev tools).
  - Verify: app launches, first-run DB creation, PIN login, session open/close, order create, payment record, app restart with **session persistence intact**.
  - Verify uninstall leaves no orphaned processes and removes app data per spec.
- **Likely touchpoints:** `electron/`, `docs/windows-installation-testing-guide.md`
- **Acceptance:** Completed test matrix in `docs/` with pass/fail per step and screenshots or logs. Any failures filed as sub-issues.

### [ ] 2. Backup & Restore — end-to-end verification + bug fix

- **Why:** UI and utilities exist but restore has **not** been tested end-to-end. A user-reported runtime error is unresolved.
- **Scope:**
  - Reproduce the reported restore runtime error; capture stack trace.
  - Fix root cause.
  - Test: create data → backup → wipe DB → restore → verify products, orders, payments, expenses, settings all intact.
  - Test: restore over an existing (non-empty) DB.
  - Test: restore from a backup made by an older schema (see task 5).
- **Likely touchpoints:** `server/` (backup/restore service), `docs/backup-restore-runbook.md`, client Settings page.
- **Acceptance:** Restore succeeds with zero data loss across all three scenarios; runbook updated with actual verified steps.

### [ ] 3. Physical receipt printing validation

- **Why:** 58mm/80mm printing is implemented but untested against real drivers.
- **Scope:**
  - Print test receipts on at least one real 58mm and one real 80mm thermal printer.
  - Verify layout, margins, cut behavior, character encoding (currency symbols), and multi-item overflow.
  - Confirm paper-width setting in Settings actually changes output.
- **Likely touchpoints:** `client/` (receipt component), `react-to-print` config, Settings.
- **Acceptance:** Printed receipts attached as evidence; any layout fixes committed.

### [ ] 4. Installer trust — signing + branded icon

- **Why:** Unsigned installer + default Electron icon triggers SmartScreen warnings and looks unprofessional.
- **Scope:**
  - Add branded app icon (`.ico` for Windows, plus taskbar/installer variants).
  - Configure code signing (cert or at minimum document the process + provide unsigned-but-documented fallback).
  - Rebuild installer and re-verify task 1 checklist still passes.
- **Likely touchpoints:** `electron/` build config, `build/` or `resources/` icon assets.
- **Acceptance:** Installer has correct icon; signing status documented in `docs/`.

### [ ] 5. Migration upgrade rehearsal on real-data DB

- **Why:** A destructive migration (`DROP TABLE Products`) exists. A migration guard helps but the safe path is unrehearsed.
- **Scope:**
  - Take a DB populated with realistic data from an **older** schema version.
  - Run the migration path; confirm guard triggers correctly and no data is lost.
  - Document the exact upgrade procedure for a user on an old version.
- **Likely touchpoints:** `server/prisma/migrations/`, `docs/migration-guard-enhancement.md`
- **Acceptance:** Upgrade path tested on real-shaped data; procedure documented.

### [ ] 6. Resolve PowerShell session 401 discrepancy

- **Why:** Cookie-session test via PowerShell returned 401; not reproduced in Chromium. Native Electron cookie handling unconfirmed.
- **Scope:**
  - Reproduce or rule out in Electron's native window.
  - Confirm cookie attributes (SameSite, Secure, HttpOnly, path) are correct for the local Electron origin.
- **Acceptance:** Written finding in `docs/` with repro steps or "cannot reproduce" evidence.

---

## 🔴 P1 — Critical Feature Gaps

### [ ] 7. Order void / refund / correction flow

- **Why:** No way to correct a completed order. Real cashiers need this.
- **Scope:**
  - Server: void endpoint (with reason + audit log), refund endpoint (full/partial), permission check.
  - Client: void/refund UI on order history + reports reflect corrections.
  - Reports: net sales must account for voids/refunds.
- **Acceptance:** Void and refund flows work end-to-end; audit trail persisted; reports reconcile.

### [ ] 8. Cash session reconciliation (open/close counts)

- **Why:** Sessions open/close but no opening float or closing cash count — can't reconcile a drawer.
- **Scope:**
  - Add opening cash float on session open.
  - Add closing cash count + expected-vs-actual variance on session close.
  - Surface variance in reports/expenses view.
- **Acceptance:** Session close produces a reconciliation summary; variance persisted.

### [ ] 9. Fix documentation references

- **Why:** README links to `docs/pos-spec.md` and `docs/decisions.md` which **do not exist**.
- **Scope:**
  - Either author the missing docs (spec + ADR log) or remove/repoint the links.
  - Preferred: author both — a short POS spec and an ADR list capturing the local-first, SQLite, Electron, JWT-cookie decisions.
- **Acceptance:** Every doc link in README resolves to a real file.

---

## 🟠 P2 — Nice-to-Have / Polish

### [ ] 10. Inventory / stock tracking (basic)

- Mark products with stock quantity; decrement on order; low-stock warning. (Spec first — confirm scope before building.)

### [ ] 11. Empty / error states across all pages

- Audit catalog, products, orders, reports, expenses, settings for missing empty states and error toasts.

### [ ] 12. Accessibility pass

- Focus traps in modals, keyboard nav for cart, aria labels on icon buttons, contrast check on Tailwind theme.

### [ ] 13. Test coverage baseline

- Add server-side tests for: order total calculation, payment recording, auth guard, backup/restore service.
- Add client tests for cart store (Zustand) reducers.

### [ ] 14. CI pipeline

- GitHub Actions: typecheck, lint, build client + server, run tests on PR.

---

## 📋 Working Rules for the Agent

1. **One P0 at a time.** Do not start a new P0 until the previous has acceptance evidence committed.
2. **Never claim "done" without evidence** — logs, screenshots, or passing test output in the PR/commit message.
3. **Migration or DB-touching changes require a backup first** and a note in `docs/`.
4. **Do not delete the destructive migration.** Only add a guard / new migration path.
5. **Update README + `docs/` in the same PR** as any behavior change.
6. **Flag anything ambiguous** in a `## ❓ Questions` section at the bottom of this file rather than guessing.

---

## ❓ Questions / Open Decisions

- (agent adds here when blocked)
