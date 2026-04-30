# Datetime Handling — The Contract

> One page. Read it once. The whole codebase follows these three rules.

PadelHub spans three different timezones at runtime:

- **Client** — browser in Lima (most users), but could be anywhere.
- **Server** — Vercel functions, runtime TZ pinned to UTC by the platform.
- **Database** — Supabase Postgres, session TZ pinned to `America/Lima` (`packages/db/src/client.ts`).

Without a coherent model, time bugs leak between every pair of these. The model below makes them impossible.

---

## The fundamental insight

JavaScript's `Date` is **only** a real instant (UTC milliseconds since epoch). It is **not** a calendar day, **not** a wall-clock time, **not** "April 30 in Lima." Every method that suggests otherwise (`getFullYear`, `setHours`, `toLocaleDateString`) is *reinterpreting that instant in the host TZ at call time*. When the host TZ doesn't match the user's intent, you get bugs.

Almost every datetime bug is the same root cause: **someone used `Date` to represent something that isn't a real instant.**

---

## Rule 1 — Pick the right type for the semantic

| Concept | Postgres type | TypeScript type | Wire format |
|---|---|---|---|
| **Real instant** ("when did this happen") | `timestamptz` | `Date` | ISO 8601 with offset, e.g. `2026-04-30T15:30:00.000Z` |
| **Calendar day** ("April 30") | `date` | `string` `"YYYY-MM-DD"` | `"2026-04-30"` |
| **Wall-clock time** ("10:30 AM") | `time` | `string` `"HH:MM:SS"` | `"10:30:00"` |
| **Wall-clock date+time without zone** | *don't use* | *don't use* | — |

The last row is the trap. `timestamp without time zone` and JS `Date` *used as a calendar day* are how every bug enters. Don't reach for them; pick one of the first three.

---

## Rule 2 — Calendar days and wall-clock times stay as strings end-to-end

A calendar day **is** the string `"2026-04-30"`. A wall-clock time **is** the string `"10:30:00"`. These do not become `Date` objects:

- in DB columns (`mode: "string"` in Drizzle for `date` columns; Postgres `time` returns strings natively)
- in API request/response bodies
- in React component props
- in URL params and form fields

The string crosses the wire. Display formatting and instant arithmetic are the **only** places where conversion happens, and they happen through the named helpers in Rule 3.

This is enforced by the type system: `bookings.date` is typed `string`. Calling `format(booking.date, ...)` from `date-fns` is a TypeScript error because `format` expects a `Date`. The compiler refuses the bug.

---

## Rule 3 — All zone math goes through `@wifo/api/datetime`

Every conversion between (calendar-day, wall-clock, instant) tuples is named and explicit. Concentrated in **one module** (`packages/api/src/lib/datetime.ts`). No raw `new Date()`, `parseISO`, `format(date, ...)`, `setHours`, `toLocaleDateString`, `startOfDay` from `date-fns` for user-visible dates.

```typescript
import {
  // Real instants
  nowUtc,                  // wraps new Date() so tests can mock it

  // Lima-zoned reads (instant in, format/string out)
  formatLimaDate,          // format an instant in Lima TZ — display
  formatLimaDateParam,     // instant → "YYYY-MM-DD" in Lima TZ

  // Lima-zoned writes (string in, instant out)
  parseLimaDateParam,      // "YYYY-MM-DD" → instant at Lima 00:00
  buildLimaDateTime,       // (date-string | Date, "HH:MM") → instant

  // Lima calendar arithmetic (instant in, instant out)
  startOfLimaDay,
  endOfLimaDay,
  startOfLimaMonth,
  startOfLimaWeek,
  addLimaDays,

  // Lima clock (real instant rebased to Lima wall clock — for date-of-day arithmetic only)
  limaNow,
} from "@wifo/api/datetime";
```

If you need a function not in this list, it goes here, not at the call site.

---

## How this prevents every bug we've seen

| Past bug | Why it happened | Why the model prevents it |
|---|---|---|
| Dashboard rendered "Jueves 30 abril" on April 29 | `new Date().toLocaleDateString("es-PE")` on a UTC server | `formatLimaDate(nowUtc(), …)` is the only acceptable form; type system makes the wrong form awkward |
| Booking auto-marked "Completada" on creation | `setHours()` ran in server TZ; built `startDateTime` 5 hours off | `buildLimaDateTime(date, time)` is the *single* date+time→instant conversion |
| Server prefetch and client hydrate disagreed on the same date | server parsed `"2026-04-30T00:00:00"` as local UTC, client `parseISO`'d it as UTC midnight | calendar days are strings on both sides; no parsing diversity |
| Drizzle `mode: "date"` returned UTC midnight | `Date` was used to represent a calendar day | `mode: "string"` — calendar day is a string, not a Date |

---

## Cross-region reliability

Following the rules, the system is correct regardless of:

- **Where the Vercel function runs** (us-east-1, Frankfurt, Tokyo). Runtime TZ is UTC everywhere on Vercel; we never read host TZ for user-visible time.
- **Where the database lives** (any region). Postgres `DATE` and `time` are TZ-agnostic; `timestamptz` round-trips real instants correctly.
- **What TZ the browser is in** (Lima, São Paulo, Madrid). Date pickers always resolve to a Lima calendar-day string before submission.

The `postgres-js` session TZ pin to `America/Lima` (`packages/db/src/client.ts`) is *defense in depth* for `now()` and casts of any remaining `timestamp without time zone` columns. Once all `*_at` columns migrate to `timestamptz`, the session pin becomes redundant.

---

## What about `created_at` / `updated_at` columns?

Application tables use `timestamptz` (`packages/db/migrations/2026-04-30-tz-fix-timestamptz.sql`). Real instants in the DB are now TZ-aware regardless of session settings.

**Residual exception**: Better Auth tables (`user`, `session`, `account`, `verification`) still use `timestamp without time zone`. `auth-schema.ts` is regenerated by `pnpm auth:generate`, so editing it gets overwritten. Those columns round-trip correctly only under the postgres-js session TZ pin. Don't bypass it for auth-related work; if you need to touch the auth schema generation, migrate those columns at the same time.

---

## Quick review checklist (PR template)

- [ ] No `new Date(someStringFromUserOrUrl)` in app code.
- [ ] No `format(date, ...)` from `date-fns` for user-visible dates — use `formatLimaDate`.
- [ ] No `parseISO(...)` of a calendar-day string — use `parseLimaDateParam`.
- [ ] No `setHours()` to build a "booking start" — use `buildLimaDateTime`.
- [ ] DB columns: `timestamptz` for instants, `date` (`mode: "string"`) for calendar days, `time` for wall clock.
- [ ] Calendar-day API fields are typed `string`, not `Date`.

If a PR violates any of these, it's a bug forming.
