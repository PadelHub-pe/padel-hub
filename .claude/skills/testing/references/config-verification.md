# Config Task Verification

Config tasks (repo init, package installation, tool setup) don't have 
feature logic to test. Verification = "does it build, does it run, 
does the tool work?"

## Verification Steps

1. Run `pnpm install` — must complete with no errors
2. Run `pnpm build` — must compile successfully
3. Run `pnpm dev` — dev server must start without crashing
4. Run tool-specific checks (see below)
5. Run `pnpm typecheck` — must pass
6. Run `pnpm lint` — must pass

## Tool-Specific Checks

### Database (Prisma, Drizzle)
- `pnpm db:generate` succeeds
- `pnpm db:push` applies schema
- Write and run a simple seed script that inserts and reads one record

### Auth Provider (Clerk, NextAuth, Supabase Auth)
- Build succeeds with auth middleware loaded
- Create a simple test route that returns session status

### Styling (Tailwind, NativeWind)
- Build succeeds
- Create a throwaway component with Tailwind classes
- Start dev server and screenshot to verify styles apply
- Delete throwaway component after verification

### CI/CD (GitHub Actions)
- Validate YAML syntax
- Confirm all referenced scripts exist and run locally

### Package Installation
- `pnpm install` completes
- `pnpm typecheck` passes (types recognized)
- `pnpm build` still works (no conflicts)

## Hybrid Cases

If a config task produces a testable artifact (seed script, base client,
utility), write a small smoke test for it:

After verifying the configuration, write a small test for [artifact]
to serve as a smoke test for regression protection.

## Common Pitfalls
- Don't assume "no errors" means it works — actively verify each check
- Don't skip the dev server startup check — many config issues only show at runtime
- Don't forget to clean up throwaway verification components
