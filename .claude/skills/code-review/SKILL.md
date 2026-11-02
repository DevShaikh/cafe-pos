---
name: code-review
description: Review Cafe POS code changes or a Git diff for bugs, regressions, security issues, and architectural violations. Use after implementation.
---

# Code Review

## Objective
Review changes critically without modifying the code.

## Procedure
1. Inspect git status and the complete relevant diff.
2. Identify changed files and their purpose.
3. Read surrounding source code.
4. Trace affected application workflows.
5. Check frontend/backend contracts.
6. Check validation, authentication, and authorization.
7. Check database integrity and transaction handling.
8. Check financial calculations and POS behavior.
9. Inspect error handling and edge cases.
10. Review relevant tests and verification results.

## Review Priorities
Look for:
- Incorrect business logic.
- Regressions.
- Data loss or corruption.
- Security vulnerabilities.
- Missing validation.
- Incorrect money calculations.
- Broken API contracts.
- Unnecessary complexity.
- Missing tests.
- Unintended changes outside approved scope.

## Report
List findings by severity:
- Critical
- High
- Medium
- Low

For each finding include file, location, problem, impact, and suggested correction.

If no findings are identified, state that clearly and mention remaining testing limitations.

## Restrictions
- Do not modify files.
- Do not automatically fix findings.
- Do not commit or push.
- Do not approve unverified behavior.

Wait for the user's decision.
