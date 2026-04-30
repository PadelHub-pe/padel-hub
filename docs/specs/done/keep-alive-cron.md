---
id: keep-alive-cron
classification: light
type: chore
status: ready
exemplars:
  - path: packages/api/src/lib/otp-store.ts
    why: Lazy Redis singleton + safe handling when env vars missing — mirror the same `getRedis()` pattern.
  - path: packages/db/src/client.ts
    why: How to obtain the shared Drizzle/postgres-js client for a one-off query.
  - path: apps/nextjs/src/app/api/auth/[...all]/route.ts
    why: Minimal Next.js App Router route handler shape used in this repo.
---

# keep-alive-cron — Hourly health-check cron pings Postgres + Redis to prevent free-tier shutdown

## Intent

Supabase free tier pauses Postgres after 7 days of inactivity, and Upstash Redis free tier eventually evicts unused databases. Add a Vercel Cron-triggered route that periodically performs a tiny query against both stores so they're never considered "idle." The route must be auth-gated (Vercel `CRON_SECRET`), report per-store status in its response, and degrade gracefully if a store is unreachable so one outage doesn't mask the other.

## Scenarios

**S-1** — Healthy ping touches both stores
  Given Postgres + Upstash env vars are configured
  And the request includes `Authorization: Bearer ${CRON_SECRET}`
  When `GET /api/cron/keep-alive` is called
  Then a `SELECT 1` is executed against Postgres
  And a `SET health:last-ping <iso-timestamp>` is executed against Redis
  And the response is `200` with body `{ ok: true, postgres: "ok", redis: "ok", timestamp }`
  Satisfaction:
    - test: packages/api/src/__tests__/keep-alive.test.ts — "pings both stores and returns ok status"

**S-2** — Unauthorized requests are rejected
  Given the route is publicly reachable
  When a request arrives without the bearer token, with a wrong token, or with no `CRON_SECRET` configured server-side
  Then the response is `401 Unauthorized`
  And no DB/Redis calls are made
  Satisfaction:
    - test: packages/api/src/__tests__/keep-alive.test.ts — "rejects requests without valid CRON_SECRET"

**S-3** — Partial failure is reported, not swallowed
  Given Redis is misconfigured or returns an error
  And Postgres responds normally
  When the cron route runs
  Then Postgres status is reported `"ok"` and Redis status is reported `"error"` with the error message
  And the HTTP status is `200` (so Vercel cron doesn't retry-storm) but `ok: false`
  And the error is `console.error`'d for log surfacing
  Satisfaction:
    - test: packages/api/src/__tests__/keep-alive.test.ts — "reports per-store failures without swallowing them"
    - judge: "Failure log line clearly identifies which store failed and includes the underlying error message."

## Constraints / Decisions

- **Host app**: `apps/nextjs` (the dashboard) — it's the most reliably deployed app and already imports `@wifo/db` + `@wifo/api`. Avoids adding a new `@upstash/redis` dependency to a different surface.
- **Pure logic in `@wifo/api`**: The keep-alive logic lives in `packages/api/src/lib/keep-alive.ts` as a pure function `runKeepAlive({ db, redis }) → { postgres, redis, ok }`. The Next.js route handler is a thin wrapper that wires deps + checks the bearer token.
- **Postgres probe**: `SELECT 1` via `db.execute(sql`select 1`)` — no schema migration needed. Supabase counts any successful query as activity.
- **Redis probe**: `await redis.set("health:last-ping", new Date().toISOString())` — no TTL, single key, idempotent overwrite.
- **Auth**: Validate `Authorization: Bearer ${process.env.CRON_SECRET}` (Vercel auto-injects this header for cron triggers when `CRON_SECRET` is set in project env). Use `crypto.timingSafeEqual` to avoid timing leaks.
- **Schedule**: Daily at 03:00 UTC (`0 3 * * *`) in `apps/nextjs/vercel.json`. Confirmed daily is enough — well inside Supabase's 7-day idle window and Upstash's idle eviction. Lives within Vercel Hobby cron limits.
- **Host project**: `apps/nextjs`. Confirmed all apps are deployed but Supabase + Upstash are shared, so a single cron in any project keeps both stores warm. Picked `apps/nextjs` because it already imports `@wifo/db` + `@wifo/api` — adding the cron there avoids pulling new deps into the bookings or admin app.
- **Failure mode**: Always return HTTP 200 with `ok: false` on partial failure so Vercel cron logs success and doesn't retry-storm. Per-store status is in the body; errors are `console.error`'d.
- **No new env vars**: Reuse `POSTGRES_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. `CRON_SECRET` is added to `apps/nextjs/src/env.ts` (server, required in production).

## Subtasks

- **T1** [feature, ~60 LOC] — Add `packages/api/src/lib/keep-alive.ts` exporting `runKeepAlive({ db, redis })` that runs `SELECT 1` + `SET health:last-ping`, returns `{ postgres, redis, ok }`, and never throws (catches each probe individually, logs errors).
- **T2** [test, ~120 LOC] — Add `packages/api/src/__tests__/keep-alive.test.ts` covering S-1, S-2 (auth check is in the handler, but the lib auth-bypass scenarios go in T4), and S-3 with mocked db + Redis. Follow `otp-store.test.ts` conventions (`vi.fn()`, factory mocks).
- **T3** [feature, ~50 LOC] — Add `apps/nextjs/src/app/api/cron/keep-alive/route.ts` exporting `GET` and `POST` handlers. Validate `Authorization: Bearer ${env.CRON_SECRET}` with `timingSafeEqual`, instantiate `Redis` from env vars (lazy, mirror `otp-store.getRedis`), call `runKeepAlive`, return JSON. Mark `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"` (postgres-js requires Node runtime).
- **T4** [test, ~80 LOC] — Add a small handler-level test (or extend `keep-alive.test.ts`) to assert the bearer-token rejection paths (missing header, wrong token, missing `CRON_SECRET` env). T4 depends on T3.
- **T5** [config, ~10 LOC] — Add `apps/nextjs/vercel.json` with `{ "crons": [{ "path": "/api/cron/keep-alive", "schedule": "0 3 * * *" }] }`. Add `CRON_SECRET` to `apps/nextjs/src/env.ts` server schema (optional in dev, required in production via env validation). Document the new env var in `.env.example` and the Environment Variables section of `CLAUDE.md`.

Dependency order: T1 → T2; T1 → T3 → T4; T5 independent.

## Definition of Done

- All scenarios pass (S-1, S-2, S-3 — tests green + judge criterion met for S-3 log clarity).
- `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm lint:ws`, `pnpm test` all green.
- `apps/nextjs/vercel.json` is valid JSON; the route appears under "Crons" in Vercel project dashboard after deploy (manual verification step — note in PR description).
- `CRON_SECRET` is documented in `.env.example` and either `CLAUDE.md` or the project memory file.
- One commit, conventional message: `chore(api): add keep-alive cron to prevent free-tier shutdown`.
