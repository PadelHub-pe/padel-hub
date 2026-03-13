# Flow 8: Calendar — Technical Plan

## 1. Context

### What Exists Today

The calendar feature already has a **working skeleton** — both API and UI exist but have significant gaps vs the Flow 8 spec.

**API** (`packages/api/src/router/calendar.ts`):
- `getDayView(facilityId, date)` — courts, operatingHours, bookings, peakPeriods, stats
- `getWeekView(facilityId, weekStart)` — days array, bookings, weekly stats
- `getDayStats(facilityId, date)` — lightweight stats refresh

**UI** (11 components at `apps/nextjs/src/.../bookings/calendar/_components/`):
- `calendar-view.tsx` — main orchestrator (state, data fetching, layout)
- `calendar-day-grid.tsx` — courts × time grid with absolute-positioned booking overlays
- `calendar-week-grid.tsx` — 7-day grid with compact booking chips
- `calendar-header.tsx` — ←/→/Hoy navigation, Day/Week toggle, "Agregar Reserva" button
- `calendar-legend.tsx` — status color legend + quick stats
- `calendar-booking-block.tsx` — individual booking block (forwardRef for popover)
- `booking-tooltip.tsx` — popover with booking details (loads via `booking.getById`)
- `calendar-time-indicator.tsx` — red "AHORA" line, updates every 60s
- `mini-calendar.tsx` — sidebar month picker
- `quick-booking-form.tsx` — dialog for quick booking from empty slot
- `calendar-utils.ts` — time math, position calculation, status colors

**Related existing infrastructure:**
- `BookingDetailDrawer` — full booking detail drawer (reused from bookings list)
- `BookingStatusBadge` — status badge component
- Schedule utilities (`packages/api/src/utils/schedule.ts`) — `getTimeZone()`, `getRateForSlot()`
- Booking status resolver (`packages/api/src/utils/booking-status.ts`) — auto-transitions

## 2. Gap Analysis

### API Gaps (Critical)

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| A1 | **Peak periods query uses wrong table** (`timeSlotTemplates` instead of `peakPeriods`) | Peak zones won't match Flow 6 config | Query `peakPeriods` table, filter by `isActive` and `daysOfWeek` |
| A2 | **Blocked slots not returned** | Can't render blocked time blocks | Add `blockedSlots` query to both getDayView and getWeekView |
| A3 | **No booking status auto-resolution** | Stale statuses (confirmed stays confirmed past start time) | Call `resolveAndPersistBookingStatuses()` like `booking.list` does |
| A4 | **getDayStats includes cancelled in count** | Wrong booking count | Add `ne(bookings.status, 'cancelled')` filter |
| A5 | **Courts not sorted by status** | Active/maintenance/inactive not ordered per spec | Sort: active first, then maintenance (grayed), hide inactive |
| A6 | **Peak periods don't include `markupPercent`** | Can't determine peak pricing info for UI | Return `markupPercent` and `name` from peakPeriods |

### Day View Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| D1 | No zone backgrounds | Regular=green-50, Peak=amber gradient, Closed=gray diagonal stripes |
| D2 | No blocked slot rendering | Red-50 blocks with reason label |
| D3 | No "+" hover indicator on empty cells | "+" cursor + light blue highlight |
| D4 | No auto-scroll to current time | Grid auto-scrolls to NOW on initial load |
| D5 | No court status dots in headers | Green/amber/red dot next to court name |
| D6 | No court type icons | 🏠/☀️ for indoor/outdoor |

### Week View Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| W1 | No court color dots on chips | Colored dot + court number |
| W2 | No weekend distinct background | Slightly different bg for Sat/Sun |
| W3 | Closed days: gray bg only | Should be diagonal stripes |
| W4 | No current time line | Red line on today's column |
| W5 | Empty slot click → switches to day view | Should open quick booking modal with date pre-filled |

### Booking Block Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| B1 | Peak badge shows "P"/"Peak" | Should be ⚡ amber badge |
| B2 | No cancelled styling | 30% opacity, strikethrough, dashed border |
| B3 | No booking code on tall blocks | Show confirmation code when block > 1.5h |
| B4 | No status pill on block | Small status badge |

### Navigation Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| N1 | No URL sync | `?date=2026-03-12&view=day` — shareable links |
| N2 | No keyboard shortcuts | Left/Right arrows, T for today |

### Stats/Legend Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| S1 | Legend shows booking STATUS colors | Should show ZONE colors (Regular/Peak/Booked/Blocked) |
| S2 | No staff simplified view | Staff sees only count + next booking (no revenue/utilization) |

### Quick Booking Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| Q1 | Default duration bug | `calculateEndTime("09:30")` → "10:30" (1h). Should always be +1.5h |
| Q2 | No blocked/closed zone prevention | Can't click cells during closed hours or blocked slots |

### Mini Calendar Gaps

| # | Gap | Spec Requirement |
|---|-----|-----------------|
| M1 | No booking dot indicators | Dates with bookings show small dot |

## 3. Risk Assessment

**Low risk:**
- All changes are within the existing calendar feature boundary
- No schema migrations needed
- No new tables or relations
- Existing booking CRUD is untouched
- API changes are additive (new fields in responses)

**Medium risk:**
- Changing peak periods source from `timeSlotTemplates` to `peakPeriods` could break if any other code depends on `timeSlotTemplates` for peak data (need to verify)
- Adding `resolveAndPersistBookingStatuses()` adds DB writes on read — same pattern used by `booking.list`, proven safe

**Performance considerations:**
- Blocked slots query is one additional DB call per request (parallel with existing queries)
- Status resolution adds potential batch UPDATE on read (already proven pattern)
- Mini calendar booking dots would need a month-level query — defer or batch

## 4. Architecture Decisions

**No new components needed** — all gaps are enhancements to existing components.

**No schema changes** — all data already exists in the DB, just not being queried.

**URL sync approach:** Use `useSearchParams` + `useRouter` from Next.js. Read on mount, update on navigation. This is the standard Next.js pattern.

**Staff view approach:** Use existing `usePermission` hook to check role and conditionally hide revenue/utilization stats.

## 5. Task Breakdown

See docs/TASKS.md for ordered subtasks.
