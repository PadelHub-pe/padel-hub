# API / Backend Testing

For API endpoints, server logic, database operations, and middleware.

## What to Write

Integration tests that call the actual endpoint. Do NOT use mocks for
the endpoint itself (mocking external services is fine).

## Test Structure

For each endpoint, cover:
1. **Happy path** — correct input returns expected output
2. **Validation** — bad/missing input returns 400 with clear error
3. **Authentication** — unauthenticated requests return 401
4. **Authorization** — accessing another user's resource returns 403
5. **Not found** — requesting non-existent resource returns 404
6. **Edge cases** — empty lists, max-length inputs, concurrent requests

## Running Tests
pnpm test:api           # Run API tests only
pnpm test               # Full suite (run after all API tests pass)

## Sanity Check

After tests pass, also verify with curl:
curl -X POST [http://localhost:3000/api/[resource]](http://localhost:3000/api/[resource]) \
-H "Content-Type: application/json" \
-d '{"name": "test"}'

## What "Passing" Looks Like
- All integration tests green
- Response shapes match shared types
- Error responses include meaningful messages
- curl sanity check returns expected data

## Common Pitfalls
- Don't mock the database in integration tests — use a test database
- Don't forget to test response shapes, not just status codes
- Don't ignore error message quality — users will see these
- Ensure test cleanup: delete test data after each test
