# P0 Release Blockers — Cafe POS

<task_objective>
Execute the six P0 release-blocker tasks for the Cafe POS project one at a time.
Do not skip ahead. Do not claim a task is complete without evidence (logs, screenshots, or passing test output).
After each task, pause and ask the user to confirm before moving to the next.
</task_objective>

<detailed_sequence_steps>

## 1. Windows Installer Acceptance Test

1. Build the NSIS installer using the existing Electron packaging pipeline.
2. Ask the user to provide access to a clean Windows 10/11 VM (no Node, no dev tools).
3. Install the app on that VM.
4. Verify each of the following and record pass/fail with evidence:
   - App launches successfully.
   - First-run database is created.
   - PIN login works.
   - Session open and close work.
   - An order can be created and a payment recorded.
   - After a full app restart, the session persists as expected.
5. Verify uninstall removes the app cleanly without orphaned processes.
6. Write the completed test matrix into `docs/windows-installer-acceptance.md`.
7. Use `ask_followup_question` to show the result and ask whether to proceed to task 2.

## 2. Backup & Restore — End-to-End Verification

1. Reproduce the user-reported restore runtime error. Capture the full stack trace.
2. Identify and fix the root cause.
3. Test the following three scenarios and record results:
   - Create data → backup → wipe DB → restore → verify products, orders, payments, expenses, and settings are all intact.
   - Restore over an existing, non-empty database.
   - Restore from a backup created by an older schema version (coordinate with task 5 if needed).
4. Update `docs/backup-restore-runbook.md` with the actual verified steps.
5. Use `ask_followup_question` to present evidence and ask whether to proceed.

## 3. Physical Receipt Printing Validation

1. Ask the user to connect a real 58mm thermal printer.
2. Print a test receipt with multiple items, currency symbols, and an item that forces line overflow.
3. Verify layout, margins, cut behavior, and character encoding. Record pass/fail.
4. Repeat the same test on an 80mm printer.
5. Confirm that changing the paper-width setting in Settings actually changes the printed output.
6. Save evidence (photos or scans of receipts) to `docs/receipt-printing-evidence/`.
7. Use `ask_followup_question` to present results and ask whether to proceed.

## 4. Installer Trust — Signing + Branded Icon

1. Add a branded application icon: create a `.ico` file for Windows and ensure it is used in the Electron build config and installer.
2. Configure code signing if a certificate is available. If not, document the exact signing process that should be followed later and produce a clearly labelled unsigned fallback.
3. Rebuild the installer.
4. Re-run the Windows installer acceptance checklist from task 1 to confirm nothing regressed.
5. Document the signing status in `docs/installer-trust.md`.
6. Use `ask_followup_question` to present the updated installer details and ask whether to proceed.

## 5. Migration Upgrade Rehearsal on Real-Data Database

1. Obtain or create a database populated with realistic data from an older schema version.
2. Run the migration path and confirm that the migration guard triggers correctly and no data is lost.
3. Document the exact upgrade procedure a user on an old version must follow.
4. Add the procedure to `docs/migration-guard-enhancement.md`.
5. Use `ask_followup_question` to present the rehearsal results and ask whether to proceed.

## 6. Resolve PowerShell Session 401 Discrepancy

1. Attempt to reproduce the 401 error in a PowerShell cookie-session test.
2. If reproducible, capture the request/response headers and identify the cause.
3. Test the same flow inside Electron’s native window to confirm whether the issue exists there.
4. Verify that cookie attributes (SameSite, Secure, HttpOnly, path) are correct for the local Electron origin.
5. Write a finding into `docs/session-cookie-findings.md` with either reproduction steps or clear evidence that it cannot be reproduced.
6. Use `ask_followup_question` to present the final finding and confirm that all P0 tasks are done.

</detailed_sequence_steps>
