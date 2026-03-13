# 📅 Flow 8: Calendar — Engineering Task

The visual, time-based interface for viewing and interacting with bookings. While Flow 7 (Bookings) is the data/action layer, the calendar is the **spatial view** — courts × time for day view, days × time for week view. This is where staff lives during the day, at a glance seeing what's booked, what's available, and when peak hours hit.

---

## Context & Scope

**What Flow 8 owns:** The day view grid, week view grid, date navigation, view toggle, current time indicator, booking block rendering, click popover, empty slot quick-booking, day stats bar, and peak hour zone visualization.

**What Flow 8 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 6 (Schedule) | Zone calculation logic (`getTimeZone()`), operating hours, peak periods, blocked slots config | Flow 8 consumes the zones; Flow 6 defines them |
| Flow 7 (Bookings) | Booking CRUD — the actual `booking.create`, `booking.cancel`, `booking.confirm` mutations | Flow 8 provides the visual surface; Flow 7 handles the data operations |

**The relationship with Flow 7:** The bookings list and the calendar are **two views of the same data**. A booking created from the calendar uses the same `booking.create` mutation from Flow 7. A booking confirmed from the calendar popover calls the same `booking.confirm`. The calendar just provides a different entry point.

---

## Prerequisites

- Flow 5 (Courts) — courts exist (columns in day view)
- Flow 6 (Schedule) — operating hours, peak periods, blocked slots, zone logic
- Flow 7 (Bookings) — booking CRUD mutations, conflict detection
- Flow 3 (RBAC) — all three roles can access the calendar (scoped to assigned facilities)

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 8.1 | Day view — time-slot grid per court | `/org/.../f/[facilitySlug]/calendar` | P0 |
| 8.2 | Week view — compact weekly overview | Calendar toggle | P0 |
| 8.3 | Navigate between days/weeks | Calendar header | P0 |
| 8.4 | Quick booking from empty slot click | Calendar grid → modal | P0 |
| 8.5 | Booking block display + click popover | Calendar cells | P0 |
| 8.6 | Day stats (booking count, revenue, utilization) | Calendar header / legend bar | P0 |

---

## Sub-flow Specifications

---

### 8.1 Day View — Time-Slot Grid Per Court

**Route:** `/org/[slug]/f/[facilitySlug]/calendar`

**Priority:** P0 — The default view

**Access:** All three roles (scoped to assigned facilities)

**Reference:** [Dashboard: Booking Calendar screen](https://www.notion.so/Dashboard-Booking-Calendar-screen-2fe8722b044f816784c4fd6731382abb?pvs=21)

#### Grid Structure

```
             Court 1      Court 2      Court 3
 7:00  ┌────────────┬────────────┬────────────┐
       │            │            │            │  ← Regular zone (green-50 bg)
 8:00  ├────────────┼────────────┼────────────┤
       │  [Booking]  │     +      │            │
 9:00  │  Carlos M.  │            │  [Blocked]  │
       │  8:00-9:30  │            │  Mant.     │
 ...   │            │            │            │
       │            │            │            │
⚡ 19:00 ├────────────┼────────────┼────────────┤  ← Peak zone (amber gradient bg)
       │  [Booking]  │  [Booking]  │     +      │
⚡ 20:00 │  Ana R. ⚡   │  Luis P. ⚡  │            │
       │  19:00-20:30│  19:30-21  │            │
⚡ 21:00 ├────────────┼────────────┼────────────┤
 22:00  └────────────┴────────────┴────────────┘
 ──── NOW (10:15 AM) ─ red line ────────────────────
```

- **Y-axis:** Time rows, 1-hour increments, only within operating hours
- **X-axis:** Court columns (1 column per active court)
- **Zone backgrounds:** Regular (green-50), Peak (amber gradient), Closed (diagonal gray stripes)
- **Current time:** Red horizontal line with "NOW" badge, updates every minute

#### Court Column Headers

Each column header shows: court name + type icon (🏠/☀️/🏕️) + status dot (green/amber/red)

#### Acceptance Criteria

- [ ]  Grid renders with time rows (operating hours only) and court columns
- [ ]  Zone backgrounds from `getTimeZone()`: green-50 regular, amber gradient peak, gray stripes closed
- [ ]  Booking blocks span their correct duration (variable height based on time)
- [ ]  Blocked slots rendered as red-50 blocks with reason label
- [ ]  Court columns ordered: active first, then maintenance (grayed), inactive hidden
- [ ]  Current time red line positioned accurately, updates every minute
- [ ]  "NOW" badge with red dot on left edge of time line
- [ ]  Grid scrolls vertically if hours exceed viewport height
- [ ]  Grid auto-scrolls to current time on initial load
- [ ]  Empty cells show "+" on hover, clickable to create booking (8.4)
- [ ]  Responsive: on smaller screens, court columns become horizontally scrollable
- [ ]  Loading state: skeleton grid with court column headers

#### API

```tsx
calendar.getDayView.query({
  facilitySlug: string,
  date: string,  // ISO date
})
// Returns: {
//   courts: Court[],
//   bookings: CalendarBooking[],
//   blockedSlots: BlockedSlot[],
//   peakPeriods: PeakPeriod[],
//   operatingHours: { isOpen: boolean, openTime: string, closeTime: string },
//   stats: DayStats,
// }
```

---

### 8.2 Week View — Compact Weekly Overview

**Priority:** P0

#### Grid Structure

```
         Mon 10     Tue 11     Wed 12     Thu 13     Fri 14     Sat 15     Sun 16
7:00  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
      │          │  [C.M]   │ *TODAY*  │          │          │          │          │
9:00  │  [A.R]   │  ● C1   │  [L.P]   │          │          │          │          │
      │  ● C2   │          │  ● C1   │  [J.K]   │          │  [M.S]   │          │
...   │          │          │          │  ● C3   │          │  ● C1   │          │
22:00  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- **Y-axis:** Time rows (same as day view)
- **X-axis:** Days of the week (Mon-Sun)
- **Booking chips:** Compact — abbreviated name + colored court dot
- **Today column:** Highlighted with primary-50 background

#### Acceptance Criteria

- [ ]  7-day grid with time rows × day columns
- [ ]  Today column highlighted with subtle background
- [ ]  Booking blocks as compact chips: abbreviated name (first initial + last) + court color dot
- [ ]  Peak hour zones shown as amber backgrounds across all day columns
- [ ]  Click a booking chip → popover (8.5)
- [ ]  Click empty slot → quick booking modal (8.4) with date pre-filled from column
- [ ]  Day headers show: day name + date + booking count badge ("12")
- [ ]  Weekend columns subtly distinct (slightly different bg)
- [ ]  Closed days shown with diagonal stripes across entire column
- [ ]  Multiple bookings in same time slot stack vertically or show "+N" overflow
- [ ]  Current time red line spans across today's column

#### API

```tsx
calendar.getWeekView.query({
  facilitySlug: string,
  weekStart: string,  // ISO date of Monday
})
// Returns: {
//   days: Array<{
//     date: string,
//     isOpen: boolean,
//     bookings: CalendarBooking[],
//     blockedSlots: BlockedSlot[],
//     bookingCount: number,
//   }>,
//   courts: Court[],
//   peakPeriods: PeakPeriod[],
// }
```

---

### 8.3 Navigate Between Days/Weeks

**Priority:** P0

#### Header Controls

```
[←]  [Hoy]  [→]    Miércoles, 12 de Marzo 2026     [Día | Semana]    [+ Nueva Reserva]
```

#### Acceptance Criteria

- [ ]  ←/→ arrows navigate to previous/next day (day view) or week (week view)
- [ ]  "Hoy" button jumps to current date
- [ ]  Date label shows full date in Spanish: "Miércoles, 12 de Marzo 2026" (day) or "10 - 16 Mar 2026" (week)
- [ ]  View toggle: "Día" / "Semana" as segmented control
- [ ]  Switching views preserves the current date context
- [ ]  Keyboard shortcuts: Left/Right arrows for navigation, T for today
- [ ]  Date in URL: `?date=2026-03-12&view=day` — shareable links
- [ ]  Mini calendar in sidebar: clicking a date navigates the main grid
- [ ]  Mini calendar shows current month with today highlighted (primary circle)
- [ ]  Mini calendar dates with bookings have a small dot indicator

---

### 8.4 Quick Booking From Empty Slot Click

**Priority:** P0

#### Behavior

1. User clicks an empty cell in the grid
2. Opens the same booking creation modal from Flow 7.3
3. Fields pre-filled from the clicked slot:
    - **Day view:** court (from column), date (from current day), start time (from row)
    - **Week view:** date (from column), start time (from row)
4. Default end time: start + 1.5 hours (standard padel match)
5. User confirms → booking created → appears in grid immediately

#### Acceptance Criteria

- [ ]  Hovering an empty cell shows "+" cursor and light blue highlight
- [ ]  Click opens `CreateBookingModal` from Flow 7.3 with pre-filled fields
- [ ]  Day view pre-fills: court + date + start time
- [ ]  Week view pre-fills: date + start time (court selector open for user to choose)
- [ ]  Default duration: 1.5 hours
- [ ]  Conflict detection runs immediately with pre-filled values
- [ ]  After booking created, new block appears in grid without page reload (optimistic)
- [ ]  Cannot click cells during closed hours (gray stripe zones not interactive)
- [ ]  Cannot click blocked slots (red zones not interactive)

---

### 8.5 Booking Block Display + Click Popover

**Priority:** P0

#### Booking Block States

| Status | Left Border | Background | Text Color |
| --- | --- | --- | --- |
| Confirmed | primary-400 (3px) | primary-50 | primary-800 |
| In Progress | green-400 | green-50 | green-800 |
| Completed | gray-300 | gray-50 | gray-600 |
| Cancelled | red-300 (dashed) | red-50 (30% opacity) | red-400 (strikethrough) |
| Blocked | red-300 | red-50 | red-700 |

#### Block Content (Day View)

- Customer name (truncated, bold)
- Time range (muted, small)
- Status badge (small pill)
- ⚡ amber badge if peak rate
- Confirmation code on taller blocks (>1.5h)

#### Block Content (Week View)

- Abbreviated name (first initial + last name)
- Colored court dot + court number

#### Click Popover

Clicking a booking block shows a floating popover:

```
┌──────────────────────────┐
│ PH-2026-A7K2   [● Confirmed]│
│                              │
│ 👤 Carlos Mendoza             │
│    Nivel 4 • 12 reservas      │
│                              │
│ 📅 19:00 - 20:30 (1.5h)       │
│ 🎾 Cancha 1 (Indoor)          │
│ 💰 S/ 150 ⚡                   │
│                              │
│ [Ver Detalle →]               │
└──────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Booking blocks styled with left-border accent pattern per status
- [ ]  Blocks span correct height based on duration (1h = 1 row height, 1.5h = 1.5 rows)
- [ ]  Peak bookings show ⚡ amber badge
- [ ]  Day view: full content (name, time, code on tall blocks)
- [ ]  Week view: compact chips (abbreviated name + court dot)
- [ ]  Click block → popover appears anchored to the block
- [ ]  Popover shows: code, status, customer info, time, court, price
- [ ]  "Ver Detalle" link → navigates to booking detail page (Flow 7.6)
- [ ]  Popover closes on outside click or Escape
- [ ]  Cancelled bookings shown at 30% opacity with strikethrough name
- [ ]  Blocked slots show reason icon + label ("Mantenimiento", "Evento Privado")
- [ ]  Open match blocks show 🎾 icon + player count ("2/4 jugadores")

---

### 8.6 Day Stats

**Priority:** P0

#### Stats Bar (below header, above grid)

```
[● Regular Hours] [● Peak Hours ⚡] [● Booked] [● Blocked]    12 reservas • S/ 1,240 • 68% ocupación
```

Left side: color legend matching grid zones. Right side: quick day stats.

#### Stats

| Stat | Source | Format |
| --- | --- | --- |
| Reservas | Booking count for the day | "12 reservas" |
| Ingresos | Sum of booking prices for the day | "S/ 1,240" |
| Ocupación | (booked hours / available hours) × 100 | "68%" |

#### Staff Simplified View

Per Flow 3 RBAC, staff sees a simplified stats bar:

- Booking count for today
- Next upcoming booking
- No revenue, no utilization percentage

#### Acceptance Criteria

- [ ]  Legend bar shows zone colors matching the grid backgrounds
- [ ]  Day stats show booking count, revenue, and utilization on the right
- [ ]  Stats update when navigating between days
- [ ]  Stats reflect only the selected day (not cumulative)
- [ ]  Staff sees simplified stats (no revenue, no utilization)
- [ ]  `org_admin` and `facility_manager` see full stats
- [ ]  Week view stats show per-day summary in column headers

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 8.1 — Day view grid | Core component. Most complex rendering logic (zone backgrounds, booking blocks, time positioning) | 8-10h |
| 2 | 8.5 — Booking blocks + popover | Booking rendering within the grid. Depends on 8.1 | 4-5h |
| 3 | 8.3 — Date navigation + view toggle | Header controls. Needed before week view | 2-3h |
| 4 | 8.6 — Day stats + legend bar | Stats bar between header and grid | 2h |
| 5 | 8.4 — Quick booking from empty slot | Empty cell interaction. Reuses Flow 7.3 modal | 2-3h |
| 6 | 8.2 — Week view | Alternative view. Reuses most day view components in compact mode | 5-6h |

**Total estimate:** ~23-29 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/f/[facilitySlug]/
│   └── calendar/
│       └── page.tsx                       # 8.1-8.6 — Calendar page
├── components/
│   └── calendar/
│       ├── CalendarDayView.tsx             # 8.1 — Courts × time grid
│       ├── CalendarWeekView.tsx            # 8.2 — Days × time grid
│       ├── CalendarHeader.tsx              # 8.3 — Nav + toggle + "Nueva Reserva"
│       ├── CalendarLegendStats.tsx         # 8.6 — Legend bar + day stats
│       ├── BookingBlock.tsx                # 8.5 — Individual booking block
│       ├── BookingBlockCompact.tsx         # 8.5 — Week view compact chip
│       ├── BookingPopover.tsx              # 8.5 — Click popover
│       ├── BlockedSlotBlock.tsx            # 8.1 — Blocked time rendering
│       ├── TimeColumn.tsx                  # 8.1 — Y-axis time labels
│       ├── CourtColumnHeader.tsx           # 8.1 — Court name + type + status
│       ├── CurrentTimeLine.tsx             # 8.1 — Red "NOW" line
│       ├── MiniCalendar.tsx                # 8.3 — Sidebar month picker
│       └── ZoneBackground.tsx              # 8.1 — Regular/Peak/Closed zone fills

packages/api/src/router/
└── calendar.ts                            # getDayView, getWeekView, getDayStats
```

---

## Performance Considerations

| Concern | Approach |
| --- | --- |
| Day view data | Single query returns ~20-50 bookings max per day. No pagination needed |
| Week view data | Returns aggregated data per day. Individual bookings loaded on demand per day column |
| Grid rendering | Memoize court column widths. Use CSS Grid for layout, not JS-calculated positions |
| Long operating hours (7am-11pm = 16 rows) | Vertical scroll with sticky header. Auto-scroll to current time on load |
| Current time line | Update position via `setInterval` every 60 seconds. CSS transform for smooth positioning |
| Real-time updates | MVP: refetch on window focus or every 5 minutes. Future: WebSocket/tRPC subscriptions |

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 5 (Courts) | 🔲 | Court columns in day view |
| Flow 6 (Schedule) — zone calculation, operating hours, peak periods, blocked slots | 🔲 | Zone backgrounds, available hours, blocked slot rendering |
| Flow 7 (Bookings) — `CreateBookingModal`, `booking.create`, `booking.confirm` | 🔲 | Quick booking from empty slot (8.4). Reuses existing modal |
| Flow 3 (RBAC) — facility scoping + staff simplified view | 🔲 | All roles can view. Staff sees simplified stats |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Facility with 8 courts (many columns) | Day view: horizontal scroll. Court headers sticky. Min column width: 120px |
| Booking spans half-hour boundaries (9:30-11:00) | Block positioned between row lines. Height calculated from exact start/end times |
| Two bookings overlap on same court (shouldn't happen, but data integrity) | Stack vertically with visual overlap indicator. This signals a bug — shouldn't be possible with conflict detection |
| Day with zero bookings | Empty grid shows all slots available. Stats show "0 reservas • S/ 0" |
| Closed day in week view | Column shows diagonal stripes. No interaction possible. Header shows "Cerrado" |
| Navigate to past date | Grid shows historical bookings (read-only feel). Empty slots not clickable for past times. Future slots on same day still clickable |
| Booking that started in regular zone and extends into peak | Block spans both zones. Single block with peak badge if any portion is peak |
| Many bookings stacked in week view (busy day) | Show first 3 chips + "+N más" overflow indicator. Click "+N" switches to day view for that date |
| Staff views calendar | Full calendar visible. Can click slots to create bookings. Stats simplified (no revenue) |

---

## Testing Checklist

### Day View

- [ ]  Grid renders with correct court columns and time rows
- [ ]  Zone backgrounds: green regular, amber peak, gray closed
- [ ]  Booking blocks positioned at correct time/court intersection
- [ ]  Block height matches booking duration
- [ ]  Current time red line at correct position
- [ ]  Auto-scrolls to current time on page load
- [ ]  Blocked slots rendered as red blocks with reason

### Week View

- [ ]  7-day grid with compact booking chips
- [ ]  Today column highlighted
- [ ]  Court dot colors match court assignments
- [ ]  Closed days show diagonal stripes
- [ ]  Overflow indicator when many bookings in one slot

### Navigation

- [ ]  ←/→ navigate between days/weeks correctly
- [ ]  "Hoy" jumps to current date
- [ ]  View toggle switches between day/week preserving date
- [ ]  Mini calendar click navigates main grid
- [ ]  URL reflects current date and view

### Quick Booking

- [ ]  Click empty slot → modal opens with pre-filled court/date/time
- [ ]  Day view pre-fills court from column header
- [ ]  Week view pre-fills date from day column
- [ ]  Created booking appears in grid immediately
- [ ]  Cannot click past time slots or blocked/closed zones

### Popover

- [ ]  Click booking block → popover shows booking summary
- [ ]  Popover shows: code, status, customer, time, court, price
- [ ]  "Ver Detalle" navigates to booking detail page
- [ ]  Popover closes on outside click or Escape

### Stats

- [ ]  Day stats show booking count, revenue, utilization
- [ ]  Stats update when navigating between days
- [ ]  Staff sees simplified stats (no revenue/utilization)
- [ ]  Legend bar matches grid zone colors

### RBAC

- [ ]  All three roles can view and interact with the calendar
- [ ]  Staff can create bookings from empty slots
- [ ]  Staff sees simplified stats bar
- [ ]  Calendar scoped to assigned facilities for managers and staff

---

## Definition of Done

- [ ]  Day view grid with courts × time, zone backgrounds, and booking blocks
- [ ]  Week view grid with days × time and compact booking chips
- [ ]  Date navigation with ←/→, "Hoy" button, and mini calendar
- [ ]  View toggle between Day and Week preserving date context
- [ ]  Quick booking from empty slot click (reuses Flow 7.3 modal)
- [ ]  Booking popover on block click with summary and "Ver Detalle" link
- [ ]  Day stats with legend bar (simplified for staff)
- [ ]  Current time indicator updates every minute
- [ ]  Zone backgrounds from Flow 6 zone logic
- [ ]  Performance: smooth rendering with 8 courts and 50+ bookings/day
- [ ]  All three roles can access (scoped to assigned facilities)
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows