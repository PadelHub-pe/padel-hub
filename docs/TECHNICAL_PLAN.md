# Technical Plan: Flow 6 — Schedule & Pricing

## 1. Context

### What Already Exists

Flow 6 is **partially implemented**. The database schema, API routers, and basic UI pages all exist and are functional. The gap is between the current MVP and the full spec.

**Database (100% complete):**
- `operating_hours` table (normalized, 1 row per day per facility)
- `peak_periods` table (name, daysOfWeek, startTime, endTime, markupPercent)
- `blocked_slots` table (facilityId, courtId, date, startTime, endTime, reason)
- `courts` table with `priceInCents` and `peakPriceInCents` columns

**API — Schedule Router (90% complete):**
- `getOperatingHours`, `updateOperatingHours` — full CRUD
- `getPeakPeriods`, `createPeakPeriod`, `deletePeakPeriod` — create + delete only
- `getBlockedSlots`, `blockTimeSlot`, `deleteBlockedSlot` — full CRUD
- `getDayOverview` — comprehensive day aggregation
- **Missing:** `updatePeakPeriod` mutation (edit not possible)

**API — Pricing Router (80% complete):**
- `getOverview` — courts, hours, peak periods, computed stats
- `calculateRevenue` — occupancy-based weekly estimate
- **Missing:** `updateDefaultRates` mutation, facility default pricing concept

**UI — Schedule Page (70% complete):**
- Operating hours: view/edit toggle, 7-day grid, save mutation
- Peak periods: list, add dialog, delete (no edit, no confirmation)
- **Missing:** 30-min increments, "Aplicar a todos", validation, edit peak, block time UI

**UI — Pricing Page (75% complete):**
- Rate cards: display-only with median prices
- Weekly schedule: 7-day timeline with zone coloring
- Court table: individual court pricing with edit dialog
- Revenue calculator: occupancy presets + breakdown
- **Missing:** editable default rates, default/custom distinction, peak price editing, monthly toggle

### Patterns to Follow

All files follow established project conventions (see CLAUDE.md):
- tRPC: `protectedProcedure` + `verifyFacilityAccess(ctx, facilityId, permission)` + Spanish error messages
- Forms: React Hook Form + `standardSchemaResolver` + Zod v4 schemas
- Mutations: `useMutation(trpc.*.mutationOptions({ onSuccess: toast + invalidate }))`
- Pages: Server component prefetch → HydrateClient → Suspense → Client view component
- Dialogs: Manual fixed-position overlay (not shadcn Dialog)

### Constraints

- No schema for facility-level default pricing exists yet — needs migration
- Peak pricing is currently **markup-based** (court price × markup%), not fixed rates
- Court pricing dialog only edits `priceInCents`, not `peakPriceInCents`
- All UI copy must be in Spanish

---

## 2. Architecture Decisions

### Decision 1: Facility Default Pricing (Schema Migration)

**Problem:** The spec requires facility-level default regular/peak rates that cascade to courts. Currently, each court has individual pricing and the pricing page shows medians.

**Decision:** Add `defaultPriceInCents` and `defaultPeakPriceInCents` columns to `facilities` table.

**Approach:**
- Columns are nullable integers (cents)
- Courts with `priceInCents IS NOT NULL` are "custom" — courts with `priceInCents IS NULL` use facility default
- `getRateForSlot()` falls back: `court.priceInCents ?? facility.defaultPriceInCents`
- Rate cards on pricing page edit these facility defaults
- "Restablecer" on a court nulls its price fields

**Migration strategy:** For existing facilities, set `defaultPriceInCents` to median of court prices. Leave existing court prices as-is (they remain "custom").

### Decision 2: Peak Period Edit

**Problem:** Peak periods can be created and deleted but not edited.

**Decision:** Add `schedule.updatePeakPeriod` mutation. Reuse the create dialog in edit mode (pre-fill form, change submit handler).

### Decision 3: Shared Zone Calculation

**Problem:** Zone calculation logic (closed/regular/peak/blocked) is needed by Flows 6, 7, and 8 but doesn't exist as a shared utility.

**Decision:** Create `packages/api/src/utils/schedule.ts` with `getTimeZone()` and `getRateForSlot()`. This is pure logic with no DB dependencies, easily testable.

### Decision 4: Block Time UI

**Problem:** Backend for blocked slots exists but no UI on the schedule page.

**Decision:** Add a "Bloquear Horario" button to the schedule page header + modal + blocked slots list below the existing cards. Keep it in the same 2-column layout.

---

## 3. Risk Assessment

### Blast Radius
- **Schema migration**: Adding nullable columns to `facilities` — no existing data affected, backward compatible
- **Court pricing null semantics**: Existing courts all have explicit `priceInCents` (set during setup), so the default/custom distinction won't retroactively change pricing until a court is explicitly "reset"
- **Peak period edit**: New mutation, no existing functionality changes
- **Zone calculation utility**: Pure function extraction, no side effects

### Migration Complexity
- **Low**: 2 nullable integer columns on `facilities`. `pnpm db:push` handles it
- No data backfill required (defaults can be populated on first save or lazily computed)

### External Dependencies
- None. All changes are within the existing stack (tRPC + Drizzle + React)

### Performance
- Revenue calculator makes a new query per occupancy change — already implemented with the correct caching pattern (prefetch default 70%, dynamic query for other values)
- Zone calculation utility is O(periods × hours) per call — negligible for 5 periods × 168 weekly hours

---

## 4. Task Breakdown

### Phase 0: Infrastructure

#### TASK-6.01: Shared zone calculation utility
**Type:** feature | **Priority:** P0 | **Estimate:** ~2h | **Depends on:** nothing

Create `packages/api/src/utils/schedule.ts`:
- `getTimeZone(time, dayOfWeek, date, config)` → `'closed' | 'regular' | 'peak' | 'blocked'`
- `getRateForSlot(court, zone, facilityDefaults)` → cents
- Write comprehensive tests in `packages/api/src/__tests__/schedule-utils.test.ts`
- Test edge cases: overlapping peak periods (highest markup wins), blocked overrides peak, boundary times

**Files:**
- `packages/api/src/utils/schedule.ts` (new)
- `packages/api/src/__tests__/schedule-utils.test.ts` (new)

#### TASK-6.02: Schema migration — facility default pricing
**Type:** config | **Priority:** P0 | **Estimate:** ~1h | **Depends on:** nothing

- Add `defaultPriceInCents` (integer, nullable) to facilities
- Add `defaultPeakPriceInCents` (integer, nullable) to facilities
- Update schema exports
- Run `pnpm db:push`

**Files:**
- `packages/db/src/schema.ts`

---

### Phase 1: Schedule Page Enhancements (Sub-flows 6.1, 6.2, 6.3)

#### TASK-6.03: Enhance operating hours editor
**Type:** feature | **Priority:** P0 | **Estimate:** ~3h | **Depends on:** nothing

Enhance `OperatingHoursSection` on the schedule page:
- [ ] 30-minute time increments (replace hourly `timeOptions` array)
- [ ] "Aplicar a todos" button — copies selected day's hours to all open days
- [ ] Dirty state tracking — save button disabled until form is dirty
- [ ] Close > open time validation (client-side, show FormMessage)
- [ ] At least 1 day must remain open validation
- [ ] Grayed row when day is closed (disabled time pickers)

**Files:**
- `.../schedule/_components/operating-hours-section.tsx`

#### TASK-6.04: Add `schedule.updatePeakPeriod` mutation
**Type:** feature | **Priority:** P0 | **Estimate:** ~1.5h | **Depends on:** nothing

- New mutation with same validation as `createPeakPeriod`
- Input: `periodId + partial fields (name, daysOfWeek, startTime, endTime, markupPercent)`
- Verify period belongs to facility
- Validate times within operating hours
- Write tests

**Files:**
- `packages/api/src/router/schedule.ts`
- `packages/api/src/__tests__/schedule.test.ts` (new or extend)

#### TASK-6.05: Enhance peak period CRUD (edit, validation, UX)
**Type:** feature | **Priority:** P0 | **Estimate:** ~4h | **Depends on:** TASK-6.04

- [ ] Convert `AddPeakPeriodDialog` to dual-mode (create/edit) — accept optional `editingPeriod` prop
- [ ] Add edit button to `PeakPeriodCard`
- [ ] Add delete confirmation dialog (toast is not enough per spec)
- [ ] Quick day select shortcuts: "Lun-Vie" / "Sáb-Dom" / "Todos" buttons
- [ ] Overlap detection: warn if times overlap with existing period on same days
- [ ] Max 5 periods limit: disable "Agregar" button + tooltip when at limit
- [ ] Markup S/ preview: show computed price based on median court rate
- [ ] Apply changes to BOTH schedule page and pricing page peak period components

**Files:**
- `.../schedule/_components/add-peak-period-dialog.tsx` (rename to `peak-period-dialog.tsx`)
- `.../schedule/_components/peak-period-card.tsx`
- `.../schedule/_components/peak-periods-section.tsx`
- `.../pricing/_components/peak-periods-section.tsx`

---

### Phase 2: Pricing Page Enhancements (Sub-flows 6.4, 6.5)

#### TASK-6.06: Editable rate cards with facility default pricing
**Type:** feature | **Priority:** P0 | **Estimate:** ~3h | **Depends on:** TASK-6.02

- [ ] Add `pricing.updateDefaultRates` mutation (facilityId, regularRateCents, peakRateCents)
- [ ] Validate: peak >= regular, both > 0
- [ ] Fix `pricing.getOverview` to use facility defaults instead of median
- [ ] Make rate card price inputs editable (inline number input + save button)
- [ ] Markup auto-calculated: `((peak - regular) / regular) * 100`
- [ ] Toast on save: "Tarifas actualizadas"
- [ ] Use `pricing:write` permission (currently uses `schedule:read`)

**Files:**
- `packages/api/src/router/pricing.ts`
- `.../pricing/_components/rate-cards.tsx`
- `.../pricing/_components/pricing-view.tsx`

#### TASK-6.07: Court pricing — default/custom system
**Type:** feature | **Priority:** P0 | **Estimate:** ~3h | **Depends on:** TASK-6.06

- [ ] Update court pricing table: show "Por defecto (S/ X)" when court price is null, custom price when set
- [ ] "Custom" blue badge vs "Default" gray badge in status column
- [ ] Edit dialog with BOTH regular and peak price fields (currently only regular)
- [ ] "Restablecer a valores por defecto" link — sets court prices to null
- [ ] Add `pricing.updateCourtPricing` mutation (courtId, hourlyRateCents?, peakRateCents?) — or extend court.update
- [ ] Changing facility defaults updates "Por defecto" values in table immediately (query invalidation)

**Files:**
- `.../pricing/_components/court-pricing-table.tsx`
- `.../pricing/_components/edit-court-pricing-dialog.tsx`
- `packages/api/src/router/pricing.ts` (or `court.ts`)

---

### Phase 3: P1 Features (Sub-flows 6.6, 6.7)

#### TASK-6.08: Revenue calculator enhancements
**Type:** feature | **Priority:** P1 | **Estimate:** ~2h | **Depends on:** TASK-6.02

- [ ] Add slider input alongside preset buttons (HTML range input or custom)
- [ ] Monthly projection toggle: "Ver proyección mensual" → weekly × 4.33
- [ ] Update calculation to use facility defaults for courts without custom pricing
- [ ] Ensure live recalculation on rate/period changes

**Files:**
- `.../pricing/_components/revenue-calculator.tsx`
- `packages/api/src/router/pricing.ts` (update `calculateRevenue` to use facility defaults)

#### TASK-6.09: Block time slots UI
**Type:** feature | **Priority:** P1 | **Estimate:** ~5h | **Depends on:** nothing

- [ ] "Bloquear Horario" button in schedule page header
- [ ] Block time modal: court multi-select (all courts option), date picker, time range, reason dropdown, notes
- [ ] Conflict check: query existing bookings in the time range, show warning with count
- [ ] Blocked slots list below the schedule cards
- [ ] Delete/unblock button with confirmation
- [ ] Toast: "Horario bloqueado" / "Bloqueo eliminado"
- [ ] Validate time within operating hours for selected date

**Files:**
- `.../schedule/_components/schedule-header.tsx`
- `.../schedule/_components/schedule-view.tsx`
- `.../schedule/_components/block-time-dialog.tsx` (new)
- `.../schedule/_components/blocked-slots-section.tsx` (new)

---

## Dependency Graph

```
TASK-6.01 (zone util)        ← standalone
TASK-6.02 (schema)           ← standalone
TASK-6.03 (hours editor)     ← standalone
TASK-6.04 (update mutation)  ← standalone
TASK-6.05 (peak CRUD UX)     ← depends on TASK-6.04
TASK-6.06 (rate cards)       ← depends on TASK-6.02
TASK-6.07 (court pricing)    ← depends on TASK-6.06
TASK-6.08 (revenue calc)     ← depends on TASK-6.02
TASK-6.09 (block time UI)    ← standalone
```

**Parallelizable groups:**
- Group A: TASK-6.01, TASK-6.02, TASK-6.03, TASK-6.04, TASK-6.09 (all independent)
- Group B: TASK-6.05 (after 6.04)
- Group C: TASK-6.06 → TASK-6.07 → TASK-6.08 (sequential, after 6.02)

## Estimated Total: ~24.5 hours
