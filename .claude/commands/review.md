Review all uncommitted changes in the working tree:
1. Run `git diff` to see what changed
2. Check for: security issues, missing error handling, type safety, test coverage
3. Verify code follows our CLAUDE.md conventions
4. Run `pnpm typecheck && pnpm lint && pnpm test`
5. Summarize findings and suggest fixes
