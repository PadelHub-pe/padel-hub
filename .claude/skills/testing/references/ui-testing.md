# Web UI Testing

For React components, pages, forms, and visual layouts using Next.js.

## What to Write

Two layers of verification:

### Layer 1: Behavior Tests (React Testing Library)
Test component logic and user interactions:
- Renders expected content
- Form inputs accept and validate data
- Buttons trigger expected actions
- Loading, error, and empty states render correctly
- Conditional rendering works based on props/state

### Layer 2: Visual Verification (Playwright MCP)
After implementation, use Playwright to visually verify:
- Navigate to the running dev server
- Take a screenshot of the component/page
- Verify layout looks correct
- If it looks wrong, iterate and screenshot again

For critical user flows, write Playwright e2e tests:
1. Navigate to [page]
2. Fill form with [test data]
3. Submit and verify [expected result]
4. Check redirects and state updates

## Running Tests
pnpm test:web           # Component tests
pnpm test:e2e           # Playwright e2e tests (if configured)
pnpm test               # Full suite

## Screenshot Checklist
When taking visual screenshots, verify these states:
1. Empty state (no data loaded)
2. Loading state (data fetching)
3. Populated state (normal data)
4. Error state (API failure)
5. Responsive: desktop and mobile widths (if applicable)

## What "Passing" Looks Like
- All RTL behavior tests green
- Visual screenshots show correct layout
- E2e tests for critical flows pass
- Accessibility: interactive elements are reachable by keyboard

## Common Pitfalls
- Don't test implementation details (internal state) — test what the user sees
- Don't skip the visual check — tests can pass while the UI looks broken
- Don't forget loading/error/empty states in both tests and screenshots
- Always start the dev server before Playwright screenshots

