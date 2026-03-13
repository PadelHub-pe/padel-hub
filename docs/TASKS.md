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

### Flow 7: Booking Management (7 tasks)

On-access status resolver, server-side price calculation, enhanced list API (multi-status, date range, sorting), cancel validations + state machine, comprehensive booking router tests (453 total), UI spec alignment, real dashboard stats. 143 tests (booking: 143).

---

## Current

### Flow 8: Calendar (7 tasks)

Calendar day/week view enhancements. Existing skeleton works but has significant gaps vs spec. See `docs/TECHNICAL_PLAN.md` for full gap analysis.

**Prerequisites:** Flow 5 (Courts), Flow 6 (Schedule), Flow 7 (Bookings) — all complete.

---

#### TASK-8.01 — Calendar router fixes + tests (API)

**Type:** bug-fix + feature
**Files:** `packages/api/src/router/calendar.ts`, `packages/api/src/__tests__/calendar.test.ts` (new)

Fix critical API bugs and add missing data to calendar endpoints. Write tests first.

**Fixes:**
1. **Peak periods query uses wrong table** — `getPeakPeriods()` queries `timeSlotTemplates` instead of `peakPeriods`. Replace with query on `peakPeriods` table, filter by `isActive` and `daysOfWeek` array. Return `name`, `startTime`, `endTime`, `markupPercent`.
2. **Blocked slots not returned** — Add `blockedSlots` query (from `blocked_slots` table) to both `getDayView` and `getWeekView`. Include `courtId`, `startTime`, `endTime`, `reason`, `notes`.
3. **No booking status auto-resolution** — Call `resolveAndPersistBookingStatuses()` on bookings before returning, same pattern as `booking.list`.
4. **getDayStats cancelled filter** — Add `ne(bookings.status, 'cancelled')` to the aggregate count query.
5. **Court ordering** — Sort courts: active first (by name), then maintenance (by name). Filter out inactive courts.

**Tests:** Write comprehensive tests for `getDayView`, `getWeekView`, `getDayStats` covering: correct data shape, peak periods from correct table, blocked slots included, status resolution, cancelled exclusion, court ordering.

**AC:**
- [ ] Peak periods sourced from `peakPeriods` table (not `timeSlotTemplates`)
- [ ] Blocked slots included in getDayView and getWeekView responses
- [ ] Booking statuses auto-resolved on read
- [ ] getDayStats excludes cancelled bookings from count
- [ ] Courts sorted: active first, then maintenance, inactive hidden
- [ ] Calendar router test file with full coverage
- [ ] All existing tests pass (`pnpm test`)

---

#### TASK-8.02 — Day view grid enhancements (UI)

**Type:** feature
**Depends on:** TASK-8.01
**Files:** `calendar-day-grid.tsx`, `calendar-view.tsx`, `calendar-utils.ts`

**Changes:**
1. **Zone backgrounds** — Regular hours: `bg-green-50` (subtle). Peak hours: amber gradient (e.g., `bg-amber-50` with subtle stripe). Closed hours: diagonal gray stripes via CSS.
2. **Blocked slot rendering** — Red-50 blocks spanning the correct time range with reason label (icon + text: "Mantenimiento", "Evento Privado", etc.). Non-interactive (no click handler).
3. **Court column headers** — Add status dot (green for active, amber for maintenance). Add type icon (🏠 indoor, ☀️ outdoor).
4. **Court ordering** — Active courts first, then maintenance (grayed column). Inactive hidden. (Consumed from API fix in TASK-8.01.)
5. **"+" hover on empty cells** — Show "+" icon centered on hover with `cursor-pointer` and light blue highlight (`hover:bg-blue-50`). Don't show on blocked/closed cells.
6. **Auto-scroll to current time** — On initial mount, scroll the grid container to center the current time line using `scrollIntoView`.

**AC:**
- [ ] Regular zone cells have green-50 background
- [ ] Peak zone cells have amber gradient/stripe background
- [ ] Blocked slots rendered as red-50 blocks with reason icon + label
- [ ] Blocked/closed cells not clickable
- [ ] Court headers show status dot + type icon
- [ ] Empty cells show "+" on hover with blue highlight
- [ ] Grid auto-scrolls to current time on mount
- [ ] Typecheck and lint pass

---

#### TASK-8.03 — Booking block + popover polish (UI)

**Type:** feature
**Depends on:** TASK-8.01
**Files:** `calendar-booking-block.tsx`, `booking-tooltip.tsx`, `calendar-utils.ts`

**Changes:**
1. **Status-specific styling per spec** — Match the spec table exactly:
   - Confirmed: primary-400 left border, primary-50 bg
   - In Progress: green-400 left border, green-50 bg
   - Completed: gray-300 left border, gray-50 bg
   - Cancelled: red-300 **dashed** left border, red-50 at 30% opacity, strikethrough name
   - Blocked: red-300 left border, red-50 bg
2. **Peak badge** — Replace "P"/"Peak" with ⚡ amber badge
3. **Booking code on tall blocks** — Show confirmation code (e.g., "PH-2026-A7K2") when block height > 1.5h
4. **Status pill badge** — Small status pill on each block
5. **Popover enhancements** — Show duration (e.g., "(1.5h)") after time range. Show court type (Indoor/Outdoor) after court name.

**AC:**
- [ ] Booking blocks match spec status table (border color, bg, text)
- [ ] Cancelled bookings at 30% opacity with strikethrough + dashed border
- [ ] Peak bookings show ⚡ amber badge
- [ ] Tall blocks (>1.5h) show booking code
- [ ] Popover shows duration after time range
- [ ] Typecheck and lint pass

---

#### TASK-8.04 — Navigation: URL sync + keyboard shortcuts (UI)

**Type:** feature
**Files:** `calendar-view.tsx`, `calendar-header.tsx`, `page.tsx`

**Changes:**
1. **URL sync** — Read `?date=` and `?view=` from URL search params on mount. Update URL on date change and view toggle using `useRouter.replace()` (no history push). Prefetch in page.tsx should read from searchParams.
2. **Keyboard shortcuts** — Add event listener for:
   - Left/Right arrows → navigate prev/next day (day view) or week (week view)
   - `T` → jump to today
   - `Escape` → close any open popover
3. **Button wording** — Change "Agregar Reserva" to "+ Nueva Reserva" per spec.

**AC:**
- [ ] URL updates when navigating dates or switching views
- [ ] Loading a URL with `?date=2026-03-12&view=week` opens that date in week view
- [ ] Page.tsx prefetches based on URL searchParams (not just today)
- [ ] Left/Right arrows navigate, T jumps to today
- [ ] Escape closes open popover
- [ ] Typecheck and lint pass

---

#### TASK-8.05 — Legend/stats bar rework (UI)

**Type:** feature
**Depends on:** TASK-8.01
**Files:** `calendar-legend.tsx`, `calendar-view.tsx`

**Changes:**
1. **Legend shows zone colors** — Replace booking status colors with zone indicators:
   - 🟢 Horario Regular (green-50 swatch)
   - ⚡ Hora Pico (amber swatch)
   - 📘 Reservado (blue swatch)
   - 🔴 Bloqueado (red swatch)
2. **Stats format** — Right side: "12 reservas · S/ 1,240 · 68% ocupación"
3. **Staff simplified view** — Use `usePermission` hook to check role. Staff sees only booking count + next upcoming booking. No revenue, no utilization.
4. **Week view stats** — Show weekly totals in stats bar when in week view.

**AC:**
- [ ] Legend shows zone colors (Regular, Pico, Reservado, Bloqueado)
- [ ] Stats show booking count, revenue, utilization with correct formatting
- [ ] Staff role sees simplified stats (no revenue, no utilization)
- [ ] Stats update when navigating between days
- [ ] Typecheck and lint pass

---

#### TASK-8.06 — Week view enhancements (UI)

**Type:** feature
**Depends on:** TASK-8.01, TASK-8.02
**Files:** `calendar-week-grid.tsx`, `calendar-view.tsx`

**Changes:**
1. **Court color dots on chips** — Each booking chip shows a colored dot matching the court + abbreviated court number.
2. **Weekend distinct background** — Saturday/Sunday columns have slightly different bg (e.g., `bg-gray-50/50`).
3. **Closed day diagonal stripes** — Closed days show diagonal stripes across entire column (not just gray bg).
4. **Current time red line** — Show red line across today's column (reuse `CalendarTimeIndicator` logic).
5. **Empty slot → quick booking** — Click empty slot opens quick booking modal with date pre-filled from column (currently switches to day view).
6. **"+N más" → day view** — Click "+N más" overflow indicator switches to day view for that date.

**AC:**
- [ ] Booking chips show court color dot
- [ ] Weekend columns have subtly distinct background
- [ ] Closed days show diagonal stripe pattern
- [ ] Current time red line visible on today's column
- [ ] Empty slot click opens quick booking with date pre-filled
- [ ] "+N más" click switches to day view
- [ ] Typecheck and lint pass

---

#### TASK-8.07 — Quick booking fixes + mini calendar dots (UI)

**Type:** bug-fix + feature
**Files:** `quick-booking-form.tsx`, `mini-calendar.tsx`, `calendar-day-grid.tsx`

**Changes:**
1. **Default duration fix** — `calculateEndTime()` should always add 1.5h (90 minutes) to start time. Current implementation is buggy for non-:00 start times.
2. **Blocked/closed zone prevention** — Don't allow clicking cells in blocked or closed time zones. Check against blocked slots data and operating hours.
3. **Mini calendar booking dots** — Dates with bookings show a small dot indicator below the date number. Fetch booking counts per month (lightweight query or derive from existing week data when possible).

**AC:**
- [ ] `calculateEndTime("09:30")` returns "11:00" (1.5h later)
- [ ] `calculateEndTime("19:00")` returns "20:30" (1.5h later)
- [ ] Cannot click blocked time slots in day grid
- [ ] Cannot click cells outside operating hours
- [ ] Mini calendar dates with bookings show dot indicator
- [ ] Typecheck and lint pass
