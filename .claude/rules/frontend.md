---
paths:
  - "client/**/*.{ts,tsx,js,jsx,css}"
---

# Frontend Development Rules

## Technology

Preserve the existing frontend stack:

- Next.js App Router
- React
- TypeScript with strict typing
- Tailwind CSS
- shadcn/ui and Radix UI
- Zustand
- TanStack Query
- Axios

Do not introduce alternative libraries or state-management systems without approval.

## Architecture

- Keep frontend code inside the established client directory structure.
- Follow existing conventions in app/, components/, lib/, store/, and types/.
- Keep API communication inside the established API/client layer.
- Never import Prisma, SQLite, backend services, or server-only modules into browser code.
- Use the existing Next.js proxy for browser-to-backend communication.
- Respect server/client component boundaries.
- Add "use client" only when client-side functionality requires it.

## Components and UI

- Reuse existing components before creating new ones.
- Follow existing shadcn/Radix UI patterns.
- Use cn() from @/lib/utils for conditional class names.
- Prefer existing semantic CSS variables and design tokens.
- Maintain responsive layouts and existing visual consistency.
- Avoid unnecessary component abstractions and duplicated UI logic.
- Do not redesign unrelated screens.

## Data and State

- Use TanStack Query for server state following existing project patterns.
- Use Zustand only for the client state already assigned to it.
- Do not duplicate server data unnecessarily in local state.
- Follow existing Axios configuration and API response conventions.
- Handle loading, empty, error, and success states explicitly.
- Validate assumptions about API response shapes against actual backend code.

## Forms and Validation

- Follow existing form patterns.
- Reuse shared schemas and validation where appropriate.
- Display actionable validation and API errors.
- Prevent duplicate submissions where necessary.
- Do not silently swallow failed requests.

## Performance and Accessibility

- Avoid unnecessary re-renders and expensive client-side operations.
- Use Next.js features according to the installed version.
- Preserve keyboard accessibility and semantic HTML.
- Follow existing image, font, and metadata conventions.
- Do not introduce caching behavior without understanding its effect.

## Before Editing

- Inspect the relevant page, components, hooks, and API calls.
- Check nearby implementations for established patterns.
- Read applicable installed Next.js documentation when the task involves
  version-specific framework behavior.
- Verify any referenced instruction or documentation file exists before
  relying on it.

## Verification

- Run the smallest relevant frontend checks.
- Check TypeScript and lint results where applicable.
- Inspect the final diff for unintended UI or behavior changes.
