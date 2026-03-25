# Technical Plan: Public Booking Page

## 1. Context

### Problem

Court owners currently handle bookings via WhatsApp — manual, error-prone, and no real-time availability visibility for players. PadelHub has a full booking engine (schedule, pricing, conflict detection, calendar) but no player-facing interface.

### Solution

A lightweight public booking page at `bookings.padelhub.pe/[facility-slug]` that facility staff share with players. Players see real-time availability and book directly — no account required.

### Why Now

The mobile app isn't production-ready. This booking page:
- Delivers immediate value to court owners (no more "hay cancha?" messages)
- Validates player demand before investing in the full app
- Builds a verified phone number database (warm leads for app launch)
- Reuses 100% of existing backend logic (schedule, pricing, conflict detection)

### What Exists Today

| Component | Status | Reusable? |
|-----------|--------|-----------|
| Operating hours per facility | Built | Yes |
| Peak periods with markup pricing | Built | Yes |
| Blocked slots (facility-wide + court-specific) | Built | Yes |
| Booking conflict detection | Built | Yes |
| Server-side price calculation | Built | Yes |
| `booking.getSlotInfo(facilityId, date)` | Built | Needs public variant |
| `booking.calculatePrice(facilityId, courtId, date, start, end)` | Built | Needs public variant |
| `booking.createManual(...)` | Built | Needs public variant |
| Booking status auto-resolution | Built | Yes |
| `publicProcedure` (unauthenticated tRPC) | Built | Yes |

### What's Missing

1. **Slot generation logic** — No function produces a list of available time windows from raw schedule data
2. **Public API procedures** — All booking procedures require `protectedProcedure`
3. **New Next.js app** (`apps/bookings`) — Player-facing, mobile-first UI
4. **WhatsApp OTP verification** — Kapso SDK integration for phone verification
5. **Facility-level slot duration config** — Players need constrained booking durations (60/90/120 min)
6. **Guest booking flow** — Name + phone, no account required

---

## 2. Architecture Decisions

### 2.1 Separate App (`apps/bookings`)

A new Next.js app deployed to `bookings.padelhub.pe`, not routes inside the existing dashboard.

**Rationale:**
- Different auth model (guest/OTP vs session-based)
- Different UI paradigm (mobile-first player experience vs desktop dashboard)
- Independent deployment cycle
- Shares `@wifo/api`, `@wifo/db`, `@wifo/ui`, `@wifo/validators` via workspace

**Port:** 3002 (dev)

### 2.2 URL Structure

```
bookings.padelhub.pe/[facilitySlug]              → Facility landing + date picker
bookings.padelhub.pe/[facilitySlug]/book          → Court & time selection
bookings.padelhub.pe/[facilitySlug]/confirm        → Contact info + OTP verification
bookings.padelhub.pe/[facilitySlug]/success        → Confirmation screen
bookings.padelhub.pe/[facilitySlug]/mis-reservas   → Guest booking history (by verified phone)
```

**Facility slug must be globally unique.** The existing `facilities.slug` column already exists. Add a unique constraint if not present.

### 2.3 Authentication: Guest-First with WhatsApp OTP

```
View availability  →  No auth (fully public)
Make a booking     →  Name + Phone + WhatsApp OTP (once per device)
View my bookings   →  Same verified phone cookie
```

**OTP flow:**
1. Player enters phone number
2. Backend generates 6-digit code, stores in Redis (TTL: 10 min)
3. Kapso SDK sends AUTHENTICATION template (COPY_CODE) via WhatsApp
4. Player enters code → backend validates → sets signed cookie (30-day TTL)
5. Subsequent bookings from same device skip OTP

**No user account created.** Bookings use existing `customerName`, `customerPhone`, `customerEmail` fields. When the mobile app launches, guest bookings are linked by phone number.

### 2.4 Abuse Prevention (3 layers)

| Layer | Mechanism | Friction |
|-------|-----------|----------|
| 1 | Cloudflare Turnstile (invisible CAPTCHA) | Zero |
| 2 | Rate limits via Upstash Redis (3 active bookings/phone, 5 attempts/IP/hour) | Zero |
| 3 | Kapso WhatsApp OTP (once per device, 30-day cookie) | One-time |

### 2.5 Slot Generation

Slots are computed on-the-fly (not stored). New pure function:

```typescript
function getAvailableSlots(config: {
  date: Date;
  courts: Court[];
  operatingHours: OperatingHour;
  peakPeriods: PeakPeriod[];
  blockedSlots: BlockedSlot[];
  existingBookings: Booking[];
  allowedDurations: number[];       // e.g., [60, 90]
  facilityDefaults: FacilityPricing;
}): AvailableSlot[]

// Returns:
interface AvailableSlot {
  courtId: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  startTime: string;          // "HH:MM"
  endTime: string;            // "HH:MM"
  durationMinutes: number;
  priceInCents: number;
  isPeakRate: boolean;
  zone: "regular" | "peak";
}
```

This function composes existing utilities: `getTimeZoneWithMarkup()`, `getRateForSlot()`, and the overlap check logic from `booking.createManual`.

### 2.6 Schema Changes

**`facilities` table — 1 new column:**

```sql
ALTER TABLE facilities ADD COLUMN allowed_duration_minutes jsonb DEFAULT '[60, 90]';
```

Stores an array of allowed booking durations in minutes (e.g., `[60, 90, 120]`). Defaults to `[60, 90]` which covers most padel facilities in Lima.

**`facilities` table — unique constraint on slug:**

```sql
ALTER TABLE facilities ADD CONSTRAINT facilities_slug_unique UNIQUE (slug);
```

Required for `bookings.padelhub.pe/[facilitySlug]` routing.

### 2.7 New Package: `@wifo/whatsapp`

```
packages/whatsapp/
├── src/
│   ├── client.ts          ← Kapso WhatsAppClient init
│   ├── otp.ts             ← sendOtp() + verifyOtp()
│   ├── notifications.ts   ← sendBookingConfirmation(), sendBookingReminder()
│   └── index.ts           ← Public exports
├── env.ts                 ← KAPSO_API_KEY, WHATSAPP_PHONE_NUMBER_ID
├── package.json
└── tsconfig.json
```

**Kapso SDK setup:**

```typescript
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

export const whatsapp = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: process.env.KAPSO_API_KEY!,
});
```

**OTP implementation:**

```typescript
// sendOtp(phone: string): Promise<string> — returns code for Redis storage
// Uses AUTHENTICATION template with COPY_CODE button
await whatsapp.messages.sendTemplate({
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  to: phone,
  template: buildTemplateSendPayload({
    name: "booking_verification",  // Pre-approved AUTHENTICATION template
    language: "es",
    body: [{ type: "text", text: otpCode }],
    buttons: [{ type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: otpCode }] }],
  }),
});
```

### 2.8 New tRPC Router: `publicBooking`

All procedures use `publicProcedure` (no auth). Located in `packages/api/src/router/public-booking.ts`.

| Procedure | Input | Returns |
|-----------|-------|---------|
| `getFacility` | `{ slug }` | Facility name, photos, amenities, courts summary, district |
| `getAvailableSlots` | `{ slug, date }` | Available slots per court with pricing |
| `calculatePrice` | `{ facilityId, courtId, date, startTime, endTime }` | Price breakdown |
| `sendOtp` | `{ phone }` | `{ success, expiresIn }` (rate-limited) |
| `verifyOtp` | `{ phone, code }` | `{ verified, token }` (signed cookie) |
| `createBooking` | `{ facilityId, courtId, date, startTime, endTime, customerName, customerPhone, verificationToken }` | Booking confirmation with code |
| `getMyBookings` | `{ phone, verificationToken }` | List of bookings for verified phone |
| `cancelBooking` | `{ bookingId, phone, verificationToken }` | Cancellation confirmation |

### 2.9 OG Meta Tags (WhatsApp Previews)

Dynamic per facility using Next.js `generateMetadata`:

```typescript
export async function generateMetadata({ params }) {
  const facility = await getFacilityBySlug(params.facilitySlug);
  return {
    title: `Reserva en ${facility.name} | PadelHub`,
    description: `Reserva tu cancha de pádel online en ${facility.name}, ${facility.district}`,
    openGraph: {
      images: [facility.photos[0] ?? "/og-default.png"],
    },
  };
}
```

When pasted in WhatsApp, shows: facility name, district, and photo.

---

## 3. Risk Assessment

### Blast Radius

| Risk | Impact | Mitigation |
|------|--------|------------|
| Facility slug collision | Booking page loads wrong facility | Add UNIQUE constraint on `facilities.slug` |
| Spam bookings | Blocks real players from booking | 3-layer abuse prevention (Turnstile + rate limits + OTP) |
| Dashboard sync | Manual + online bookings conflict | Both use same `bookings` table + conflict detection |
| WhatsApp API downtime | Players can't verify phone | Fallback: allow unverified bookings with auto-cancel after 15min if not confirmed |
| Stale slot data | Player sees available, but slot taken when confirming | Re-check conflicts at booking creation time (already built) + show "slot taken" error |

### External Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Kapso (WhatsApp API) | OTP delivery | SMS via Twilio or email OTP |
| Cloudflare Turnstile | Bot protection | Rate limiting only |
| Upstash Redis | OTP storage + rate limits | In-memory store (existing fallback) |

### What This Does NOT Change

- Existing dashboard bookings flow (untouched)
- Existing tRPC routers (untouched — new router added alongside)
- Database schema for bookings (reuses existing columns)
- Auth system (booking page doesn't use Better Auth)

---

## 4. Task Breakdown

### Phase 0: Schema & Infrastructure (3 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-PB.01 | Add `allowedDurationMinutes` column to facilities table + unique constraint on `slug`. Update Drizzle schema, push migration. | config | — |
| TASK-PB.02 | Create `packages/whatsapp` package: Kapso SDK client, OTP send/verify, env validation. Follow `@wifo/email` and `@wifo/images` patterns. | feature | — |
| TASK-PB.03 | Add "Duraciones permitidas" setting to facility settings page in the existing dashboard (multi-select: 60, 90, 120 min). | feature | TASK-PB.01 |

### Phase 1: Public API (4 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-PB.04 | Write `getAvailableSlots()` pure function in `packages/api/src/utils/slots.ts`. Composes existing schedule utils. Write tests. | feature | TASK-PB.01 |
| TASK-PB.05 | Create `publicBooking` tRPC router: `getFacility`, `getAvailableSlots`, `calculatePrice` procedures. Write tests. | feature | TASK-PB.04 |
| TASK-PB.06 | Add OTP procedures to `publicBooking` router: `sendOtp`, `verifyOtp`. Integrate `@wifo/whatsapp`. Rate-limit with Upstash. Write tests. | feature | TASK-PB.02, TASK-PB.05 |
| TASK-PB.07 | Add booking mutation procedures: `createBooking`, `getMyBookings`, `cancelBooking`. Reuse existing conflict detection + price calculation. Write tests. | feature | TASK-PB.06 |

### Phase 2: Booking App Shell (3 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-PB.08 | Scaffold `apps/bookings` Next.js app: package.json, tsconfig, env, tRPC setup, Tailwind, Turnstile. Follow `apps/admin` patterns. Add `dev:bookings` script. | config | TASK-PB.05 |
| TASK-PB.09 | Build facility landing page (`/[facilitySlug]`): facility info, photos, date picker, CTA. Dynamic OG meta tags. Mobile-first layout. | feature | TASK-PB.08 |
| TASK-PB.10 | Build booking flow pages: `/[facilitySlug]/book` (court & time grid), `/[facilitySlug]/confirm` (contact + OTP), `/[facilitySlug]/success` (confirmation). | feature | TASK-PB.07, TASK-PB.09 |

### Phase 3: Player Features (2 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-PB.11 | Build "Mis Reservas" page (`/[facilitySlug]/mis-reservas`): booking history for verified phone, cancel functionality. | feature | TASK-PB.10 |
| TASK-PB.12 | Add WhatsApp booking confirmation message via Kapso: send confirmation after successful booking with booking details. | feature | TASK-PB.02, TASK-PB.10 |

### Phase 4: Dashboard Integration (2 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-PB.13 | Add "Enlace de reservas" section to facility settings in dashboard: show shareable URL, QR code generator, copy button. | feature | TASK-PB.08 |
| TASK-PB.14 | Differentiate online vs manual bookings in dashboard booking list: add "Online" badge, filter by source. | feature | TASK-PB.10 |

### Dependency Graph

```
TASK-PB.01 ──┬── TASK-PB.03
             ├── TASK-PB.04 ── TASK-PB.05 ──┬── TASK-PB.06 ── TASK-PB.07 ──┐
             │                               │                               │
TASK-PB.02 ──┼───────────────────────────────┘                               │
             │                                                                │
             └── TASK-PB.08 ── TASK-PB.09 ── TASK-PB.10 ──┬── TASK-PB.11   │
                                              ▲             ├── TASK-PB.12   │
                                              └─────────────┘                │
                                                            ├── TASK-PB.13   │
                                                            └── TASK-PB.14 ──┘
```

### Parallelization

- **TASK-PB.01, PB.02** can run in parallel (schema vs whatsapp package)
- **TASK-PB.03, PB.04** can run in parallel after PB.01
- **TASK-PB.08** can start after PB.05 (doesn't need OTP to scaffold the app)
- **TASK-PB.11, PB.12, PB.13, PB.14** can all run in parallel after PB.10

### Estimated Scope

- **14 tasks** across 4 phases
- **~3 new files** in `packages/api` (slots util, public-booking router, tests)
- **~1 new package** (`packages/whatsapp`)
- **~1 new app** (`apps/bookings`, ~15-20 files)
- **~2 schema changes** (1 column + 1 constraint)
- **~2 small changes** to existing dashboard (duration setting + booking link)

---

## 5. Out of Scope (Future)

- Player accounts / login (mobile app)
- Payment processing (Yape/Plin integration)
- Facility discovery / search
- Open match / join system
- Push notifications
- Booking reminders (WhatsApp — easy to add post-launch via Kapso)
- Multi-language support
- Recurring bookings
