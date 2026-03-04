Analyze and fix the GitHub issue: $ARGUMENTS

1. Use `gh issue view` to get the issue details
2. Understand the problem described
3. Search the codebase for relevant files
4. Write a failing test that reproduces the issue
5. Implement the fix
6. Verify the test passes
7. Run full test suite for regressions
8. Commit with message "fix: [description] (closes #$ARGUMENTS)"
