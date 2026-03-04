---
name: testing
description: >
  Automated testing and verification strategy for all task types.
  Use this skill whenever writing tests, verifying implementations,
  checking configurations, running test suites, or when the user
  mentions "test", "verify", "check", "QA", "passing", "failing",
  "coverage", or "regression". Also use when working on any task
  from TASKS.md to determine the correct verification approach.
---

# Testing & Verification Skill

This skill determines the right verification approach based on task type
and provides detailed guidance for writing and running tests.

## Core Principles (Apply to ALL task types)

1. **Claude verifies its own work.** Never ask the user to manually test.
2. **Tests are the proof.** A task is not done until verification passes.
3. **Fix the code, not the tests.** If a test fails, the implementation is wrong (unless the test itself has a bug in its logic).
4. **Run the full suite.** After any change, run `pnpm test` to catch regressions.
5. **Typecheck and lint.** Always run `pnpm typecheck` and `pnpm lint` before committing.

## Step 1: Determine Task Type

Read the task description and classify it:

| Task type | How to recognize it | Verification approach |
|---|---|---|
| **Config** | Repo init, package install, tool setup, env config, CI/CD | Read `references/config-verification.md` |
| **API / Backend** | API endpoints, server logic, database operations, middleware | Read `references/api-testing.md` |
| **Web UI** | React components, pages, forms, visual layouts | Read `references/ui-testing.md` |
| **Mobile** | React Native screens, Expo components, navigation | Read `references/mobile-testing.md` |
| **Business Logic** | Pure functions, utilities, shared packages, data transforms | Read `references/logic-testing.md` |

If a task spans multiple types (e.g., full-stack feature with API + UI),
load BOTH relevant reference files and apply each to its layer.

## Step 2: Load the Reference and Follow Its Guidance

Each reference file contains:
- What tests to write
- How to run them
- What "passing" looks like
- Common pitfalls to avoid

## Step 3: Verify and Report

After all verification passes:
1. Confirm: all tests green, typecheck clean, lint clean, full suite passes
2. Commit the task
3. Report what was verified (e.g., "12 integration tests passing, 
   typecheck clean, no regressions in 47 existing tests")
