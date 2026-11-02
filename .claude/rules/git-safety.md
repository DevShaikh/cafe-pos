# Git and Data Safety

## Git Inspection

Before making changes:

- Run `git status --short --branch`.
- Inspect relevant recent commits when necessary.
- Identify existing staged, unstaged, and untracked changes.
- Never assume the working tree is clean.

## Protect User Changes

- Never discard, overwrite, or revert unrelated user changes.
- Never use `git reset --hard` without explicit approval.
- Never use `git clean` without explicit approval.
- Never use checkout or restore commands to discard user modifications.
- Never amend commits or rewrite Git history without explicit approval.
- Never force-push.
- Do not commit or push unless explicitly requested.

## Database Safety

- Never reset the development database as a shortcut.
- Never delete or rewrite committed Prisma migrations.
- Never run destructive migrations against the user's real database without explicit approval.
- Back up the database before risky schema operations.
- Test risky migrations against a separate database copy.
- Preserve existing user data.
- Investigate migration metadata inconsistencies before attempting reconciliation.

## Before Consequential Operations

Stop and explain:

1. What operation is proposed.
2. Which files, commits, or database records it could affect.
3. Whether it is reversible.
4. How backups or recovery will work.

Wait for explicit user approval before proceeding.
