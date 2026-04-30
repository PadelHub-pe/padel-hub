---
id: bug-tz-lima
classification: deep
type: fix
status: ready
exemplars:
  - path: packages/api/src/utils/schedule.ts
    why: Existing zoned helper `getLimaDayOfWeek` — mirror its `toZonedTime(..., LIMA_TZ)` pattern in the new datetime module
  - path: packages/api/src/router/public-booking.ts
    why: Lines 343-355 use `toZonedTime(new Date(), LIMA_TZ)` correctly for "now" in slot filtering — the only correct example in a router today
  - path: packages/api/src/utils/slots.ts
    why: Pure function with caller-supplied `nowMinutes` / `dayOfWeek` — pattern to follow for new helpers (no hidden Date.now dependencies)
---

# bug-tz-lima — Production dashboard renders the wrong day; timezone handling is systemically broken

## Intent

The web dashboard rendered "Jueves, 30 de abril de 2026" on **2026-04-29 ~09:30 PET** because every server-side date computation runs in UTC instead of America/Lima. Audits confirm the same bug class spans schema (`timestamp without time zone` for calendar dates), DB connection (no session TZ), every tRPC router (`startOfDay(new Date())` is unzoned), the public-bookings app (mismatched server/client/hydration date parsing), and booking auto-status transitions (firing 5 hours early). We will fix it in three layers: pin runtime TZ to America/Lima, introduce a small set of zoned helpers (`limaNow`, `startOfLimaDay`, `parseLimaDateParam`, `formatLimaDate`, `buildLimaDateTime`), and migrate every known site. See `docs/technical-plans/bug-tz-lima.md` for architectural rationale.

## Scenarios

**S-1** — Dashboard header reflects Lima wall clock
  Given the system is deployed to a Vercel runtime that defaults to UTC
  And the actual Lima wall clock is **Wednesday, 2026-04-29 09:30 PET**
  When a user requests `/org/<slug>/facilities/<id>` (the facility dashboard)
  Then the rendered header reads "Miércoles, 29 de abril de 2026"
  And the "Reservas Hoy" card counts bookings whose `date` falls on Lima 2026-04-29
  Satisfaction:
    - test: `apps/nextjs/src/components/dashboard/__tests__/dashboard-header.test.tsx` — render the component with `TZ=UTC` and a mocked clock at `2026-04-29T14:30:00Z`, assert "Miércoles, 29 de abril de 2026"
    - test: `packages/api/src/__tests__/dashboard.test.ts` — `TZ=UTC`, mock now at `2026-04-30T03:00:00Z` (= 22:00 PET, 2026-04-29), call `dashboard.getStats`, assert the day window is `[2026-04-29 05:00 UTC, 2026-04-30 05:00 UTC)` not `[2026-04-30, 2026-05-01)`

**S-2** — Booking auto-transitions fire on Lima wall clock
  Given a confirmed booking on Lima 2026-04-29 with `start_time = "06:00"`
  When the server clock is `2026-04-29T10:30:00Z` (= 05:30 PET, before kickoff)
  Then the booking remains `confirmed`
  When the server clock advances to `2026-04-29T11:00:00Z` (= 06:00 PET)
  Then the booking transitions to `in_progress`
  Satisfaction:
    - test: `packages/api/src/__tests__/booking-status.test.ts` — extend existing zone tests to cover `buildLimaDateTime` and the new transition boundary

**S-3** — Public bookings: same date everywhere on the round trip
  Given a user navigates to `/<facilitySlug>?date=2026-04-30`
  When the page renders on the server (Vercel UTC) and hydrates on the client (any browser TZ)
  Then the date strip, slot grid, confirmation summary, success page, mis-reservas card, and WhatsApp confirmation **all** display "30 de abril 2026" / "miércoles 30 de abril" / Lima 2026-04-30
  And no React Query cache key drifts between server prefetch and client read
  Satisfaction:
    - test: `apps/bookings/src/__tests__/date-roundtrip.test.tsx` — render server page with `TZ=UTC` then hydrate with `TZ=America/Los_Angeles`, snapshot all six surfaces, assert string equality
    - judge: "On hydrate, no console warning about hydration mismatch is logged for date-bearing nodes"

**S-4** — Calendar day boundaries respect Lima
  Given a booking inserted at `2026-04-29T23:30:00 PET` (= 2026-04-30T04:30:00Z) with `date = 2026-04-29` and `start_time = "23:30"`
  When `calendar.getDayView({ date: '2026-04-29' })` runs on a UTC server
  Then the booking appears in the day's results
  And `calendar.getDayView({ date: '2026-04-30' })` does **not** include it
  Satisfaction:
    - test: `packages/api/src/__tests__/calendar.test.ts` — add cases at the Lima-midnight boundary; run the suite under `TZ=UTC`

**S-5** — Slot generation "now" cutoff respects Lima
  Given a Lima time of 2026-04-29 09:30 PET
  When `publicBooking.getAvailableSlots({ date: '2026-04-29' })` runs
  Then slots starting before 09:30 PET are filtered out (already correct today, must remain correct)
  And slots starting at or after 09:30 PET are returned
  Satisfaction:
    - test: `packages/api/src/__tests__/slots.test.ts` — keep existing zoned-now test green; add a regression test that fails if `nowMinutes` is computed from un-zoned `new Date()`

**S-6** — Helpers are pure and testable
  Given `TZ=UTC` in the test environment
  When unit tests call `startOfLimaDay(new Date('2026-04-30T00:00:00Z'))` (Lima 2026-04-29 19:00)
  Then the result is `new Date('2026-04-29T05:00:00Z')` (Lima 2026-04-29 00:00)
  And `parseLimaDateParam('2026-04-30')` returns `new Date('2026-04-30T05:00:00Z')`
  And `formatLimaDate(new Date('2026-04-30T04:59:59Z'), 'yyyy-MM-dd')` returns `'2026-04-29'`
  Satisfaction:
    - test: `packages/api/src/__tests__/datetime.test.ts` — covers each helper at DST-irrelevant Lima boundaries (Lima does not observe DST, but tests should still document this)

## Holdout Scenarios

> Do **not** show these to the implementing agent during iteration — they exist to catch overfitting. Verified at the end against the final implementation.

**H-1** — Concurrent booking creation across Lima midnight
  Given two players concurrently book the same court at `2026-04-29T23:55:00 PET` and `2026-04-30T00:05:00 PET`
  When both `createBooking` calls execute
  Then the two bookings persist on different `date` rows (`2026-04-29` and `2026-04-30` respectively)
  And conflict detection still rejects overlapping start/end pairs
  Satisfaction:
    - test: integration test with real Postgres, `TZ=UTC`, simulated concurrent inserts at the boundary

**H-2** — Backfill of pre-fix booking rows
  Given the database has pre-existing rows where `bookings.date` was stored under UTC interpretation (e.g., a booking the user picked as Lima 2026-04-29 was stored as `2026-04-30 00:00:00 UTC`)
  When the runtime TZ is flipped to America/Lima and T-09 backfill runs
  Then those rows' `date` is corrected to Lima 2026-04-29 (stored as `date` type or `2026-04-29 05:00:00 UTC` if kept as `timestamp`)
  And no booking is duplicated, lost, or moved to a date the player did not pick
  Satisfaction:
    - test: snapshot DB rows before/after migration in a staging DB with anonymized prod data; diff is exactly the expected per-row offset

**H-3** — Daylight Saving Time guardrail
  Given a hypothetical scenario where Peru adopts DST (it currently does not)
  When the helpers are tested with `TZ=America/New_York` instead of `America/Lima` for one test
  Then the helpers continue to use `LIMA_TZ` constant and ignore the host TZ
  Satisfaction:
    - test: parameterized test that runs the helper suite with the process's `TZ` set to several non-Lima values — all assertions still hold

## Constraints / Decisions

- **Single-locale product**: PadelHub is Lima-only.
- **Two-layer fix** (originally three; layer 1 is impossible on Vercel — see below):
  - **(dropped)** ~~Vercel `TZ` env var per project~~ — `TZ` is a reserved name on Vercel; the API rejects `vercel env add TZ`. Vercel runtimes are pinned to UTC and there is no supported override. `TZ` is still recommended in local `.env` for parity.
  - (1) `SET TIME ZONE 'America/Lima'` on the postgres-js connection.
  - (2) Explicit zoned helpers + audited call sites — does the heavy lifting.
- **Helpers location**: `packages/api/src/lib/datetime.ts`, exported from the api package. No new package.
- **Helper API**: `LIMA_TZ`, `limaNow()`, `startOfLimaDay(d)`, `endOfLimaDay(d)`, `parseLimaDateParam(s)`, `formatLimaDate(d, fmt, locale?)`, `buildLimaDateTime(date, hhmm)`.
- **Tests run with `TZ=UTC`** (vitest setup) so production zone-correctness is proven independent of host TZ.
- **Dashboard page must be `dynamic = "force-dynamic"`** to prevent stale-render of "today".
- **Schema migration (T-09) is gated**: T-01..T-08 ship the user-visible fix; T-09 cleans up `bookings.date` / `blocked_slots.date` types with backfill.
- **`*_at` columns staying `timestamp without time zone` for now**: real instants round-trip correctly even though the type is wrong. Defer to a future ticket.

## Open Questions

- T-09 column shape: `date` (Postgres) vs `text "YYYY-MM-DD"`? Decide during T-09 by inspecting actual production data and downstream consumers.
- Custom ESLint rule to forbid raw `new Date()` in `packages/api/src/router/**`? Cheap to add in T-11 if `eslint-plugin-no-restricted-syntax` covers the case; else punt.

## Subtasks

- **T-01** [feature] **Add `packages/api/src/lib/datetime.ts` helpers + unit tests.**
  Implements `LIMA_TZ`, `limaNow`, `startOfLimaDay`, `endOfLimaDay`, `parseLimaDateParam`, `formatLimaDate`, `buildLimaDateTime`. Re-export from `packages/api/src/index.ts`. Covers S-6, H-3.
  Depends on: —. ~150 LOC.

- **T-02** [config] **Pin Vercel runtime TZ + Postgres session TZ.**
  Add `TZ=America/Lima` to Vercel env vars (production + preview) for `apps/nextjs`, `apps/admin`, `apps/bookings`, `apps/landing`. Add to root `.env.example`. Configure `postgres-js` in `packages/db/src/client.ts` with `connection: { timezone: "America/Lima" }` (or equivalent `SET TIME ZONE` after connect).
  Depends on: T-01. ~30 LOC.

- **T-03** [bug-fix] **Fix dashboard header + force-dynamic.**
  `apps/nextjs/src/components/dashboard/dashboard-header.tsx`: replace `new Date().toLocaleDateString("es-PE", …)` with `formatLimaDate(limaNow(), "EEEE, d 'de' MMMM 'de' yyyy", es)`. Add `export const dynamic = "force-dynamic"` to the facility dashboard page. Covers S-1 (UI half).
  Depends on: T-01. ~10 LOC.

- **T-04** [refactor] **Migrate `dashboard.ts` router.**
  Replace `startOfDay(new Date())`, `addDays(today, 1)`, `startOfMonth(now)`, `lastMonthStart` with `startOfLimaDay(limaNow())` + zoned-month helpers (add `startOfLimaMonth` if needed). Sites: `dashboard.ts:56-61, 194-196`. Covers S-1 (server half).
  Depends on: T-01. ~40 LOC.

- **T-05** [refactor] **Migrate `calendar.ts` router.**
  Sites: `calendar.ts:137-139, 182, 320, 453-454, 529-530`. Add `startOfLimaWeek` helper if a `getWeekView` boundary needs it. Covers S-4.
  Depends on: T-01. ~80 LOC.

- **T-06** [refactor] **Migrate `booking.ts` and `schedule.ts` routers.**
  Sites: `booking.ts:157, 269-275, 598-599, 773, 1059-1060, 1172-1173`; `schedule.ts:433-434, 505-506, 570, 619-620`. Update `generateBookingCode` to use Lima year.
  Depends on: T-01. ~120 LOC.

- **T-07** [refactor] **Migrate public-bookings UI surfaces.**
  Sites: `apps/bookings/src/app/[facilitySlug]/page.tsx:67-69`, `_components/date-selector.tsx:25-29`, `_components/facility-landing.tsx:66`, `confirm/page.tsx:38`, `confirm/_components/confirm-page.tsx:43-51`, `success/_components/success-page.tsx:69`, `mis-reservas/_components/booking-card.tsx:64-69`, `public-booking.ts:177-179, 190-191, 675-683`. Replace ad-hoc `new Date()`, `parseISO`, `format` with `parseLimaDateParam` + `formatLimaDate`. Covers S-3, S-5.
  Depends on: T-01. ~100 LOC.

- **T-08** [bug-fix] **Fix `buildDateTime` in `booking-status.ts`.**
  Replace `dt.setHours(...)` (server-local) with `buildLimaDateTime(date, hhmm)` (real instant). Sites: `packages/api/src/utils/booking-status.ts:45-50`. Update existing tests in `booking-status.test.ts`. Covers S-2.
  Depends on: T-01. ~20 LOC.

- **T-09** [refactor + migration] **Schema: `bookings.date` and `blocked_slots.date` → `date` type with backfill.**
  Decide column shape (Postgres `date` vs `text`). Generate Drizzle migration. Write SQL backfill that corrects pre-fix rows (offset by `+ interval '5 hours'` then date-truncate, or equivalent). Run on staging first; spot-check 100 bookings. Covers H-2.
  Depends on: T-04, T-05, T-06, T-08. ~200 LOC.

- **T-10** [test] **Vitest config: pin `TZ=UTC`; add zone-divergence regression tests.**
  Set `process.env.TZ = "UTC"` in vitest setup file before tests load. Re-run all date-relevant suites; fix anything that fails. Add S-1, S-2, S-4 zoned cases.
  Depends on: T-04, T-05, T-06, T-07, T-08. ~80 LOC.

- **T-11** [docs] **Update `CLAUDE.md` Date Handling section + (optional) ESLint rule.**
  Document new helpers as the canonical pattern. Remove the inline example using bare `toZonedTime(new Date(), TIMEZONE)`. Add an ESLint `no-restricted-syntax` rule banning `new Date()` from `packages/api/src/router/**` if cheap.
  Depends on: T-01..T-10. ~30 LOC.

## Definition of Done

- All visible scenarios (S-1 .. S-6) pass: Vitest green under `TZ=UTC` for `dashboard.test.ts`, `booking-status.test.ts`, `calendar.test.ts`, `slots.test.ts`, `datetime.test.ts`, and `apps/bookings/src/__tests__/date-roundtrip.test.tsx`.
- Holdout scenarios (H-1 .. H-3) pass when re-run by the planner against the final implementation.
- `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm lint:ws`, `pnpm test` all green at the repo root.
- Manual verification: deploy to a Vercel preview environment, request the facility dashboard, confirm header renders Lima's actual current day across at least three test moments (Lima morning, Lima evening, post-Lima-midnight UTC).
- T-09 only: SQL backfill diff manually inspected on a staging DB snapshot; rollback plan documented.
- `CLAUDE.md` Date Handling section updated to reference the new helpers as the canonical pattern.
