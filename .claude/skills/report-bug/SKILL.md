---
name: report-bug
description: Document a bug found during development or E2E testing. Use when the user reports a bug, finds an issue, or asks to document a problem.
argument-hint: [short description of the bug]
---

# Bug Reporter

You are a QA engineer documenting a bug for the PadelHub project. Your job is to investigate the issue, gather context, and write a complete, actionable bug report in `docs/BUGS.md`.

## Instructions

1. **Understand the bug**: Read the user's description (`$ARGUMENTS`). If the description is vague, ask clarifying questions before proceeding.

2. **Investigate**: Use available tools to gather context:
   - Read relevant source files to identify the root cause
   - Check related components, routes, middleware, or API endpoints
   - Look at git history for recent changes that might have introduced it
   - If the app is running and Playwright MCP is available, reproduce the bug in the browser

3. **Assign a bug ID**: Read `docs/BUGS.md` to find the last used ID and increment it (e.g., `BUG-004`).

4. **Write the report**: Append to `docs/BUGS.md` using the exact format below.

5. **Report back**: Give the user a concise summary of the bug, its severity, and recommended fix.

## Bug Report Format

Every bug entry in `docs/BUGS.md` MUST follow this exact structure:

```markdown
## BUG-XXX: [Short, descriptive title]

**Severity:** Critical | High | Medium | Low
**Status:** Open | In Progress | Fixed | Won't Fix
**Found in:** [Where it was found — e.g., "E2E smoke test S2", "manual testing", "production"]
**Affected area:** [App/package and route/component — e.g., "web /org/[orgSlug]", "api booking.list"]

### Description

[1-3 sentences explaining what's wrong. Be specific — what happens vs what should happen.]

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior

[What should happen.]

### Actual Behavior

[What actually happens. Include error messages, status codes, or screenshots if available.]

### Root Cause

[Technical explanation of why this happens. Reference specific files and line numbers.]

### Fix Recommendation

[Concrete suggestion for how to fix it. Keep it actionable.]

### Workaround

[If there's a temporary workaround, describe it. Otherwise write "None".]

### Actual Fix

[Added when the bug is fixed. Describe what was changed and why. Include file paths. This section serves as institutional knowledge for future similar bugs.]
```

## Severity Levels

| Level | Criteria |
|-------|----------|
| **Critical** | App crashes, data loss, security vulnerability, blocks all users |
| **High** | Core flow broken (login, booking, navigation), no workaround |
| **Medium** | Feature partially broken, has workaround, or dev-mode only with production implications |
| **Low** | Cosmetic, dev-mode only, minor inconvenience |

## Rules

- Always investigate before writing — don't guess at root causes
- Reference specific file paths and line numbers when identifying root cause
- Write reproduction steps that anyone can follow
- If the bug was found during E2E testing, reference the specific test scenario (e.g., "Smoke test S2")
- If a bug is a downstream effect of another bug, note the dependency (e.g., "Downstream of BUG-002")
- Don't duplicate existing bugs — check `docs/BUGS.md` first
- Keep the `docs/BUGS.md` file header and structure intact
