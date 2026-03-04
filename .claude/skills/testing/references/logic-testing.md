# Business Logic Testing

For pure functions, utilities, shared packages, and data transformations.

## What to Write

Unit tests with vitest. These should be fast and exhaustive:
- Normal inputs produce expected outputs
- Edge cases: empty arrays, null/undefined, zero, negative numbers
- Boundary values: max/min integers, empty strings, very long strings
- Error conditions: invalid types, missing required fields
- Type safety: ensure TypeScript types are enforced at runtime with zod

## Test Organization
Group tests by function and scenario:
describe('calculatePrice', () => {
	describe('normal inputs', () => {
		it('calculates price for single item', ...)
		it('applies quantity discount', ...)
	})
	describe('edge cases', () => {
		it('returns 0 for empty cart', ...)
		it('handles negative quantities gracefully', ...)
	})
	describe('error handling', () => {
		it('throws on invalid currency', ...)
	})
})

## Running Tests
pnpm test:unit          # Unit tests only
pnpm test               # Full suite

## What "Passing" Looks Like
- All unit tests green
- Coverage on the function/module is high (aim for >90%)
- Edge cases are explicitly tested, not assumed

## Common Pitfalls
- Don't skip edge cases — this is where bugs hide in production
- Don't mock what you're testing — mock dependencies, not the subject
- Don't write tests that pass with any implementation (overly loose assertions)
- Keep tests independent — no shared mutable state between tests
