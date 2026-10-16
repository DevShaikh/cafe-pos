---
mode: agent
description: Plan and implement the next approved Cafe POS development phase
---

# Plan the next Cafe POS step

Use this prompt when preparing the next small development phase of the Cafe POS project.

1. Read the root `README.md`, `.github/copilot-instructions.md`, and the relevant application files before proposing changes.
2. Identify the current roadmap phase and confirm it has been explicitly approved by the user. If it has not, stop and ask for approval; do not implement a later phase.
3. State the phase goal, scope boundaries, and files that will be created or modified. Keep the plan focused and suitable for a developer learning full-stack development.
4. Inspect existing code and dependencies; preserve working configuration and reuse established project patterns.
5. Implement only the approved phase. Keep frontend/backend boundaries, validation, error behavior, TypeScript strictness, environment configuration, and data integrity consistent with project instructions.
6. Update directly related documentation and add focused tests when appropriate for the phase.
7. Run the smallest checks that verify the actual change. Report commands and outcomes truthfully, and distinguish unverified assumptions from confirmed behavior.
8. Stop at the phase boundary and wait for approval before beginning the next roadmap step.

Current roadmap: initialization; PostgreSQL/backend foundation; product catalog; cart; checkout/saved orders; quality and polish.
