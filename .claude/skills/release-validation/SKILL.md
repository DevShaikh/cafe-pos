---
name: release-validation
description: Assess Cafe POS Windows desktop and installer release readiness through read-only inspection and safe, explicitly authorized verification.
---

# Release Validation

## Objective
Assess whether the Cafe POS is ready for Windows distribution.

## Procedure
1. Read project status and Electron rules.
2. Inspect Git state and recent changes.
3. Inspect root package scripts and dependencies.
4. Inspect Electron startup and shutdown behavior.
5. Inspect bundled Node.js runtime and production server startup.
6. Inspect application data and SQLite persistence paths.
7. Inspect installer and NSIS configuration.
8. Inspect backup and restore implementation.
9. Inspect authentication and cookie behavior.
10. Review printer integration and receipt retry behavior.
11. Inspect tests and previous validation evidence.
12. Identify missing release checks.

## Validation Categories
Assess:
- Development startup.
- Production build.
- Packaged application startup.
- First-run setup.
- Authentication persistence.
- Database persistence across restarts.
- Offline operation.
- Backup and restore.
- Installer and uninstaller.
- Upgrade behavior.
- Printer compatibility.
- Security and dependency advisories.

## Report
Present:
- Verified working areas.
- Known failures.
- Unverified areas.
- Release blockers.
- Important risks.
- Recommended validation sequence.

Clearly distinguish successful builds from actual installer testing.

## Restrictions
- Start with read-only inspection.
- Never install or uninstall the user's application without approval.
- Never modify production databases.
- Never perform destructive migration tests.
- Never claim physical hardware compatibility without testing.
- Ask before running checks that could modify application data.

Stop after presenting the release assessment.
