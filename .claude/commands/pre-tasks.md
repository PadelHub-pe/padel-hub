Analyze docs/TASKS.md and determine which upcoming tasks can run in parallel.

## Step 1: Identify Next Uncompleted Tasks

Read docs/TASKS.md and list all uncompleted tasks. For each task, note:

- Task ID and title
- Task type (config/feature/bug-fix/refactor/upgrade)
- Explicit dependencies ("depends on TASK-XX")

## Step 2: Detect Implicit Dependencies

Even without explicit "depends on" markers, tasks conflict if they:

- Touch the same files (two tasks editing the same component/route/schema)
- Have data dependencies (task B reads what task A creates)
- Share infrastructure (both need a migration, both modify the same config)

Use subagents to investigate:

- Subagent per task: read the relevant code paths and list which files
  each task will likely create or modify

Produce a dependency map:

- TASK-XX → depends on [TASK-YY, TASK-ZZ] (reason)
- TASK-XX → independent

## Step 3: Group into Parallel Batches

Organize tasks into sequential batches where tasks within a batch
have NO dependencies on each other:

```
Batch 1 (parallel): TASK-04, TASK-05     ← no conflicts
Batch 2 (parallel): TASK-06, TASK-07     ← both depend on batch 1
Batch 3 (sequential): TASK-08            ← depends on TASK-06 + TASK-07
```

Flag any risky parallelization: "These CAN run in parallel but both
touch [area] — review merge carefully."

## Step 4: Read Worktree Config

Read .claude/worktree.json for this project's worktree setup requirements.
Use it to generate the correct setup commands in Step 5:

- "copy": files to cp from main project into each worktree
- "install": dependency install command to run
- "postSetup": commands to run after install (DB generation, etc.)
- "verify": health check to confirm worktree is ready

If .claude/worktree.json doesn't exist, fall back to auto-detection:
check .gitignore for .env files, detect package manager from lockfile.

## Step 5: Generate Worktree Commands

For each parallel batch, output copy-pasteable commands.
Replace [project] with the actual directory name.
Use the task type to determine branch prefix (feat/fix/refactor/chore).

### Create Worktrees

```bash
# From your main project directory:

# --- TASK-XX ---
git worktree add ../[project]-task-XX -b feat/task-XX
cp .env ../[project]-task-XX/.env
# (repeat for each file in worktree.json "copy")
cd ../[project]-task-XX
pnpm install
# (run each command in worktree.json "postSetup")
cd -

# --- TASK-YY ---
git worktree add ../[project]-task-YY -b fix/task-YY
cp .env ../[project]-task-YY/.env
cd ../[project]-task-YY
pnpm install
cd -
```

### Launch Claude Instances (one terminal per task)

```bash
# Terminal 1:
cd ../[project]-task-XX && claude
# Claude will auto-detect branch feat/task-XX and pick up TASK-XX

# Terminal 2:
cd ../[project]-task-YY && claude
# Claude will auto-detect branch fix/task-YY and pick up TASK-YY
```

### Rebase Back (after all tasks in batch complete)

```bash
cd /path/to/main/project

# Rebase each branch
git rebase feat/task-XX
git rebase fix/task-YY      # resolve conflicts if any

# Verify the merged result
pnpm install                # in case dependencies changed
pnpm typecheck
pnpm test                   # full suite — catch integration issues

# Clean up
git worktree remove ../[project]-task-XX
git worktree remove ../[project]-task-YY
git branch -d feat/task-XX
git branch -d fix/task-YY
```

## Step 6: Summary

Present:

1. The batch plan (which tasks in which order)
2. The risk assessment (merge conflict hotspots)
3. The full command block ready to copy-paste (with actual values, not placeholders)
4. Estimated time savings vs sequential execution

Do NOT start any tasks. Just produce the plan and commands.
