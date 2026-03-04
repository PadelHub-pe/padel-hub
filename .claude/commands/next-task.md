Read docs/TASKS.md and determine which task to work on.

## Task Selection

First, check if you're in a git worktree with a task-specific branch:
  Run: git branch --show-current

If the branch name contains a task identifier (e.g., feat/task-04, 
fix/task-12, refactor/task-07), extract the task ID and pick up 
THAT specific task from TASKS.md.

If the branch is main/master/develop or has no task identifier, 
pick the next uncompleted task in order.

If the identified task is already completed, say so and stop.

---

Show me the task details and confirm before starting.

Use the testing skill to determine the correct verification approach
for this task type, then follow this workflow:

1. [If complex] Use subagents to investigate relevant existing code
2. Apply the verification strategy from the testing skill
3. Implement and iterate until all verification passes
4. Run `pnpm typecheck` and `pnpm lint`
5. Run `pnpm test` (full suite for regressions)
6. Commit with the appropriate prefix (chore/feat/fix)
7. Check off the task in docs/TASKS.md
8. Ammend the changes from checking off the task to the last commit
