# ⏰ Flow 6: Schedule & Pricing — Engineering Task

Configure when the facility operates, what things cost, and define the rules that govern booking availability. This is the **configuration layer** — the rules engine behind bookings and the calendar.

---

## Context & Scope

**What Flow 6 owns:** Operating hours, peak period management, default/court-level pricing, the weekly rate visual, revenue estimation, and time blocking. These are the "rules" that determine when courts are available and at what price.

**What Flow 6 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 4 (Onboarding) | Initial operating hours + pricing during setup wizard (Step 2) | The wizard sets sensible defaults; Flow 6 is the full config experience |
| Flow 5 (Courts) | Per-court base `hourly_rate_cents` and `peak_rate_cents` | Flow 5 sets the court-level prices; Flow 6 manages facility-level defaults and overrides |
| Flow 7 (Bookings) | Price calculation when creating a booking | Flow 6 defines the rates; Flow 7 applies them at booking time |
| Flow 8 (Calendar) | The visual day/week grid showing bookings and availability | Flow 6 provides zone logic (closed/regular/peak); Flow 8 renders the interactive calendar |

**The pricing chain:**

```
Flow 6 (defines rates + peak periods + hours)
  → Flow 8 (calendar renders zones with correct colors)
  → Flow 7 (booking creation applies correct rate based on time + court)
  → Player sees price in mobile app
```

---

## Prerequisites

- Flow 4 (Onboarding) — facility exists with initial operating hours from wizard
- Flow 5 (Courts) — courts exist with base pricing
- Flow 3 (RBAC) — `org_admin` and `facility_manager` can configure; `staff` cannot
- `facilities.operating_hours` JSONB ✅
- `time_slots` table ✅
- `peak_periods` table — **needs migration if not in schema**
- `blocked_slots` table — **needs creation**

---

## Database: New Tables Needed

### `peak_periods`

If not already in schema:

```tsx
export const peakPeriods = pgTable('peak_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  days: jsonb('days').notNull(),           // number[] e.g. [1,2,3,4,5]
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  markupPercent: integer('markup_percent').notNull(), // e.g. 25 = +25%
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### `blocked_slots`

```tsx
export const blockedSlots = pgTable('blocked_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id).notNull(),
  courtId: uuid('court_id').references(() => courts.id), // null = all courts
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  reason: varchar('reason', { length: 50 }),  // maintenance, private_event, tournament, etc.
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 6.1 | View/edit 7-day operating hours | `/org/.../f/[facilitySlug]/schedule` | P0 |
| 6.2 | Create peak period | "Agregar Periodo" modal | P0 |
| 6.3 | Edit / delete peak period | Peak period card actions | P0 |
| 6.4 | Pricing overview — rate cards + weekly visual | `/org/.../f/[facilitySlug]/pricing` | P0 |
| 6.5 | Court-specific pricing overrides | Pricing page → court table | P0 |
| 6.6 | Revenue calculator (occupancy-based) | Pricing page → revenue banner | P1 |
| 6.7 | Block time slots (maintenance, events) | "Bloquear Horario" modal | P1 |

---

## Sub-flow Specifications

---

### 6.1 View/Edit 7-Day Operating Hours

**Route:** `/org/[slug]/f/[facilitySlug]/schedule`

**Priority:** P0

**Access:** `org_admin` + `facility_manager`

**Reference:** [Dashboard: Schedule screen](https://www.notion.so/Dashboard-Schedule-screen-2fa8722b044f817f829fd2bc63249358?pvs=21)

#### Layout

The schedule page has two collapsible config cards at the bottom (below the calendar grid which is Flow 8). The first card is Operating Hours.

#### Operating Hours Editor

7-day grid with toggles and time pickers:

```
Lunes      [✅ Abierto]  [07:00] — [22:00]
Martes     [✅ Abierto]  [07:00] — [22:00]
Miércoles  [✅ Abierto]  [07:00] — [22:00]
Jueves     [✅ Abierto]  [07:00] — [22:00]
Viernes    [✅ Abierto]  [07:00] — [23:00]
Sábado     [✅ Abierto]  [08:00] — [23:00]
Domingo    [✅ Abierto]  [08:00] — [20:00]

[Aplicar a todos]   [Guardar Cambios]
```

#### Acceptance Criteria

- [ ]  7-day grid pre-filled from `facilities.operating_hours` JSONB
- [ ]  Each day: open/closed toggle + start time + end time
- [ ]  Time selects in 30-minute increments
- [ ]  Close time must be after open time
- [ ]  Toggling a day closed disables its time pickers and grays the row
- [ ]  "Aplicar a todos" copies the currently selected day's hours to all open days
- [ ]  "Guardar Cambios" saves to `facilities.operating_hours` JSONB
- [ ]  Save button disabled until changes are made (dirty state)
- [ ]  Toast on save: "Horarios actualizados"
- [ ]  Changes reflected immediately in the calendar grid (Flow 8) zone backgrounds
- [ ]  Validation: at least 1 day must remain open
- [ ]  Warning when reducing hours if existing bookings fall outside new hours: "Hay N reservas fuera del nuevo horario. Se cancelarán al guardar."

#### API

```tsx
schedule.getOperatingHours.query({ facilitySlug: string })
// Returns: OperatingHours JSONB

schedule.updateOperatingHours.mutate({
  facilitySlug: string,
  hours: OperatingHours,
})
// Validates: at least 1 open day, close > open for each day
// Warns: returns affectedBookings count if any fall outside new hours
// Returns: { success: true, affectedBookings?: number }
```

---

### 6.2 Create Peak Period

**Component:** "Agregar Periodo Punta" modal

**Priority:** P0

#### Modal Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Nombre | Text | Yes | 2-50 chars (e.g., "Hora Punta Noche", "Fin de Semana") |
| Días | Checkbox group | Yes | At least 1 day selected |
| Hora inicio | Time select | Yes | 30-min increments, within operating hours |
| Hora fin | Time select | Yes | After start, within operating hours |
| Markup (%) | Number | Yes | 1-100 (e.g., 25 = +25% over regular rate) |

#### Quick Day Select Shortcuts

- "Lun-Vie" → selects weekdays
- "Sáb-Dom" → selects weekends
- "Todos" → selects all

#### Peak Period Card Preview

After creation, the period appears as a styled card:

```
┌──────────────────────────────┐
│  🌙 Hora Punta Noche        +25%  │
│  Lun Mar Mié Jue Vie            │
│  7:00 PM – 10:00 PM             │
│                   [✎]  [🗑]    │
└──────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Modal opens with all fields
- [ ]  Day checkboxes with quick-select shortcuts
- [ ]  Time range must fall within operating hours for the selected days
- [ ]  Markup percentage shown as both number and S/ preview (e.g., "+25% = S/ 100/hr" based on default regular rate)
- [ ]  Overlap detection: warn if new period overlaps with existing peak period on same days/times
- [ ]  Submit → creates `peak_periods` row → toast → card appears in peak periods list
- [ ]  Weekly rate visual (6.4) updates immediately to show new amber zone
- [ ]  Calendar grid (Flow 8) updates zone backgrounds
- [ ]  Max 5 peak periods per facility (reasonable limit)

#### API

```tsx
schedule.createPeakPeriod.mutate({
  facilitySlug: string,
  name: string,
  days: number[],
  startTime: string,
  endTime: string,
  markupPercent: number,
})
// Validates: times within operating hours, no exact duplicates
// Returns: { success: true, peakPeriod: PeakPeriod }
```

---

### 6.3 Edit / Delete Peak Period

**Component:** Peak period card actions

**Priority:** P0

#### Edit Behavior

Click ✎ on a peak period card → opens the same modal as 6.2, pre-filled. Save → updates the period.

#### Delete Behavior

Click 🗑 on a peak period card → confirmation: "¿Eliminar periodo [Name]? Las reservas existentes con tarifa punta mantendrán su precio original." → confirm → period deleted.

#### Acceptance Criteria

- [ ]  Edit opens pre-filled modal → save updates period → toast "Periodo actualizado"
- [ ]  Delete shows confirmation → period removed → toast "Periodo eliminado"
- [ ]  Existing bookings made during peak pricing keep their original price (no retroactive changes)
- [ ]  Weekly visual and calendar grid update immediately after edit/delete
- [ ]  Can edit all fields: name, days, times, markup

#### API

```tsx
schedule.updatePeakPeriod.mutate({
  periodId: string,
  name?: string,
  days?: number[],
  startTime?: string,
  endTime?: string,
  markupPercent?: number,
})

schedule.deletePeakPeriod.mutate({ periodId: string })
```

---

### 6.4 Pricing Overview — Rate Cards + Weekly Visual

**Route:** `/org/[slug]/f/[facilitySlug]/pricing`

**Priority:** P0

**Access:** `org_admin` + `facility_manager`

**Reference:** [Dashboard: Pricing screen](https://www.notion.so/Dashboard-Pricing-screen-2fa8722b044f815f9628d54dfe88b046?pvs=21)

#### Rate Cards (Top of Page)

Two side-by-side cards comparing regular vs peak pricing:

**Regular Rate Card (left):**

- ☀️ icon, "Horario Regular" heading
- Large editable price input: S/ [80] /hora
- Progress bar: "∼65% de las horas semanales"
- Checklist of when it applies

**Peak Rate Card (right):**

- ⚡ icon, "Hora Punta" heading, amber "PEAK" badge
- Large editable price input: S/ [100] /hora
- Auto-calculated markup badge: "+25%"
- Progress bar: "∼35% de las horas semanales"
- List of peak windows

#### Weekly Rate Schedule Visual

Horizontal timeline for each day (Mon-Sun) showing colored zones:

```
Lun: [Gray 6-7] [Green 7-19 "S/80"] [Amber 19-22 "⚡S/100"] [Green 22-23] [Gray 23+]
Mar: [Gray 6-7] [Green 7-19 "S/80"] [Amber 19-22 "⚡S/100"] [Green 22-23] [Gray 23+]
...
Sáb: [Gray 6-8] [Amber 10-20 "⚡S/100"] [Green rest] [Gray 23+]
Dom: [Gray 6-8] [Amber 10-20 "⚡S/100"] [Green rest] [Gray 20+]
```

Colors: gray (closed), green-50 (regular), amber gradient (peak)

#### Acceptance Criteria

- [ ]  Two rate cards show current default regular and peak rates
- [ ]  Rate inputs are editable inline — changing recalculates markup badge and revenue
- [ ]  Markup % calculated automatically: `((peak - regular) / regular) * 100`
- [ ]  Weekly visual shows 7-day timeline with correct zone colors
- [ ]  Zone blocks show rate inside ("S/80" for regular, "⚡S/100" for peak)
- [ ]  Weekend rows visually highlighted
- [ ]  Legend: Gray = Cerrado, Green = Regular, Amber = Hora Punta
- [ ]  "Guardar Cambios" saves both regular and peak default rates
- [ ]  Changes cascade to courts using default rates (courts with overrides unaffected)
- [ ]  Saving rate changes does NOT retroactively change existing booking prices

#### API

```tsx
pricing.getFacilityPricing.query({ facilitySlug: string })
// Returns: {
//   defaultRegularRate: number,     // cents
//   defaultPeakRate: number,         // cents
//   peakPeriods: PeakPeriod[],
//   courts: CourtPricing[],
//   weeklyStats: { regularHoursPercent, peakHoursPercent }
// }

pricing.updateDefaultRates.mutate({
  facilitySlug: string,
  regularRateCents: number,
  peakRateCents: number,
})
// Validates: peak >= regular, both > 0
```

---

### 6.5 Court-Specific Pricing Overrides

**Component:** Court pricing table on pricing page

**Priority:** P0

#### Table

| Column | Content |
| --- | --- |
| Cancha | Color dot + name + "PREMIUM" badge if applicable |
| Tipo | Indoor / Outdoor / Covered badge |
| Tarifa Regular | "Por defecto (S/ 80)" or custom "S/ 90" |
| Tarifa Punta | "Por defecto (S/ 100)" or custom "S/ 120" |
| Estado | "Default" gray badge or "Custom" blue badge |
| Acción | "Personalizar" / "Restablecer" button |

#### Override Dialog

Click "Personalizar" → dialog with two fields:

- Tarifa Regular: S/ [90]
- Tarifa Punta: S/ [120]
- "Restablecer a valores por defecto" link at bottom

#### Acceptance Criteria

- [ ]  Table lists all courts with their current pricing (default or custom)
- [ ]  Courts using default rates show "Por defecto (S/ X)" in gray
- [ ]  Courts with custom rates show the custom value with "Custom" blue badge
- [ ]  "Personalizar" opens dialog to set court-specific rates
- [ ]  Custom rates stored in `courts.hourly_rate_cents` and `courts.peak_rate_cents`
- [ ]  "Restablecer" removes custom rates → court falls back to facility defaults
- [ ]  Premium courts (e.g., indoor with special features) can be flagged with "PREMIUM" badge
- [ ]  Revenue calculator (6.6) uses actual court rates (custom if set, default otherwise)
- [ ]  Changing default rate updates all "Por defecto" values in the table immediately

#### API

```tsx
pricing.updateCourtPricing.mutate({
  courtId: string,
  hourlyRateCents: number | null,   // null = reset to default
  peakRateCents: number | null,
})
```

---

### 6.6 Revenue Calculator

**Component:** Gradient banner on pricing page

**Priority:** P1

#### Layout

```
┌──────────────────────────────────────────────────┐
│  💰 Ingresos Semanales Estimados                       │
│  Basado en tarifas actuales y [70]% de ocupación     │
│                                                      │
│              S/ 8,960 / semana                        │
│                                                      │
│  Regular       Hora Punta      Bonus Punta            │
│  S/ 5,824      S/ 3,136        +S/ 784                │
└──────────────────────────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Gradient banner (primary blue) shows estimated weekly revenue
- [ ]  Occupancy slider/input: 10%-100%, default 70%
- [ ]  Calculation uses: actual court rates (custom or default) × operating hours × peak/regular split × occupancy
- [ ]  Three-column breakdown: Regular revenue, Peak revenue, Peak bonus (extra revenue from markup)
- [ ]  Recalculates live as occupancy slider changes
- [ ]  Recalculates when rates or peak periods are modified
- [ ]  "Bonus Punta" shows the extra revenue earned from peak pricing vs if everything were regular
- [ ]  Monthly projection toggle: "Ver proyección mensual" → weekly × 4.33

#### API

```tsx
pricing.calculateRevenue.query({
  facilitySlug: string,
  occupancyPercent: number,  // 0.1 to 1.0
})
// Returns: {
//   weeklyTotal: number,
//   regularRevenue: number,
//   peakRevenue: number,
//   peakBonus: number,
//   monthlyProjection: number,
// }
```

---

### 6.7 Block Time Slots

**Component:** "Bloquear Horario" modal

**Priority:** P1

#### Behavior

Block specific time slots on specific courts for maintenance, private events, tournaments, etc. Blocked slots are unavailable for booking.

#### Modal Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Cancha(s) | Multi-select | Yes | "Todas las canchas" option + individual courts |
| Fecha | Date picker | Yes | Today or future dates only |
| Hora inicio | Time select | Yes | Within operating hours |
| Hora fin | Time select | Yes | After start, within operating hours |
| Motivo | Select | No | Mantenimiento / Evento Privado / Torneo / Capacitación / Clima / Otro |
| Notas | Textarea | No | Max 500 chars |

#### Acceptance Criteria

- [ ]  Modal accessible from schedule page header ("Bloquear Horario" button) and from calendar (Flow 8) right-click
- [ ]  Can select individual courts or "Todas las canchas"
- [ ]  Time range within operating hours for selected date
- [ ]  Conflict check: if existing bookings overlap the blocked time → warning: "Hay N reservas en este horario que serán canceladas"
- [ ]  Confirm → creates `blocked_slots` row(s) → cancels conflicting bookings if user confirmed
- [ ]  Blocked slots appear in calendar grid (Flow 8) as red zones
- [ ]  Blocked slots appear in booking creation (Flow 7) as unavailable
- [ ]  Can delete a blocked slot from calendar view (right-click → "Desbloquear")
- [ ]  Toast on success: "Horario bloqueado" with reason
- [ ]  Only `org_admin` and `facility_manager` can block time

#### API

```tsx
schedule.blockTimeSlot.mutate({
  facilitySlug: string,
  courtIds: string[] | null,  // null = all courts
  date: string,
  startTime: string,
  endTime: string,
  reason?: string,
  notes?: string,
})
// Returns: { success: true, blocked: BlockedSlot, cancelledBookings?: number }

schedule.unblockTimeSlot.mutate({ blockedSlotId: string })
// Returns: { success: true }

schedule.getBlockedSlots.query({
  facilitySlug: string,
  dateRange: { start: string, end: string },
})
// Returns: BlockedSlot[]
```

---

## Shared: Zone Calculation Logic

This logic is consumed by Flow 6 (weekly visual), Flow 7 (price calculation), and Flow 8 (calendar grid colors).

```tsx
type TimeZone = 'closed' | 'regular' | 'peak' | 'blocked';

function getTimeZone(
  time: string,
  dayOfWeek: number,
  date: string,
  config: {
    operatingHours: OperatingHours,
    peakPeriods: PeakPeriod[],
    blockedSlots: BlockedSlot[],
  }
): TimeZone {
  const dayConfig = config.operatingHours[dayOfWeek];

  // Outside operating hours
  if (!dayConfig?.isOpen || time < dayConfig.openTime || time >= dayConfig.closeTime) {
    return 'closed';
  }

  // Check blocked slots for this specific date
  const isBlocked = config.blockedSlots.some(slot =>
    slot.date === date &&
    time >= slot.startTime &&
    time < slot.endTime
  );
  if (isBlocked) return 'blocked';

  // Check peak periods
  const isPeak = config.peakPeriods.some(period =>
    period.days.includes(dayOfWeek) &&
    time >= period.startTime &&
    time < period.endTime
  );

  return isPeak ? 'peak' : 'regular';
}

// Get the rate for a court at a specific time
function getRateForSlot(
  court: Court,
  zone: TimeZone,
  facilityDefaults: { regularRateCents: number, peakRateCents: number }
): number {
  if (zone === 'closed' || zone === 'blocked') return 0;

  const regularRate = court.hourlyRateCents ?? facilityDefaults.regularRateCents;
  const peakRate = court.peakRateCents ?? facilityDefaults.peakRateCents;

  return zone === 'peak' ? peakRate : regularRate;
}
```

This should live in a shared utility (e.g., `packages/api/src/utils/schedule.ts`) so all flows reference the same logic.

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | Zone calculation utility | Shared logic consumed by everything else | 2h |
| 2 | 6.1 — Operating hours editor | Foundation. Hours define when everything is available | 4-5h |
| 3 | 6.2 + 6.3 — Peak period CRUD | Creates the zones that drive pricing | 4-5h |
| 4 | 6.4 — Pricing overview + weekly visual | Rate cards + visual timeline. Core pricing page | 5-6h |
| 5 | 6.5 — Court-specific overrides | Per-court pricing table. Extends pricing page | 3-4h |
| 6 | 6.6 — Revenue calculator | P1. Nice visualization, not blocking | 3h |
| 7 | 6.7 — Block time slots | P1. Important for operations but not day-one critical | 4-5h |

**Total estimate:** ~25-30 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/f/[facilitySlug]/
│   ├── schedule/
│   │   └── page.tsx                       # 6.1 + 6.2 + 6.3 + 6.7
│   └── pricing/
│       └── page.tsx                       # 6.4 + 6.5 + 6.6
├── components/
│   ├── schedule/
│   │   ├── OperatingHoursEditor.tsx        # 6.1 — 7-day grid
│   │   ├── PeakPeriodCard.tsx              # 6.2/6.3 — Peak period card
│   │   ├── PeakPeriodModal.tsx             # 6.2/6.3 — Create/edit modal
│   │   └── BlockTimeModal.tsx              # 6.7 — Block time modal
│   └── pricing/
│       ├── RateCards.tsx                   # 6.4 — Regular vs Peak cards
│       ├── WeeklyRateVisual.tsx            # 6.4 — 7-day timeline
│       ├── CourtPricingTable.tsx           # 6.5 — Court overrides
│       ├── CourtPricingDialog.tsx          # 6.5 — Override dialog
│       └── RevenueCalculator.tsx           # 6.6 — Revenue banner

packages/api/src/
├── router/
│   ├── schedule.ts                        # Operating hours, peak periods, blocked slots
│   └── pricing.ts                         # Default rates, court overrides, revenue calc
└── utils/
    └── schedule.ts                        # Shared zone calculation logic

packages/db/src/schema/
├── peak-periods.ts                        # New table
└── blocked-slots.ts                       # New table
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 3 (RBAC) — `canConfigureFacility` | 🔲 In progress | Only admin + manager can configure schedule/pricing |
| Flow 4 (Onboarding) — initial operating hours | 🔲 Not started | Facility needs initial hours to edit |
| Flow 5 (Courts) — courts with base pricing | 🔲 Not started | Court pricing table needs courts to exist |
| `facilities.operating_hours` JSONB | ✅ Exists | — |
| `peak_periods` table | 🔲 Needs migration | 6.2, 6.3, zone calculation |
| `blocked_slots` table | 🔲 Needs creation | 6.7 |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Reduce operating hours with existing bookings outside new window | Warning with count. If confirmed, those bookings cancelled with `cancelled_by: 'facility'` |
| Overlapping peak periods (same day, overlapping times) | Warning shown. If times partially overlap, higher markup applies. Full overlap blocked |
| Change peak rate after bookings were made at peak price | Existing bookings keep their original price. Only future bookings use new rate |
| Court has custom pricing, then facility default changes | Court keeps custom pricing. "Por defecto" courts update. Court table shows which are custom vs default |
| Block time on a slot that already has a booking | Warning: "Hay 1 reserva en este horario. Se cancelará al bloquear." Confirm required |
| Block all courts for a full day (tournament) | Select "Todas las canchas" + full operating hours. All bookings for that day cancelled |
| Peak period falls on a day the facility is closed | Allowed in config (future-proofing), but has no effect. Weekly visual shows it grayed out |
| Revenue calculator with 0 peak periods | All revenue is "Regular". Peak breakdown shows S/ 0. No errors |
| Staff navigates to schedule or pricing | Redirect to bookings/calendar (staff can't configure) |

---

## Testing Checklist

### Operating Hours

- [ ]  View current hours pre-filled from facility data
- [ ]  Toggle a day closed → grayed row, time pickers disabled
- [ ]  Change Friday hours to 7:00-23:00 → save → persisted
- [ ]  "Aplicar a todos" copies one day's hours to all open days
- [ ]  Reduce hours with conflicting bookings → warning shown

### Peak Periods

- [ ]  Create "Hora Punta Noche" for Mon-Fri 19:00-22:00 at +25%
- [ ]  Peak card appears with correct info
- [ ]  Edit the period → change to +30% → save → card updates
- [ ]  Delete the period → confirm → removed → weekly visual updates
- [ ]  Try to create overlapping period → warning shown

### Pricing

- [ ]  Rate cards show current regular and peak rates
- [ ]  Change regular rate → markup recalculates → weekly visual updates
- [ ]  Court table shows all courts with default/custom status
- [ ]  Override a court's pricing → "Custom" badge appears
- [ ]  Reset override → reverts to "Por defecto"

### Revenue Calculator

- [ ]  Shows estimated weekly revenue at 70% occupancy
- [ ]  Adjust occupancy slider → numbers recalculate live
- [ ]  Breakdown shows regular/peak/bonus split
- [ ]  Toggle monthly projection → shows ×4.33

### Block Time

- [ ]  Block Cancha 1 tomorrow 10:00-12:00 for maintenance
- [ ]  Blocked slot appears in calendar as red zone
- [ ]  Booking creation shows those hours as unavailable
- [ ]  Block with existing booking → warning → confirm cancels booking
- [ ]  Unblock the slot → hours become available again

### RBAC

- [ ]  Admin can access schedule and pricing pages
- [ ]  Manager can access for their assigned facilities
- [ ]  Staff redirected to bookings

---

## Definition of Done

- [ ]  7-day operating hours editable with proper validation
- [ ]  Peak periods CRUD with visual cards and overlap detection
- [ ]  Pricing page with rate cards, weekly visual, and court override table
- [ ]  Revenue calculator estimates weekly/monthly earnings
- [ ]  Block time slots with conflict warnings and booking cancellation
- [ ]  Zone calculation logic shared across Flows 6, 7, and 8
- [ ]  Price changes don't retroactively affect existing bookings
- [ ]  Only `org_admin` and `facility_manager` can access; `staff` redirected
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows