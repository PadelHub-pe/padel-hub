# 📖 Flow 7: Booking Management — Engineering Task

The core operational flow of PadelHub. View, create, manage, and track bookings. This is where **all three roles converge** — staff creates walk-in bookings and manages the day-to-day, managers monitor facility performance, and admins oversee across locations.

---

## Context & Scope

**What Flow 7 owns:** Bookings list, booking creation (walk-in), booking detail page, booking drawer (quick view), status transitions, player management (add/remove), conflict detection, pagination, and the activity timeline.

**What Flow 7 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 6 (Schedule) | Pricing rules, zone calculation, blocked slots | Flow 7 applies the rate at booking time using `getRateForSlot()` from Flow 6 |
| Flow 8 (Calendar) | Visual calendar grid with time slot interactions | Flow 8 is the visual layer; Flow 7 is the data/action layer |
| 📧 Email System | Booking confirmation and cancellation emails | Future — not MVP-blocking, but architecture ready |

**RBAC — Who does what:**

| Action | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| View bookings list | ✅ All facilities | ✅ Assigned | ✅ Assigned |
| Create booking (walk-in) | ✅ | ✅ | ✅ |
| View booking detail | ✅ | ✅ | ✅ |
| Confirm pending booking | ✅ | ✅ | ✅ |
| Cancel booking | ✅ | ✅ | ✅ |
| Add/remove players | ✅ | ✅ | ✅ |
| Edit booking (date/time/court) | ✅ | ✅ | ✅ |

Bookings are fully operational for all roles — the staff at the counter needs every one of these actions.

---

## Prerequisites

- Flow 5 (Courts) — courts exist with pricing
- Flow 6 (Schedule) — operating hours + peak periods defined (for price calculation and availability)
- Flow 3 (RBAC) — facility scoping (users only see bookings for their accessible facilities)
- `bookings`, `booking_players`, `courts`, `facilities` tables ✅
- `booking_activity` table — **needs migration if not in schema**

---

## Database: `booking_activity` Table

If not already in schema:

```tsx
export const bookingActivity = pgTable('booking_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  // Types: created, confirmed, player_joined, player_left, started, completed, cancelled, modified
  description: text('description'),
  metadata: jsonb('metadata'),  // { userId, playerName, oldValue, newValue, etc. }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 7.1 | Bookings list (search, filter by court/status/date) | `/org/.../f/[facilitySlug]/bookings` | P0 |
| 7.2 | Pagination | Bookings list | P0 |
| 7.3 | Create manual booking (walk-in) | "Nueva Reserva" modal | P0 |
| 7.4 | Conflict / overlap detection | Create + edit booking | P0 |
| 7.5 | Booking detail drawer (slide-in quick view) | Row click → drawer | P0 |
| 7.6 | Booking detail page (full) | `/org/.../bookings/[bookingId]` | P0 |
| 7.7 | Confirm pending booking | Detail drawer/page | P0 |
| 7.8 | Cancel booking with reason | Detail drawer/page | P0 |
| 7.9 | Status transitions (pending → confirmed → in_progress → completed) | Detail | P0 |
| 7.10 | Add player (search user or guest) | Detail page → modal | P1 |
| 7.11 | Remove player (can’t remove owner) | Detail page | P1 |
| 7.12 | Court visualization (player positions) | Detail page | P1 |
| 7.13 | Activity timeline | Detail page | P1 |

---

## Sub-flow Specifications

---

### 7.1 Bookings List

**Route:** `/org/[slug]/f/[facilitySlug]/bookings`

**Priority:** P0

**Access:** All roles (scoped to assigned facilities)

#### Table Columns

| Column | Content | Sortable |
| --- | --- | --- |
| Código | PH-YYYY-XXXX (monospace, clickable) | No |
| Fecha | Date + day of week | Yes (default: desc) |
| Horario | Start – End + duration badge | Yes |
| Cancha | Court name + type badge | Yes |
| Jugadores | Avatar stack (max 4) + count badge ("2/4") | No |
| Precio | S/ amount + ⚡ if peak rate | Yes |
| Estado | Status badge (colored) | Yes |

#### Filter Controls

| Filter | Type | Options |
| --- | --- | --- |
| Búsqueda | Text | Search by confirmation code, player name, or email |
| Cancha | Select | All courts in facility |
| Estado | Multi-select chips | Todos / Pendiente / Confirmada / En curso / Completada / Cancelada |
| Fecha | Date range picker | Today, This week, This month, Custom range |

#### Acceptance Criteria

- [ ]  Table renders with all columns, sorted by date descending by default
- [ ]  Search filters by confirmation code, player name, or email (debounced 300ms)
- [ ]  Court filter shows facility's courts as dropdown
- [ ]  Status filter as multi-select chip bar (multiple statuses selectable)
- [ ]  Date range picker with presets: Hoy, Esta semana, Este mes, Personalizado
- [ ]  Filters persist in URL query params
- [ ]  Row click opens booking drawer (7.5)
- [ ]  Confirmation code click opens full detail page (7.6)
- [ ]  "Nueva Reserva" button in page header
- [ ]  Empty state: "No hay reservas" with appropriate message based on filters
- [ ]  Loading state: skeleton table rows
- [ ]  Player avatar stack shows up to 4 avatars, overlapping
- [ ]  Peak bookings show ⚡ icon next to price
- [ ]  Today's bookings subtly highlighted with a left border accent

#### API

```tsx
booking.list.query({
  facilitySlug: string,
  search?: string,
  courtId?: string,
  status?: BookingStatus[],
  dateRange?: { start: string, end: string },
  page: number,
  pageSize: number,  // default 20
  sortBy?: 'date' | 'time' | 'court' | 'price' | 'status',
  sortOrder?: 'asc' | 'desc',
})
// Returns: { bookings: BookingRow[], total: number, page, pageSize }
```

---

### 7.2 Pagination

**Priority:** P0

#### Acceptance Criteria

- [ ]  Page size: 20 bookings per page (configurable: 10, 20, 50)
- [ ]  Page controls at bottom: Previous / Next + page numbers
- [ ]  Shows: "Mostrando 1-20 de 156 reservas"
- [ ]  Preserves filters when changing pages
- [ ]  Page number in URL: `?page=2`
- [ ]  First load shows page 1 with most recent bookings

---

### 7.3 Create Manual Booking (Walk-in)

**Route:** "Nueva Reserva" modal

**Priority:** P0 — The most critical action for staff at the counter

#### Behavior

1. Staff clicks "Nueva Reserva" (from bookings list, calendar, or header)
2. Modal opens with booking form
3. Selects court, date, time range
4. System shows availability and calculates price using Flow 6 zone logic
5. Optionally adds the booking owner (search existing user or create guest)
6. Submits → booking created → appears in list and calendar

#### Modal Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Cancha | Select | Yes | Only active courts shown |
| Fecha | Date picker | Yes | Today or future. Must be within operating days |
| Hora inicio | Time select | Yes | Within operating hours, 30-min increments |
| Hora fin | Time select | Yes | After start, within operating hours. Default: +1.5h (standard padel match) |
| Jugador principal | User search or "Invitado" | No | Search existing users or enter guest name |
| Notas | Textarea | No | Internal notes, max 500 chars |

#### Price Calculation Preview

As the user selects court + date + time, show live price preview:

```
Cancha 1 • Miércoles 12 Mar • 19:00 - 20:30
⚡ Hora punta (19:00-22:00)
Precio: S/ 150 (1.5h × S/ 100/hr)
```

Uses `getRateForSlot()` from Flow 6 to determine regular vs peak pricing.

#### Availability Check

Before showing time options, check for conflicts (7.4). Unavailable slots are:

- Already booked (show as grayed with "Reservada")
- Blocked (show as red with "Bloqueada")
- Outside operating hours (not shown at all)
- Court in maintenance/inactive (court hidden from selector)

#### Acceptance Criteria

- [ ]  Modal opens with court selector showing only active courts
- [ ]  Date picker defaults to today, restricts to operating days
- [ ]  Time selects show only available hours within operating window
- [ ]  Default duration: 1.5 hours (standard padel match)
- [ ]  Conflict detection runs in real-time as user selects court/date/time (7.4)
- [ ]  Price preview updates live based on zone logic (regular vs peak)
- [ ]  ⚡ indicator shown when booking falls in peak period
- [ ]  Player search: type name/email → shows matching users. Or select "Invitado" (guest) and enter name
- [ ]  Guest bookings allowed (no user account required — walk-in at counter)
- [ ]  Submit → booking created with status `confirmed` (walk-ins skip pending)
- [ ]  Confirmation code auto-generated: PH-YYYY-XXXX
- [ ]  Toast: "Reserva creada • PH-2026-A7K2"
- [ ]  Booking appears in list and calendar immediately
- [ ]  Loading state on submit button

#### API

```tsx
booking.create.mutate({
  facilitySlug: string,
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  userId?: string,       // Existing user as owner
  guestName?: string,    // Walk-in guest (no account)
  notes?: string,
})
// Validates: no conflict, within operating hours, court active
// Calculates: price using getRateForSlot()
// Generates: confirmation code PH-YYYY-XXXX
// Sets: status = 'confirmed' for manual bookings
// Creates: booking + booking_players (owner) + booking_activity (created)
// Returns: { booking: Booking, confirmationCode: string }
```

---

### 7.4 Conflict / Overlap Detection

**Priority:** P0

#### Rules

A booking conflicts if for the **same court** on the **same date**, the time ranges overlap:

```tsx
function hasConflict(existing: Booking, newBooking: NewBooking): boolean {
  return existing.courtId === newBooking.courtId
    && existing.date === newBooking.date
    && existing.status !== 'cancelled'
    && existing.startTime < newBooking.endTime
    && existing.endTime > newBooking.startTime;
}
```

#### Acceptance Criteria

- [ ]  Conflict check runs on court + date + time selection in create modal (7.3)
- [ ]  Conflict check runs on edit booking (if date/time/court changes)
- [ ]  Conflicting time slots shown as unavailable in time picker
- [ ]  If user somehow submits a conflict, API returns 409 with: "Este horario ya está reservado en [Court Name]"
- [ ]  Blocked slots (from Flow 6.7) also treated as conflicts
- [ ]  Cancelled bookings do NOT create conflicts
- [ ]  Adjacent bookings (one ends at 10:00, next starts at 10:00) are NOT conflicts

---

### 7.5 Booking Detail Drawer (Slide-in)

**Priority:** P0

#### Behavior

Clicking a booking row in the list opens a slide-over drawer from the right showing a quick summary. The drawer is for quick actions without leaving the list context.

#### Drawer Content

- Confirmation code + status badge
- Date, time, duration
- Court name + type
- Price (with peak indicator)
- Player list (avatars + names, up to 4)
- Quick actions: Confirmar, Cancelar, Ver Detalle

#### Acceptance Criteria

- [ ]  Drawer slides in from right on row click
- [ ]  Shows booking summary without leaving the list page
- [ ]  Quick action buttons: "Confirmar" (if pending), "Cancelar", "Ver Detalle Completo"
- [ ]  "Ver Detalle Completo" navigates to full detail page (7.6)
- [ ]  Close on outside click, Escape key, or × button
- [ ]  Drawer URL doesn't change (it's an overlay, not a route)
- [ ]  Player avatars shown as small stack

---

### 7.6 Booking Detail Page (Full)

**Route:** `/org/[slug]/f/[facilitySlug]/bookings/[bookingId]`

**Priority:** P0

**Reference:** [Dashboard: Booking Detail screen](https://www.notion.so/Dashboard-Booking-Detail-screen-2fa8722b044f815b8ebee3a51772673a?pvs=21)

#### Layout

```
[Breadcrumb: Reservas > PH-2026-A7K2]
[PH-2026-A7K2]  [● Confirmada]  [3/4 jugadores]     [Editar] [Cancelar]

┌─ Cancha Visual (3/5) ──────┐  ┌─ Detalles (2/5) ───────┐
│  [Court diagram with           │  │  Fecha: Mar 12, 2026      │
│   4 player positions]          │  │  Hora: 19:00 - 20:30      │
│  Team A  |  Team B             │  │  Cancha: Cancha 1 (Indoor) │
└─────────────────────────────┘  │  Precio: S/ 150 ⚡         │
                                     │  Creada: hace 2 horas      │
┌─ Jugadores (2×2 grid) ──────┐  └─────────────────────────┘
│  [P1 ★ Owner]  [P2]           │
│  [P3]          [+ Agregar]    │  ┌─ Actividad ───────────────┐
└─────────────────────────────┘  │  Timeline of events...    │
                                     └─────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Breadcrumb: "Reservas > PH-YYYY-XXXX"
- [ ]  Header: confirmation code (large, monospace), status badge, player count badge
- [ ]  Action buttons based on status: Editar (confirmed only), Cancelar (confirmed/in_progress)
- [ ]  Reservation details card: date, time, duration, court with type badge, price with peak indicator, created timestamp
- [ ]  Players grid: 2×2 showing 4 slots (filled or empty)
- [ ]  Court visualization: padel court diagram with player positions (7.12)
- [ ]  Activity timeline: chronological log of all events (7.13)
- [ ]  Loading skeleton while data fetches

---

### 7.7 Confirm Pending Booking

**Priority:** P0

#### Behavior

Bookings created via the mobile app arrive as `pending`. Dashboard users confirm them.

#### Acceptance Criteria

- [ ]  "Confirmar" button visible on pending bookings (drawer and detail page)
- [ ]  Click → API call → status changes to `confirmed` → toast: "Reserva confirmada"
- [ ]  Status badge updates immediately (optimistic)
- [ ]  Activity log entry: "Reserva confirmada por [user name]"
- [ ]  Button hidden for non-pending bookings
- [ ]  Batch confirm: in list view, select multiple pending bookings → "Confirmar seleccionadas" (P2, nice-to-have)

#### API

```tsx
booking.confirm.mutate({ bookingId: string })
// Validates: booking is 'pending'
// Sets: status = 'confirmed'
// Logs: booking_activity entry
```

---

### 7.8 Cancel Booking with Reason

**Priority:** P0

#### Cancel Modal

```
┌──────────────────────────────────────┐
│  ¿Cancelar reserva PH-2026-A7K2?           │
│                                            │
│  Cancha 1 • Mar 12 • 19:00-20:30           │
│  3 jugadores serán notificados              │
│                                            │
│  Motivo (opcional):                        │
│  [▽ Seleccionar motivo         ]            │
│                                            │
│  Nota interna (opcional):                  │
│  [________________________]                 │
│                                            │
│  [Volver]        [Cancelar Reserva] (red)   │
└──────────────────────────────────────┘
```

#### Cancellation Reasons

- Solicitud del jugador
- No-show
- Mantenimiento de cancha
- Evento privado
- Error de reserva
- Otro

#### Acceptance Criteria

- [ ]  "Cancelar Reserva" opens modal with booking summary
- [ ]  Shows player count that will be notified
- [ ]  Reason select: optional, from predefined list
- [ ]  Internal note: optional, for internal tracking only (not shown to player)
- [ ]  Confirm → status set to `cancelled`, `cancelled_by: 'facility'`, `cancelled_at` timestamp
- [ ]  Toast: "Reserva cancelada"
- [ ]  Activity log entry: "Reserva cancelada por [user name]. Motivo: [reason]"
- [ ]  Cancelled booking grayed out in list, not removed
- [ ]  Can cancel from: bookings list (drawer), detail page, calendar (Flow 8)
- [ ]  Cannot cancel already-cancelled or completed bookings

#### API

```tsx
booking.cancel.mutate({
  bookingId: string,
  reason?: string,
  internalNote?: string,
})
// Validates: booking is 'pending', 'confirmed', or 'in_progress'
// Sets: status = 'cancelled', cancelled_by = 'facility', cancelled_at = now()
// Logs: booking_activity entry with reason
```

---

### 7.9 Status Transitions

**Priority:** P0

#### State Machine

```
pending → confirmed → in_progress → completed
    │         │            │
    └─────────┼────────────┘
              │
           cancelled
```

#### Transition Rules

| Transition | Trigger | Automatic? |
| --- | --- | --- |
| pending → confirmed | Dashboard user confirms (7.7) | Manual |
| confirmed → in_progress | Booking start time reached | Automatic (cron or on-access check) |
| in_progress → completed | Booking end time reached | Automatic |
| any (except completed) → cancelled | User or facility cancels (7.8) | Manual |
| pending → cancelled | Auto-expire if not confirmed within X hours (future) | Automatic (future) |

#### MVP Approach for Auto-Transitions

For MVP, use an **on-access check** instead of a cron job: when a booking is queried, check if it should have transitioned based on current time. Update status inline.

```tsx
function resolveBookingStatus(booking: Booking): BookingStatus {
  const now = new Date();
  const bookingStart = parseDateTime(booking.date, booking.startTime);
  const bookingEnd = parseDateTime(booking.date, booking.endTime);
  
  if (booking.status === 'confirmed' && now >= bookingStart) {
    return 'in_progress'; // Auto-transition
  }
  if (booking.status === 'in_progress' && now >= bookingEnd) {
    return 'completed'; // Auto-transition
  }
  return booking.status;
}
```

#### Acceptance Criteria

- [ ]  Status badges reflect correct current state at all times
- [ ]  `confirmed` → `in_progress` when booking start time passes
- [ ]  `in_progress` → `completed` when booking end time passes
- [ ]  Auto-transitions happen on query (on-access), not via cron (MVP)
- [ ]  Manual transitions: confirm (7.7), cancel (7.8)
- [ ]  Cannot transition backwards (completed → confirmed is invalid)
- [ ]  Status transitions logged in booking_activity
- [ ]  Cancelled is a terminal state — no further transitions

---

### 7.10 Add Player

**Priority:** P1

**Reference:** [Booking Detail screen — Add Player Flow](https://www.notion.so/Dashboard-Booking-Detail-screen-2fa8722b044f815b8ebee3a51772673a?pvs=21)

#### Behavior

1. On booking detail, click empty player slot ("+ Agregar")
2. Search modal opens: search by name, email, or phone
3. Select user → assign court position (1-4)
4. Player added to `booking_players` with `role: 'player'`

#### Acceptance Criteria

- [ ]  "+ Agregar" shown on empty player slots (positions without a player)
- [ ]  Search modal: search existing users by name/email/phone
- [ ]  Position selector: only shows unoccupied positions (1-4)
- [ ]  Position labels: "Equipo A — Frente", "Equipo A — Fondo", "Equipo B — Frente", "Equipo B — Fondo"
- [ ]  Cannot add same user twice to same booking
- [ ]  Max 4 players per booking
- [ ]  Player count badge updates ("3/4" → "4/4")
- [ ]  Activity log: "[Player name] se unió a la reserva (Posición: Equipo A — Frente)"
- [ ]  Court visualization updates with new player (7.12)

#### API

```tsx
booking.addPlayer.mutate({
  bookingId: string,
  userId: string,
  position: 1 | 2 | 3 | 4,
})
```

---

### 7.11 Remove Player

**Priority:** P1

#### Acceptance Criteria

- [ ]  Remove icon (×) on each player card except the owner
- [ ]  Owner card has no remove option (gold star, "OWNER" badge, no ×)
- [ ]  Click × → confirmation: "¿Quitar a [Player Name] de esta reserva?"
- [ ]  Confirm → player removed from `booking_players`
- [ ]  Player count updates ("4/4" → "3/4")
- [ ]  Slot becomes empty ("+ Agregar" returns)
- [ ]  Activity log: "[Player name] fue removido de la reserva por [staff name]"
- [ ]  Court visualization updates (7.12)

#### API

```tsx
booking.removePlayer.mutate({
  bookingId: string,
  bookingPlayerId: string,  // booking_players.id
})
// Validates: player is not the owner
```

---

### 7.12 Court Visualization

**Priority:** P1

#### Acceptance Criteria

- [ ]  SVG or CSS padel court diagram showing 4 positions
- [ ]  Filled positions show: player avatar (initials), name, skill level badge
- [ ]  Owner position has gold star badge (★)
- [ ]  Empty positions show: dashed circle with "+"
- [ ]  Court divided into Team A (left) and Team B (right)
- [ ]  Positions: 1=Front Left, 2=Back Left, 3=Front Right, 4=Back Right
- [ ]  Court styling: blue/green gradient, white lines, center net
- [ ]  Responsive: scales down on smaller screens

---

### 7.13 Activity Timeline

**Priority:** P1

#### Event Types

| Event | Icon | Color | Description Format |
| --- | --- | --- | --- |
| created | 📅 | Primary | "Reserva creada por [name]" |
| confirmed | ✅ | Green | "Reserva confirmada por [name]" |
| player_joined | 👤+ | Green | "[Player] se unió (Equipo A — Frente)" |
| player_left | 👤- | Red | "[Player] fue removido por [staff]" |
| modified | ✎ | Amber | "Horario cambiado: 19:00-20:30 → 20:00-21:30" |
| started | ▶ | Blue | "Reserva en curso" |
| completed | 🏁 | Green | "Reserva completada" |
| cancelled | ❌ | Red | "Cancelada por [name]. Motivo: [reason]" |

#### Acceptance Criteria

- [ ]  Timeline renders chronologically (newest at top)
- [ ]  Each entry: icon + description + relative timestamp ("hace 2 horas")
- [ ]  Auto-transitions (started, completed) also appear in timeline
- [ ]  Metadata preserved: old/new values for modifications, player names for joins/leaves

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 7.4 — Conflict detection | Utility needed before create or edit. Write as shared function | 2h |
| 2 | 7.9 — Status transitions (on-access resolver) | Must exist before list/detail render correct statuses | 2h |
| 3 | 7.3 — Create booking (walk-in) | Core action. Staff needs this first | 6-8h |
| 4 | 7.1 + 7.2 — Bookings list + pagination | The main view. Table + filters + pagination | 5-6h |
| 5 | 7.5 — Booking drawer | Quick view from list. Simpler than full page | 3h |
| 6 | 7.7 + 7.8 — Confirm + Cancel | Essential actions, work from drawer and detail page | 3-4h |
| 7 | 7.6 — Booking detail page | Full page with all sections. Depends on most other sub-flows | 5-6h |
| 8 | 7.13 — Activity timeline | P1. Read-only timeline component | 2-3h |
| 9 | 7.10 + 7.11 — Add/remove player | P1. Player management modals | 4-5h |
| 10 | 7.12 — Court visualization | P1. SVG/CSS court diagram | 3-4h |

**Total estimate:** ~35-42 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/f/[facilitySlug]/
│   └── bookings/
│       ├── page.tsx                       # 7.1, 7.2 — List + pagination
│       └── [bookingId]/
│           └── page.tsx                   # 7.6 — Detail page
├── components/
│   ├── bookings/
│   │   ├── BookingsTable.tsx              # 7.1 — Table with filters
│   │   ├── BookingFilters.tsx             # 7.1 — Search, court, status, date filters
│   │   ├── BookingDrawer.tsx              # 7.5 — Slide-over quick view
│   │   ├── BookingDetailHeader.tsx        # 7.6 — Code + status + actions
│   │   ├── BookingInfoCard.tsx            # 7.6 — Date, time, court, price
│   │   ├── CreateBookingModal.tsx         # 7.3 — Walk-in booking form
│   │   ├── CancelBookingModal.tsx         # 7.8 — Cancel with reason
│   │   ├── PlayerGrid.tsx                # 7.6 — 2×2 player cards
│   │   ├── PlayerCard.tsx                # 7.6 — Individual player card
│   │   ├── AddPlayerModal.tsx             # 7.10 — Search + add
│   │   ├── CourtDiagram.tsx               # 7.12 — SVG court with positions
│   │   ├── ActivityTimeline.tsx           # 7.13 — Event log
│   │   ├── StatusBadge.tsx                # 7.1/7.6 — Colored status pill
│   │   └── PlayerCountBadge.tsx           # 7.6 — "3/4" player count

packages/api/src/
├── router/
│   └── booking.ts                         # All booking CRUD + player management
└── utils/
    ├── booking-conflicts.ts               # 7.4 — Conflict detection
    └── booking-status.ts                  # 7.9 — On-access status resolver
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 5 (Courts) — active courts with pricing | 🔲 | Court selector in booking creation |
| Flow 6 (Schedule) — operating hours, peak periods, zone logic | 🔲 | Price calculation and availability in booking creation |
| Flow 3 (RBAC) — facility scoping | 🔲 | Users only see bookings for accessible facilities |
| `bookings` table | ✅ | — |
| `booking_players` table | ✅ | — |
| `booking_activity` table | 🔲 Needs migration | 7.13 activity timeline |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Create booking for a time that just got booked by someone else | Conflict detection catches it. API returns 409. Modal shows error: "Este horario acaba de ser reservado" |
| Cancel a booking that's currently in_progress | Allowed. Status → cancelled. Useful if players don't show up after start time |
| Add 5th player to a booking | API returns error. "+ Agregar" slot not shown when 4/4 |
| Remove the booking owner | Not allowed. Owner card has no × button. API validates |
| Booking spans regular → peak zone (e.g., 18:00-20:00 where peak starts at 19:00) | Price calculated as: 1h regular + 1h peak. Shown in price breakdown |
| Create booking on a closed day | Day not selectable in date picker. API validates against operating hours |
| Search for a player that doesn't exist | "No se encontró ningún jugador" with option to enter as guest |
| Guest booking (no user account) | Booking created with `userId: null` and guest name stored in notes or a guest field. Owner slot shows guest name without avatar |
| Staff tries to create booking outside operating hours | Time slots outside hours not shown. API validates as fallback |
| Two staff members create bookings for same slot simultaneously | First one succeeds. Second gets 409 conflict. Optimistic UI reverts |

---

## Testing Checklist

- [ ]  **Bookings list:** See all facility bookings with correct statuses and filters
- [ ]  **Search:** Find booking by code, player name, or email
- [ ]  **Filter by status:** Select "Pendiente" → only pending shown
- [ ]  **Filter by date:** Select "Hoy" → only today's bookings
- [ ]  **Pagination:** Navigate between pages, count updates with filters
- [ ]  **Create walk-in:** Select court + date + time → price preview → submit → booking appears
- [ ]  **Conflict detection:** Try to book an occupied slot → blocked
- [ ]  **Booking drawer:** Click row → drawer opens with summary + quick actions
- [ ]  **Confirm booking:** Pending → Confirmar → status updates to confirmed
- [ ]  **Cancel booking:** Confirmed → Cancelar → reason modal → cancelled
- [ ]  **Status transitions:** Booking passes start time → auto-transitions to in_progress
- [ ]  **Detail page:** All sections render: info, players, court diagram, timeline
- [ ]  **Add player:** Search → select → assign position → player appears on court
- [ ]  **Remove player:** Click × → confirm → player removed → slot opens
- [ ]  **Owner protection:** Cannot remove booking owner
- [ ]  **Peak pricing:** Create booking during peak → ⚡ indicator + correct price
- [ ]  **Split-zone booking:** Booking spans regular+peak → blended price shown
- [ ]  **RBAC:** All three roles can create/manage bookings. Staff sees only assigned facility bookings

---

## Definition of Done

- [ ]  Bookings list with search, filters, sort, and pagination
- [ ]  Walk-in booking creation with availability check and live price preview
- [ ]  Conflict detection prevents double-bookings
- [ ]  Booking drawer for quick view from list
- [ ]  Booking detail page with all sections (info, players, court, timeline)
- [ ]  Confirm and cancel actions work from drawer and detail page
- [ ]  Status auto-transitions on-access (confirmed→in_progress→completed)
- [ ]  Player management: add/remove with court position assignment
- [ ]  Court visualization showing 4 positions with team labels
- [ ]  Activity timeline logging all booking events
- [ ]  All three roles can use all booking features
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows