# Flow 7: Booking Management — Technical Plan

## 1. Context

### What Exists Today

Flow 7 has **extensive existing implementation** (~85% complete):

**Database (100%):** All tables exist — `bookings`, `booking_players`, `booking_activity` with proper enums, relations, and constraints. Seed data includes 17+ bookings.

**API Router (85%):** `packages/api/src/router/booking.ts` — 924 lines, 12 procedures:
- `list`, `getById`, `confirm`, `cancel`, `updateStatus`, `createManual`
- `getStats`, `addPlayer`, `removePlayer`, `getActivity`, `searchUsers`, `getSlotInfo`

**UI Components (95%):** 34+ files covering bookings list, filters, pagination, create dialog, detail drawer, detail page, calendar views, player management, court visualization, activity timeline.

**Supporting Infrastructure:** Activity logging utility, calendar router (day/week views), access control integration.

### Critical Gaps

| Gap | Severity | Location |
|-----|----------|----------|
| **On-access status transitions** (7.9) | CRITICAL | Not implemented anywhere |
| **Server-side price calculation** (7.3) | CRITICAL | `createManual` accepts client-sent price instead of computing via `getRateForSlot()` |
| **List filter limitations** (7.1) | MEDIUM | Status filter is single-value not multi-select; no date range; no sorting |
| **Cancel `cancelled_by` value** (7.8) | LOW | Hardcodes `"owner"` instead of `"facility"` |
| **Zero test coverage** | CRITICAL | No `booking.test.ts` exists |

### Patterns to Follow

- **Testing:** Vitest with `describe`/`it`/`expect`, factory helpers, mock tRPC callers (see `schedule.test.ts`, `pricing.test.ts`)
- **Router:** `verifyFacilityAccess(ctx, facilityId, permission)` for RBAC
- **Pricing:** `getRateForSlot(court, zone, facilityDefaults)` from `packages/api/src/utils/schedule.ts`
- **UI:** TanStack Table + DataTable component, react-hook-form + Zod, Sheet for drawers, Dialog for modals

---

## 2. Architecture Decisions

### 2.1 On-Access Status Resolver

**Decision:** Create `resolveBookingStatus()` as a pure utility function in `packages/api/src/utils/booking-status.ts`.

Apply it in `booking.list` and `booking.getById` — when a booking's resolved status differs from its stored status, update the DB inline and log the transition in `booking_activity`.

```
resolveBookingStatus(booking, now):
  if status === 'confirmed' && now >= startDateTime → 'in_progress'
  if status === 'in_progress' && now >= endDateTime → 'completed'
  else → unchanged
```

**Why not cron:** Spec explicitly says "on-access check" for MVP. Simpler, no infrastructure.

### 2.2 Server-Side Price Calculation

**Decision:** In `booking.createManual`, compute price server-side using `getRateForSlot()`. Remove `priceInCents` and `isPeakRate` from the input schema. The server will:
1. Load operating hours, peak periods, blocked slots for the facility+date
2. Build `ScheduleConfig`
3. Call `getTimeZoneWithMarkup()` for each 30-min slot in the booking
4. Calculate total price using `getRateForSlot()` with fallback chain
5. Determine `isPeakRate` from zone detection

**Client change:** Remove price input from create dialog. Show server-calculated price in a `getSlotInfo` preview call instead.

### 2.3 List API Enhancements

**Decision:** Extend `booking.list` schema:
- `status` → `status: z.array(z.enum(...)).optional()` (multi-select)
- Add `dateRange: z.object({ start: z.date(), end: z.date() }).optional()`
- Add `sortBy` + `sortOrder` params
- Keep backward compatibility in WHERE clause construction

### 2.4 Cancel `cancelled_by` Fix

**Decision:** Change from hardcoded `"owner"` to `"facility"` in `booking.cancel`. The `cancelledByEnum` in schema has values `user | owner | system` — we may need to add `"facility"` to the enum, or reuse `"owner"` since this is facility-owner cancelling. Check if the enum needs updating.

---

## 3. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Status resolver updates DB on read — could slow list queries | Medium | Batch-update in `booking.list`, only for bookings that need transition |
| Price calculation change breaks existing create flow | Medium | Update UI create dialog simultaneously. Existing bookings keep their prices |
| Multi-status filter changes API contract | Low | Current filter was optional — making it array is backward-compatible if UI is updated |
| Calendar router uses legacy `timeSlotTemplates` | Low | Calendar router is separate; booking router uses current `peakPeriods` |

---

## 4. Task Breakdown

See `docs/TASKS.md` — Flow 7 section.
