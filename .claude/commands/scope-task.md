Scope the following task: $ARGUMENTS

## Step 1: Classify and Assess Complexity

Read the relevant existing code, then classify the task:
- **Type**: new feature, bug fix, refactor, or dependency upgrade?
- **Complexity**: how many files, layers, and systems does it touch?

Use these signals to determine complexity:

LIGHT scope (single-layer, <5 files, no architectural decisions):
- Bug fix in one module
- Small feature adding one endpoint + one UI component
- Refactor within a single package
- Dependency upgrade with no breaking changes
→ Go to Step 2A

DEEP technical plan (multi-layer, >5 files, architectural decisions needed):
- Feature spanning backend + frontend + database changes
- New system integration (payments, notifications, auth overhaul)
- Feature requiring new data models or schema migrations
- Work that will produce more than 5 subtasks
- Anything where "how should we architect this?" is a real question
→ Go to Step 2B

Tell me which mode you're using and why before proceeding.

## Step 2A: Light Scope

1. Read relevant existing code that this task touches
2. Identify blast radius: what files, tests, and features could be affected
3. Look for similar patterns in the codebase (how was this done before?)
4. Plan the implementation as ordered subtasks (1-5 tasks)
5. Flag risks or questions that need answering before implementation
6. Write the plan to docs/TASKS.md (or append to existing)

Do NOT start implementing yet. Just plan.

## Step 2B: Deep Technical Plan

Use subagents to investigate the codebase in parallel:
- Subagent 1: Map the existing architecture relevant to this feature
- Subagent 2: Read related data models, schemas, and migrations
- Subagent 3: Identify existing patterns for similar features
- Subagent 4: Check test infrastructure and integration points

Then produce a docs/TECHNICAL_PLAN.md covering:

### 1. Context
- What exists today that this feature touches
- What patterns and conventions must be followed
- What constraints the existing architecture imposes

### 2. Architecture Decisions
- What new components/modules are needed
- How they integrate with existing code
- Data model changes (new tables, columns, relations)
- API contract changes (new endpoints, modified responses)
- State management approach (if UI-heavy)

### 3. Risk Assessment
- What existing features could break (blast radius)
- Migration complexity (if schema changes)
- External dependencies or integrations
- Performance implications

### 4. Task Breakdown
Generate a docs/TASKS.md with:
- Ordered subtasks respecting dependencies
- Each task tagged with type (config/feature/bug-fix/refactor)
- Each task small enough for one Claude session
- Database/schema tasks before API tasks before UI tasks
- Explicit dependency markers: "depends on TASK-XX"

Present the technical plan for review before generating TASKS.md.
Do NOT start implementing yet.
