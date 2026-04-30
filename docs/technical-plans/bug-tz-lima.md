# bug-tz-lima — Technical Plan

> Companion spec: `docs/specs/bug-tz-lima.md`.
>
> This document captures the architecture, decisions, and risks behind the timezone fix.
> The spec captures *what* and *how it's verified*; this doc captures *why*.

---

## 1. Context

### What we observed

User reported on **2026-04-29 ~09:30 PET (Wed)** that the production dashboard rendered:

> "Jueves, 30 de abril de 2026"

…and "Reservas Hoy: 1" showing a booking that should be tomorrow's.

### Why it's a class of bugs, not one bug

Four parallel audits confirm the same pattern across the entire codebase:

- `apps/nextjs/src/components/dashboard/dashboard-header.tsx:8-14` — `new Date().toLocaleDateString("es-PE", …)` with no `timeZone` option. `es-PE` controls the **language**, not the timezone. On Vercel (UTC runtime), the rendered day rolls forward 5 hours ahead of Lima. **Likely** also being statically cached because `page.tsx:16` has no `dynamic` / `revalidate` directive.
- `packages/api/src/router/dashboard.ts:56-61, 194-196` — `startOfDay(new Date())` is server-TZ-local (UTC on Vercel). The "today" boundary is UTC midnight, not Lima midnight.
- `packages/api/src/router/calendar.ts:137-139, 182, 320, 453-454, 529-530` — every `getDayView`, `getWeekView`, `getDayStats`, `getMonthBookingDates` query uses unzoned `startOfDay`/`startOfMonth`/`startOfWeek`.
- `packages/api/src/router/booking.ts:269-275, 598-599, 773, 1059-1060, 1172-1173` — booking list, slot info, calculate price, manual booking creation: all unzoned.
- `packages/api/src/router/schedule.ts:433-434, 505-506, 570, 619-620` — blocked-slot query windows, conflict checks, day-overview.
- `packages/api/src/utils/booking-status.ts:45-50` — `buildDateTime` uses `dt.setHours(...)` (server-local). Booking auto-transitions (`confirmed → in_progress → completed`) fire 5 hours early in production.
- `packages/db/src/schema.ts` — every `timestamp(...)` column omits `withTimezone: true`. **Critically**, `bookings.date` (`:453`) and `blocked_slots.date` (`:376`) are typed `timestamp` but semantically calendar-day. Drizzle generates `timestamp without time zone` in Postgres, which round-trips through whatever the JS runtime calls "midnight."
- `packages/db/src/client.ts` — postgres-js connection makes no `SET TIME ZONE` call, so the session inherits the Postgres server default (UTC on Supabase).
- **Public bookings app** has the additional risk of *hydration mismatch*: server parses `new Date("2026-04-29T00:00:00")` as UTC-local (UTC on Vercel), client's `parseISO("2026-04-29")` parses as UTC midnight, browser's `format(...)` formats in browser-local. Three different "as-of" dates for one URL param. React Query cache keys diverge across server/client → re-fetches on hydrate. `success-page.tsx:69` formatting `parseISO(booking.date)` displays the wrong day (day-of-bug already reproducible in Lima).

### Existing patterns

**One** zoned helper exists: `getLimaDayOfWeek(date)` in `packages/api/src/utils/schedule.ts:19-21`, used by ~6 call sites for day-of-week resolution. **`getAvailableSlots`** in `public-booking.ts:347-355` correctly uses `toZonedTime(new Date(), "America/Lima")` for "now" filtering. These two are the only places the zone is honored.

`CLAUDE.md` already documents the intended pattern (Date Handling section) — the codebase has drifted from its own docs.

### Constraints from existing architecture

- **Single-locale product**: the entire platform is Lima-only (PEN, es-PE, no other markets planned per `PRD.MD`). This makes "pin the runtime TZ" a viable defense-in-depth strategy that wouldn't fly for a multi-region app.
- **Vercel serverless runtime**: defaults to `TZ=UTC`. Supports the `TZ` environment variable to override on a per-project basis.
- **Database**: Supabase Postgres, server TZ = UTC. Connection is via `postgres-js`; supports `SET TIME ZONE` per session.
- **Drizzle**: schema is pushed via `pnpm db:push` (no SQL migration files in `packages/db/drizzle/`). Migrations to column types must be done carefully — `db:push` does best-effort destructive changes by default.
- **`.date` columns store wall-clock midnights**: existing rows in `bookings.date` and `blocked_slots.date` are stored as `YYYY-MM-DD 00:00:00` interpreted as UTC. Once we change the runtime/DB TZ, they'll be reinterpreted as Lima — for rows whose creator was on a Vercel UTC runtime, this means *the stored date is one day ahead of what the creator intended* in some cases. Migration must consider this.

---

## 2. Architecture Decisions

### Decision 1: Two-layer defense (revised)

Originally planned three layers; layer 1 turned out to be impossible on Vercel. Verified at implementation time: `vercel env add TZ` returns `api_error: "The name of your Environment Variable is reserved."` Vercel pins runtime TZ to UTC and offers no override. We accept the loss of the safety net — the helpers do the heavy lifting and tests prove it.

| Layer | Mechanism | Coverage | Risk |
|---|---|---|---|
| ~~Runtime TZ pin~~ | ~~`TZ=America/Lima` env var on every Vercel project~~ | **Not available on Vercel** — `TZ` is a reserved name; API rejects it. Still useful in local `.env` for dev parity. | n/a |
| **DB session TZ** | `SET TIME ZONE 'America/Lima'` in `postgres-js` connection options | Aligns Postgres `now()`, `current_date`, default expressions with Lima | Any direct `psql` access still defaults to server TZ — ops awareness needed |
| **Zoned helpers + audited call sites** | New `packages/api/src/lib/datetime.ts` exporting `limaNow()`, `startOfLimaDay(d)`, `endOfLimaDay(d)`, `parseLimaDateParam(s)`, `formatLimaDate(d, fmt)`, `LIMA_TZ` | Makes the boundary explicit at every site; tests run with `TZ=UTC` to prove zone-correctness | Refactor surface ~40 sites; risk of missed sites |

The helpers + Postgres session TZ are sufficient. Tests under `TZ=UTC` prove zone-correctness independent of host TZ — production correctness rests on the code, not the runtime config.

### Decision 2: Schema column type changes — staged and gated

`bookings.date` and `blocked_slots.date` are semantically `DATE`, not `timestamp`. The right Postgres type is `date`. **However**, this is a destructive migration (`timestamp → date` drops the time component) and requires a data backfill considering the existing rows' UTC-interpretation.

**Plan**: gate this behind a separate subtask (T-09) that's optional for the immediate user-visible fix. Steps 1–8 alone will resolve the dashboard bug and stop further drift; T-09 corrects the schema for the long term.

`*_at` columns (`created_at`, `updated_at`, etc.) — agree with the audit that they should be `withTimezone: true`, but this is **non-urgent** because the values being stored are real instants and round-trip correctly even as `timestamp without time zone` (the bug is in the *type*, not the data). Defer to T-10 (out-of-immediate-scope).

### Decision 3: No new `@wifo/datetime` package

The audit's recommendation to create a package is overkill for ~5 helper functions. Place them in `packages/api/src/lib/datetime.ts` and re-export from `packages/api/src/index.ts` so apps (which already depend on `@wifo/api`) can import. Reduces blast radius; matches the existing pattern (`schedule.ts` lives in `packages/api/src/utils/`).

### Decision 4: Helper API surface (final)

```ts
// packages/api/src/lib/datetime.ts
export const LIMA_TZ = "America/Lima";

// Returns a Date instance whose timestamp is "now" but whose getFullYear/getMonth/getDate
// match the Lima wall clock. Use for date-of-day arithmetic only — NOT for storing.
export function limaNow(): Date;

// Lima-zoned start/end of day. Returns a real instant (UTC).
export function startOfLimaDay(date: Date): Date;
export function endOfLimaDay(date: Date): Date;

// Parses a "YYYY-MM-DD" URL/form param as Lima-local midnight (real instant).
// Throws on invalid input.
export function parseLimaDateParam(yyyyMmDd: string): Date;

// Formats a Date in Lima TZ with date-fns-tz formatInTimeZone, locale=es by default.
export function formatLimaDate(date: Date, fmt: string, locale?: Locale): string;

// Construct a real instant from a Lima wall-clock date + HH:MM time string.
// Replacement for the broken `setHours` pattern in booking-status.ts.
export function buildLimaDateTime(date: Date, hhmm: string): Date;
```

### Decision 5: Dashboard page must be dynamic

`apps/nextjs/.../facilities/[facilityId]/page.tsx` should declare `export const dynamic = "force-dynamic"` (or `revalidate = 0`) to prevent the rendered date from going stale across requests. Without this, even after we fix the TZ, the static render captured at deploy time can be served indefinitely.

### Decision 6: Tests run under `TZ=UTC`

Vitest config sets `process.env.TZ = "UTC"` at test bootstrap, so unit tests catch any naive `new Date()` slipping back in. We keep production runtime at `TZ=America/Lima`, but tests prove the code is zone-agnostic. (This is the inverse of "tests pass on my machine because it's Lima" — explicit zone diversity in CI.)

---

## 3. Risk Assessment

### Blast radius

- **Every booking flow**: list, create, confirm, cancel, status auto-transitions, calendar view, dashboard.
- **Every schedule flow**: operating hours, peak periods, blocked slots, day overview.
- **Every public booking flow**: facility landing, slot selection, confirmation, success, mis-reservas.
- **WhatsApp notifications**: `sendBookingConfirmation` formats date with `getUTC*` getters today (`public-booking.ts:675-683`) — change must be coordinated with whatever shape the booking date now arrives in.
- **iCal/Google Calendar export**: `calendar-link.tsx` already passes `ctz=America/Lima`; should be unaffected after fix but should be re-verified.

### Migration complexity (T-09 only)

Existing booking rows store `bookings.date` as `YYYY-MM-DD 00:00:00 UTC`. After we pin runtime to Lima, existing reads will reinterpret these instants as `YYYY-MM-(DD-1) 19:00:00 PET`. The dashboard "today" query will skip them.

**Backfill strategy**: one-shot SQL during T-09 — `UPDATE bookings SET date = date + interval '5 hours'` (or equivalent), executed in a transaction with audit log. Same for `blocked_slots`. Must run **before** the runtime TZ flip on the same deploy, or **after** with a feature gate.

**Simpler alternative**: convert `bookings.date` to `text` `YYYY-MM-DD` (no instant ambiguity). Clean but has its own downstream impact (Drizzle types change, all consumers must adopt the string). Defer this decision — T-09 will compare both options against actual data.

### External dependencies

- **Vercel**: must verify `TZ=America/Lima` is honored by the runtime on every project. Documented + supported, but verify by reading `process.env.TZ` from a debug endpoint after deploy.
- **Supabase**: `SET TIME ZONE 'America/Lima'` is a session-scoped command; needs to run on every connection. postgres-js supports `connection.timezone`.
- **Kapso (WhatsApp)**: receives a formatted date string — unaffected by the underlying fix as long as we pass it correctly.

### Performance

Negligible. `formatInTimeZone` and `toZonedTime` are pure-JS calculations from `date-fns-tz`, no I/O.

### What could break

- **Booking auto-transitions running on existing rows** before T-09 backfill: the `buildLimaDateTime` fix means `start_time` 06:00 will now mean 06:00 PET. For rows where the **stored date** is already off by one (because they were inserted under UTC interpretation), the transition will fire on the wrong calendar day. Mitigated by running T-09 alongside or before T-08.
- **Cached dashboard renders**: server components with no `dynamic` directive may serve a date from the moment of build. Force-dynamic + revalidate-on-request fixes this.
- **Local dev TZ drift**: developer machines outside America/Lima will see different "today"s than production. Mitigated by adding `TZ=America/Lima` to root `.env.example`.

---

## 4. Task Breakdown

See `docs/specs/bug-tz-lima.md` for the spec view (scenarios, satisfaction criteria, holdouts). The subtasks below appear in dependency order.

| # | Type | Title | Depends on | Est. LOC |
|---|---|---|---|---|
| T-01 | feature | New `packages/api/src/lib/datetime.ts` helpers + unit tests | — | ~150 |
| T-02 | config | Pin Vercel runtime TZ + DB session TZ + `.env.example` | T-01 | ~30 |
| T-03 | bug-fix | Fix `dashboard-header.tsx` and add `dynamic = "force-dynamic"` to dashboard page | T-01 | ~10 |
| T-04 | refactor | Migrate `dashboard.ts` router to zoned helpers | T-01 | ~40 |
| T-05 | refactor | Migrate `calendar.ts` router to zoned helpers | T-01 | ~80 |
| T-06 | refactor | Migrate `booking.ts` and `schedule.ts` routers to zoned helpers | T-01 | ~120 |
| T-07 | refactor | Migrate public-bookings UI (server pages + components) to zoned helpers, eliminate hydration drift | T-01 | ~100 |
| T-08 | bug-fix | Fix `buildDateTime` in `booking-status.ts` → `buildLimaDateTime` | T-01 | ~20 |
| T-09 | refactor + migration | Schema: `bookings.date` and `blocked_slots.date` → `date` type, with backfill | T-04, T-05, T-06, T-08 | ~200 |
| T-10 | test | Vitest config: pin `TZ=UTC` for tests; add zone-divergence tests | T-04..T-08 | ~80 |
| T-11 | docs | Update `CLAUDE.md` "Date Handling" section to reference new helpers + lint rule | all | ~30 |

**T-01..T-08 are sufficient to fix the user-visible bug** ("Jueves 30 de abril de 2026" → correct date). T-09–T-11 harden the system long-term.

Each subtask is sized for one Claude session (~15–30 min). T-09 is the largest and may need to be split if data backfill turns up surprises.

---

## 5. Open Questions

1. **Schema migration shape (T-09)**: `text "YYYY-MM-DD"` vs Postgres `date`? `date` is type-safer; `text` is unambiguous. Defer until T-09 inspection of real data.
2. **Eslint rule to forbid raw `new Date()` in router code?** Custom rule with allowlist (e.g. `lib/datetime.ts`). Worth doing in T-11 if cheap; else punt.
3. **Should the helpers live in a separate `@wifo/datetime` package?** Decision 3 says no — but if `apps/landing` (Astro) ends up needing them, revisit. Currently landing has only one date use (`access_requests.created_at` display) and can format inline.
