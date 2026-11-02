---
paths:
  - "**/*.{test,spec}.{ts,tsx,js,jsx}"
  - "server/src/**/*.ts"
  - "client/**/*.{ts,tsx}"
  - "package.json"
---

# Testing and Verification Rules

## Before Testing

- Inspect existing test files and test scripts.
- Understand the test framework and established conventions.
- Identify which behavior the change could affect.
- Check whether tests use the real database or an isolated test database.
- Never assume a test command is safe without understanding its effects.

## Test Strategy

Prefer the smallest relevant verification first:

1. Targeted unit or integration tests.
2. Relevant TypeScript checks.
3. Relevant lint checks.
4. Build checks when appropriate.
5. Broader project verification when justified.

Do not run every available check after every small change.

## Database Test Safety

- Never run destructive tests against the user's real POS database.
- Use isolated test databases for destructive operations.
- Inspect test setup and cleanup behavior before executing tests.
- Do not reset or delete databases without explicit approval.
- Preserve existing development and business data.

## Frontend Verification

When changing frontend behavior, verify relevant:

- TypeScript correctness.
- Component behavior.
- Loading, empty, and error states.
- Form validation.
- API integration.
- Responsive layout and accessibility.

Do not claim visual correctness based only on a successful build.

## Backend Verification

When changing backend behavior, verify relevant:

- Request validation.
- Authentication and authorization.
- HTTP status codes and response structures.
- Business logic.
- Database operations.
- Error handling.
- Regression behavior.

## Electron Verification

Distinguish between:

- TypeScript and build checks.
- Development-mode Electron testing.
- Packaged application testing.
- Actual Windows installer testing.

A successful build does not prove that installation, persistence,
offline operation, or printing works.

## Reporting Results

For every verification run:

- Report the exact command.
- Report whether it passed or failed.
- Include relevant error details.
- Identify checks that were skipped.
- Distinguish verified behavior from assumptions.

Never modify tests simply to hide a genuine application failure.

Never claim a feature is tested when only compilation was verified.
