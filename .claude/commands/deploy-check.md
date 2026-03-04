Pre-deployment checklist:
1. Run full test suite: `pnpm test`
2. Run type check: `pnpm typecheck`
3. Run lint: `pnpm lint`
4. Attempt production build: `pnpm build`
5. Check for debug code:
   grep -r "console.log" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."
6. Verify .env.example is up to date
7. Report results with pass/fail for each step
