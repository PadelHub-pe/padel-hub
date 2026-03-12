# Tasks

## Completed

### Email Notification System

Fully implemented `packages/email` (React Email + Resend): 4 templates, high-level senders, integrated across all apps.

### Flow 1: Authentication & Access (8 tasks)

Login (email/password + Google OAuth), invite acceptance, password reset, rate limiting, post-login pending invite prompt, brand assets, auth error hardening, 129 tests.

### Flow 2: Organization Management (6 tasks)

Facility card actions, deactivation dialog, empty state, URL-persisted filters, org switcher, "Agregar Local" button.

### Image System (10 tasks)

`@wifo/images` package, Cloudflare Images integration (Direct Creator Upload), URL builder, tRPC images router, ImageUpload/Preview/Gallery components, integrated into facility photos, court photos, and org logo. 21 tests.

### Flow 3: Team & Roles - RBAC (8 tasks)

Last admin protection, facility manager invite scoping, `usePermission` hook, role-based sidebar filtering, route-level access guards, team table polish, invite/edit dialog enhancements, 35 tests.

### Flow 4: Facility Onboarding (11 tasks)

Schema migration (slug + geocoding), setup progress API, default operating hours, district autocomplete + geocoding, courts wizard redesign (individual CRUD + pricing), schedule wizard enhancement ("Aplicar a todos"), photos & amenities step, completion screen + activation gate, setup banner with progress, resume from correct step, slug auto-generation. 52 tests (setup: 37, slugify: 15).

### Flow 6: Schedule & Pricing (9 tasks)

Zone calculation utility, facility default pricing schema, enhanced operating hours editor (30-min increments, "Aplicar a todos", validation), peak period full CRUD (create/edit/delete with overlap detection, day shortcuts, max 5 limit), editable rate cards with facility defaults, court default/custom pricing system, revenue calculator (slider + monthly toggle), block time slots UI. 120 tests (schedule-utils: 48, schedule: 30, pricing: 42).

---

## Current: Flow 7 — Booking Management

> **Context:** ~85% of Flow 7 is already implemented (router, schema, UI). These tasks address critical gaps: missing on-access status transitions, server-side price calculation, list API improvements, and comprehensive test coverage.
>
> **Reference:** `what-needs-to-be-build/📖 Flow 7 Booking Management — Engineering Task.md`
> **Technical Plan:** `docs/TECHNICAL_PLAN.md`

### TASK-7.01 — On-access booking status resolver (feature)

Create `resolveBookingStatus()` utility and integrate into `booking.list` + `booking.getById`.

**What:**
- Create `packages/api/src/utils/booking-status.ts` with pure function `resolveBookingStatus(booking, now)`:
  - `confirmed` + now >= startDateTime → `in_progress`
  - `in_progress` + now >= endDateTime → `completed`
  - Otherwise → no change
- Create helper `resolveAndPersistBookingStatuses(db, bookings, now)` that:
  - Detects bookings needing transition
  - Batch-updates their status in DB
  - Logs `booking_activity` entries for auto-transitions (type: `started` or `completed`)
- Integrate into `booking.list` query — after fetching bookings, resolve statuses, persist changes
- Integrate into `booking.getById` query — resolve single booking status before returning
- Write tests for the pure resolver function (edge cases: exact boundary times, cancelled bookings unchanged, completed bookings unchanged)

**Acceptance criteria:**
- [ ] Status badges always reflect correct time-based state
- [ ] `confirmed → in_progress` auto-triggers at booking start time
- [ ] `in_progress → completed` auto-triggers at booking end time
- [ ] Cancelled/completed bookings are never auto-transitioned
- [ ] Activity log entries created for auto-transitions
- [ ] Tests pass for resolver utility

**Depends on:** nothing

---

### TASK-7.02 — Server-side price calculation in createManual (feature)

Move price calculation from client to server in `booking.createManual`.

**What:**
- Remove `priceInCents` and `isPeakRate` from `CreateManualBookingSchema` input
- In `booking.createManual` mutation, after conflict check:
  1. Load operating hours, peak periods, blocked slots for facility+date
  2. Build `ScheduleConfig` object
  3. For each 30-min slot in the booking range, call `getTimeZoneWithMarkup()`
  4. Calculate total price using `getRateForSlot(court, zone, facilityDefaults)`
  5. Set `isPeakRate = true` if any slot falls in peak zone
- Update `booking.getSlotInfo` to return calculated price for the selected time range (so UI can preview)
- Update `create-booking-dialog.tsx`:
  - Remove manual price input field
  - Show server-calculated price preview (call `getSlotInfo` on court+date+time selection)
  - Keep payment method selector
- Write tests for price calculation in createManual

**Acceptance criteria:**
- [ ] Server calculates price using `getRateForSlot()` — no client-sent price
- [ ] Peak rate correctly detected based on zone logic
- [ ] Split-zone bookings (regular + peak) calculate blended price
- [ ] Price preview updates live in create dialog
- [ ] Existing bookings unaffected (they keep their stored price)
- [ ] Tests pass

**Depends on:** nothing

---

### TASK-7.03 — Enhance booking.list API (feature)

Upgrade list query to match spec: multi-status filter, date range, sorting.

**What:**
- Change `status` param from `z.enum(...)` to `z.array(z.enum(...)).optional()` — support multi-select
- Add `dateRange: z.object({ start: z.date(), end: z.date() }).optional()` param
- Add `sortBy: z.enum(['date', 'time', 'court', 'price', 'status']).optional()` + `sortOrder: z.enum(['asc', 'desc']).optional()`
- Update WHERE clause: status uses `inArray()` instead of `eq()`
- Update WHERE clause: date range uses `between()` or `gte/lte`
- Update ORDER BY: dynamic based on `sortBy`/`sortOrder`, default `date desc`
- Update `bookings-filters.tsx`:
  - Status filter → multi-select chip bar (multiple statuses selectable simultaneously)
  - Date filter → date range picker with presets (Hoy, Esta semana, Este mes, Personalizado)
- Persist all filters in URL query params
- Write tests for list query with various filter combinations

**Acceptance criteria:**
- [ ] Multi-status filtering works (select Pendiente + Confirmada)
- [ ] Date range filtering works with presets
- [ ] Sorting by all columns works
- [ ] Filters persist in URL query params
- [ ] Empty state shows appropriate message based on active filters
- [ ] Tests pass

**Depends on:** nothing

---

### TASK-7.04 — Fix cancel `cancelled_by` and booking validations (bug-fix)

Minor fixes to cancel and status transition logic.

**What:**
- In `booking.cancel`: change `cancelled_by` from hardcoded `"owner"` to context-aware value (dashboard cancels = `"owner"`, as the enum values are `user | owner | system`)
- Verify cancellation is blocked for `completed` bookings (spec: "Cannot cancel already-cancelled or completed bookings")
- Verify status transition rules: no backward transitions (completed → confirmed is invalid)
- Add validation in `booking.updateStatus` to enforce state machine rules
- Write tests for cancel and status transition edge cases

**Acceptance criteria:**
- [ ] Cancel sets appropriate `cancelled_by` value
- [ ] Cannot cancel completed or already-cancelled bookings
- [ ] Status transitions follow state machine (no backward moves)
- [ ] Tests pass

**Depends on:** nothing

---

### TASK-7.05 — Comprehensive booking router tests (testing)

Write full test suite for `packages/api/src/router/booking.ts`.

**What:**
- Create `packages/api/src/__tests__/booking.test.ts`
- Test groups:
  - **list:** pagination, search by code/name/email, court filter, status filter (single + multi), date range, sorting, empty results
  - **getById:** returns booking with players + activity, 404 for nonexistent
  - **createManual:** success case, conflict detection (overlap, adjacent OK), code generation uniqueness, player creation, activity logging, price calculation
  - **confirm:** pending → confirmed, reject non-pending, activity logged
  - **cancel:** with/without reason, blocked for completed, cancelled_by value, activity logged
  - **status transitions:** valid transitions, invalid backward transitions, auto-transitions (via resolver)
  - **addPlayer:** success, max 4 limit, duplicate user rejection, position occupied rejection, auto-confirm on 4/4 open_match
  - **removePlayer:** success, owner protection, activity logged
  - **getSlotInfo:** returns operating hours, peak periods, existing bookings, blocked slots
  - **searchUsers:** search by name/email, excludes current players
  - **RBAC:** verify access control for all roles

**Target:** 40-60 tests (comparable to pricing: 42, schedule: 30)

**Acceptance criteria:**
- [ ] All test groups pass
- [ ] Edge cases covered (conflict boundaries, status transitions, role permissions)
- [ ] Factory helpers created for booking test data
- [ ] `pnpm test` passes with all existing + new tests

**Depends on:** TASK-7.01, TASK-7.02, TASK-7.03, TASK-7.04

---

### TASK-7.06 — UI polish and spec alignment (feature)

Verify and fix UI components against Flow 7 spec.

**What:**
- Verify bookings list table columns match spec (Código, Fecha, Horario, Cancha, Jugadores, Precio, Estado)
- Verify today's bookings have left border accent highlight
- Verify loading skeleton states on list and detail pages
- Verify empty states with appropriate messages based on filters
- Verify cancel modal matches spec (reason select from predefined list, internal note field, player notification count)
- Verify booking detail page layout matches spec (court visualization left, details right, players below, timeline below)
- Verify breadcrumb: "Reservas > PH-YYYY-XXXX"
- Fix any visual discrepancies found during verification
- Run `pnpm lint && pnpm format && pnpm typecheck` to ensure quality

**Acceptance criteria:**
- [ ] All table columns match spec
- [ ] Cancel modal has predefined reason dropdown + internal note
- [ ] Detail page layout matches spec wireframe
- [ ] Loading and empty states work correctly
- [ ] All lint/format/typecheck pass

**Depends on:** TASK-7.01, TASK-7.02, TASK-7.03

---

### TASK-7.07 — Dashboard stats with real data (feature)

Replace mock dashboard stats with real booking data.

**What:**
- Update `packages/api/src/router/dashboard.ts`:
  - `getStats()` → query real booking data (today's bookings, today's revenue, pending count, total count)
  - `getTodaySchedule()` → query real today's bookings with status, time, court, customer
- Use facility-scoped queries (respect RBAC)
- Write tests for dashboard stats

**Acceptance criteria:**
- [ ] Dashboard shows real booking counts and revenue
- [ ] Today's schedule shows actual bookings
- [ ] Data is facility-scoped per user's access
- [ ] Tests pass

**Depends on:** TASK-7.01

---

### Summary

| Task | Type | Priority | Depends on | Estimate |
|------|------|----------|------------|----------|
| TASK-7.01 | feature | P0 | — | 2-3h |
| TASK-7.02 | feature | P0 | — | 3-4h |
| TASK-7.03 | feature | P0 | — | 3-4h |
| TASK-7.04 | bug-fix | P0 | — | 1-2h |
| TASK-7.05 | testing | P0 | 7.01-7.04 | 4-6h |
| TASK-7.06 | feature | P1 | 7.01-7.03 | 3-4h |
| TASK-7.07 | feature | P1 | 7.01 | 2-3h |

**Parallelism:** TASK-7.01, 7.02, 7.03, 7.04 can all run in parallel (independent API changes). TASK-7.05 depends on all four being done. TASK-7.06 and 7.07 can run after their dependencies.
