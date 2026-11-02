---
paths:
  - "electron/**/*"
  - "scripts/**/*"
  - "package.json"
  - "electron-builder.yml"
  - "electron-builder.yaml"
---

# Electron and Desktop Rules

## Product Requirements

The Cafe POS desktop application is designed for one Windows computer
and one cashier.

Preserve the local-first architecture.

Do not introduce cloud services, remote backend dependencies,
multi-computer synchronization, or distributed infrastructure.

## Existing Architecture

Before changing Electron behavior, inspect:

- electron/main.cjs
- Root package.json
- Electron build configuration
- Windows installer configuration
- Local API startup and shutdown logic
- Next.js production startup
- Bundled Node.js runtime
- Application data directory handling

Verify actual implementation rather than relying on documentation.

## Runtime and Processes

- Preserve the existing local application architecture.
- Keep backend and frontend communication on loopback.
- Handle child-process startup, readiness, failures, and shutdown safely.
- Avoid launching duplicate backend or frontend processes.
- Ensure application shutdown does not leave orphaned processes.
- Do not expose local services unnecessarily to the network.

## Data and Persistence

- Preserve the existing SQLite database location and user data.
- Do not store persistent business data inside temporary build directories.
- Preserve user photos, backups, and other application data.
- Do not clear persistent authentication or application data without
  explicit product approval.
- Test changes to application data paths carefully.

## Security

- Keep sensitive secrets out of packaged source code.
- Preserve existing authentication and security controls.
- Do not disable Electron security features to work around issues.
- Review preload, IPC, navigation, and external URL handling before changes.
- Do not expose unrestricted Node.js access to renderer code.

## Windows Packaging

Before changing installer configuration, inspect:

- electron-builder settings
- NSIS configuration
- Packaged runtime resources
- Application icons and metadata
- Install and uninstall behavior

Preserve the existing Windows packaging pipeline.

Do not claim the installer is release-ready without testing installation,
startup, persistence, and uninstallation on Windows.

## Verification

After authorized changes, use the smallest relevant checks.

Where appropriate, verify:

- Desktop application startup
- Backend and frontend readiness
- Clean application shutdown
- Database persistence across restarts
- Packaged runtime resources
- Windows installer build

Clearly distinguish development-mode tests from packaged installer tests.

Never claim physical printer compatibility without testing actual hardware.
