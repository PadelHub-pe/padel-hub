# 🏠 Flow 4: Facility Onboarding — Engineering Task

Guide new facilities through a structured setup process so they can go live on the player app. This is the **first experience** after an org admin creates a facility — the wizard turns an empty shell into a bookable, discoverable venue.

---

## Context & Scope

**What Flow 4 owns:** Quick facility creation, the multi-step setup wizard, setup progress tracking, the incomplete setup banner, and the activation gate.

**What Flow 4 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 2 (Org) | "Agregar Local" button that triggers creation | The entry point lives in the facilities overview |
| Flow 5 (Courts) | Detailed court editing, court deletion, status toggles | The wizard creates courts; Flow 5 manages them after setup |
| Flow 6 (Schedule & Pricing) | Fine-grained schedule editing, peak period management | The wizard sets initial hours/pricing; Flow 6 handles ongoing changes |
| 🖼️ Image System | Upload component, Cloudflare Images delivery | The wizard uses the shared `ImageUpload` component |

**The onboarding journey:**

```
Org Admin clicks "Agregar Local" (Flow 2)
  → 4.1: Quick create (name, address, phone)
  → Facility created (is_active: false, not visible to players)
  → Redirected to setup wizard
  → 4.2: Add courts (at least 1)
  → 4.3: Set operating hours + pricing
  → 4.4: Upload facility photos (encouraged, not required)
  → 4.5: Complete setup → facility activated (is_active: true)
  → Lands on facility dashboard
```

---

## Prerequisites

- Flow 1 (Auth) — user is logged in with `org_admin` role
- Flow 2 (Org) — org exists, facilities overview page works
- Flow 3 (RBAC) — only `org_admin` can create facilities
- 🖼️ Image System — `ImageUpload` component and Cloudflare Images configured (for step 3)
- `facilities`, `courts`, `time_slots` tables ✅

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 4.1 | Quick create facility | `/org/[slug]/facilities/new` | P0 |
| 4.2 | Setup wizard — Step 1: Add Courts | `/org/[slug]/f/[facilitySlug]/setup` | P0 |
| 4.3 | Setup wizard — Step 2: Operating Hours + Pricing | `/org/[slug]/f/[facilitySlug]/setup` | P0 |
| 4.4 | Setup wizard — Step 3: Facility Photos | `/org/[slug]/f/[facilitySlug]/setup` | P1 |
| 4.5 | Complete setup → activate facility | Setup completion screen | P0 |
| 4.6 | Setup progress tracking | API + wizard stepper | P0 |
| 4.7 | Incomplete setup banner on facility dashboard | Facility dashboard (conditional) | P0 |
| 4.8 | Resume setup from where you left off | Setup wizard navigation | P1 |

---

## Sub-flow Specifications

---

### 4.1 Quick Create Facility

**Route:** `/org/[slug]/facilities/new`

**Priority:** P0

**Access:** `org_admin` only

#### Behavior

Minimal form to create a facility shell. Collects only what's absolutely required to create the DB record. Everything else comes in the setup wizard.

#### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Nombre del Local | Text | Yes | 3-200 chars |
| Dirección | Text | Yes | Non-empty |
| Distrito | Select / Autocomplete | Yes | Lima districts list |
| Teléfono | Tel | Yes | Peruvian phone format |
| Email | Email | No | Valid format |

#### District Selector

Lima has well-known districts (Surco, Miraflores, San Isidro, La Molina, etc.). Use a searchable select/autocomplete with the common Lima districts pre-populated. Allow free text for districts not in the list.

#### Slug Generation

Auto-generate `slug` from facility name: "Trigal Padel" → `trigal-padel`. Show preview below name field. Check uniqueness against existing slugs in the org.

#### Geocoding

Auto-geocode the address + district to get `latitude`/`longitude`. Use Google Maps Geocoding API (or a free alternative like Nominatim for MVP). Show a small map preview confirming the location. Allow manual pin adjustment if geocoding is inaccurate.

#### On Submit

1. Create `facilities` row with `is_active: false` and `setup_status: 'pending'`
2. Set `operating_hours` to a sensible default (Mon-Sun 7:00-22:00) — they'll customize in the wizard
3. Redirect to `/org/[slug]/f/[facilitySlug]/setup` (the setup wizard)

#### Acceptance Criteria

- [ ]  Form renders with all required fields
- [ ]  District selector with Lima districts (Surco, Miraflores, San Isidro, La Molina, San Borja, Barranco, Chorrillos, Jesús María, Lince, Pueblo Libre, Magdalena, San Miguel, Breña, etc.)
- [ ]  Slug auto-generated from name, shown as preview
- [ ]  Slug uniqueness validated against org's existing facilities
- [ ]  Geocoding runs on address + district blur/submit
- [ ]  Map preview shows pin for geocoded location
- [ ]  Submit → facility created with `is_active: false`
- [ ]  Redirect to setup wizard after creation
- [ ]  Loading state on submit button
- [ ]  Only `org_admin` can access this page (RBAC from Flow 3)
- [ ]  Back button returns to facilities overview

#### API

```tsx
facility.create.mutate({
  orgSlug: string,
  name: string,
  address: string,
  district: string,
  phone: string,
  email?: string,
  latitude: number,
  longitude: number,
})
// Auto-generates: slug (from name, unique within org)
// Sets: is_active = false, operating_hours = default 7-22
// Returns: { facility: { id, slug }, redirectTo: '/org/.../f/.../setup' }
```

---

### 4.2 Setup Wizard — Step 1: Add Courts

**Route:** `/org/[slug]/f/[facilitySlug]/setup` (step 1)

**Priority:** P0

#### Behavior

The facility needs at least 1 court before it can go live. This step lets the admin add courts with essential info. They can add more or edit courts later in Flow 5.

#### Wizard Stepper UI

Horizontal stepper at top of page:

```
[1. Canchas] ——— [2. Horarios y Precios] ——— [3. Fotos]
   ● active          ○ pending                  ○ pending
```

#### Court Form (Repeatable — Add Multiple)

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Nombre de la Cancha | Text | Yes | 1-100 chars (e.g., "Cancha 1", "Cancha Central") |
| Tipo | Select | Yes | "Indoor" / "Outdoor" |
| Superficie | Select | No | "Césped artificial" / "Concreto" / "Otro" |
| Iluminación | Toggle | No | Default: true |
| Precio por hora (S/) | Number | Yes | Min 1, stored as cents internally |
| Precio hora punta (S/) | Number | No | Must be ≥ base price if set |

#### Court Cards Layout

As courts are added, they appear as cards in a grid above the form:

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Cancha 1   │  │ Cancha 2   │  │ + Agregar  │
│ Indoor     │  │ Outdoor    │  │   Cancha   │
│ S/80/hr    │  │ S/60/hr    │  │            │
│ ✎  🗑      │  │ ✎  🗑      │  │            │
└────────────┘  └────────────┘  └────────────┘
```

#### Acceptance Criteria

- [ ]  Stepper shows Step 1 as active
- [ ]  Can add courts one by one via form
- [ ]  Each added court appears as a card in the grid
- [ ]  Can edit a court card (opens form pre-filled)
- [ ]  Can delete a court card (with confirmation if it's the last one)
- [ ]  Maximum 10 courts per facility (from `imageConfig.limits.maxCourtPhotos` equivalent)
- [ ]  "Siguiente" (Next) button disabled until at least 1 court exists
- [ ]  Court data saved to DB on each add (not batched — so progress survives page close)
- [ ]  Price input in Soles, stored as cents in DB (`hourly_rate_cents`)
- [ ]  Peak price optional — if not set, peak pricing section in Flow 6 uses base rate
- [ ]  "Agregar Cancha" card as the last item in grid (if under 10 courts)
- [ ]  Can go back to previous page (facilities overview) — facility exists but setup incomplete

#### API

```tsx
court.create.mutate({
  facilityId: string,
  name: string,
  type: 'indoor' | 'outdoor',
  surface?: string,
  hasLighting?: boolean,
  hourlyRateCents: number,
  peakRateCents?: number,
})

court.update.mutate({ courtId: string, ...fields })
court.delete.mutate({ courtId: string })

// Validation: max 10 courts per facility
```

---

### 4.3 Setup Wizard — Step 2: Operating Hours + Pricing

**Route:** `/org/[slug]/f/[facilitySlug]/setup` (step 2)

**Priority:** P0

#### Behavior

Set the facility's weekly operating hours and optionally define peak periods. This is a simplified version of Flow 6 — just enough to get started. They can fine-tune later.

#### Operating Hours

7-day grid showing open/close times for each day:

```
Lunes      [07:00] — [22:00]  ✅ Abierto
Martes     [07:00] — [22:00]  ✅ Abierto
Miércoles  [07:00] — [22:00]  ✅ Abierto
Jueves     [07:00] — [22:00]  ✅ Abierto
Viernes    [07:00] — [23:00]  ✅ Abierto
Sábado     [08:00] — [23:00]  ✅ Abierto
Domingo    [08:00] — [20:00]  ✅ Abierto
```

- Pre-filled with defaults from facility creation (7:00-22:00)
- Each day has an open/closed toggle
- Time selects in 30-minute increments
- "Aplicar a todos" button to copy one day's hours to all days

#### Peak Periods (Optional)

Simplified peak period setup:

```
┌────────────────────────────────────────┐
│  ¿Tienes horarios de hora punta?            │
│  [Sí, configurar]  [No, saltar]            │
└────────────────────────────────────────┘
```

If yes, show a simple form:

- Days: multi-select checkboxes (Lun-Dom)
- Start time — End time
- Uses the `peak_rate_cents` defined per court in Step 1
- Can add multiple peak periods

#### Acceptance Criteria

- [ ]  Stepper shows Step 2 as active, Step 1 as completed (✅)
- [ ]  7-day operating hours grid pre-filled with defaults
- [ ]  Can toggle each day open/closed
- [ ]  Time selects in 30-minute increments (00, 30)
- [ ]  Close time must be after open time
- [ ]  "Aplicar a todos" copies selected day's hours to all other open days
- [ ]  Peak periods optional — can skip entirely
- [ ]  If peak configured, days + time range validated
- [ ]  Peak time must fall within operating hours
- [ ]  Can add multiple peak periods
- [ ]  Can delete a peak period
- [ ]  Data saved to `facilities.operating_hours` JSONB and `time_slots` table on "Siguiente"
- [ ]  "Anterior" (Back) button returns to Step 1 without losing data
- [ ]  "Siguiente" proceeds to Step 3 (Photos)

#### Operating Hours JSONB Format

```tsx
type OperatingHours = {
  [day: number]: {  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    isOpen: boolean;
    openTime: string;  // "07:00"
    closeTime: string; // "22:00"
  }
};
```

---

### 4.4 Setup Wizard — Step 3: Facility Photos

**Route:** `/org/[slug]/f/[facilitySlug]/setup` (step 3)

**Priority:** P1 — Encouraged but not required for activation

#### Behavior

Facility photos are critical for the player-facing mobile app. A facility without photos looks unprofessional and won't attract bookings. However, we don't want to **block** activation on photos since some owners may not have them ready immediately.

#### Photo Upload Section

Uses the shared `ImageUpload` component from the 🖼️ Image System in **gallery mode**:

- Drag-and-drop or click to upload
- Up to 10 photos
- First photo becomes the cover (shown on facility cards)
- Drag to reorder
- Delete with confirmation

#### Amenities Section

Below photos, a toggle-chip grid for amenities:

🅿️ Estacionamiento • 🏠 Canchas Techadas • ☕ Café/Snacks • 🚿 Duchas • 🔒 Lockers • 🎾 Alquiler de Equipos • 📶 WiFi • ♿ Accesible • 👶 Área Kids • 🏢 Pro Shop

#### Acceptance Criteria

- [ ]  Stepper shows Step 3 as active, Steps 1-2 as completed
- [ ]  `ImageUpload` component renders in gallery mode
- [ ]  Can upload up to 10 photos (JPG, PNG, WebP, max 10MB each)
- [ ]  Photos upload directly to Cloudflare Images via Direct Creator Upload
- [ ]  First photo marked as cover with badge
- [ ]  Drag-to-reorder updates photo order in `facilities.photos` JSONB
- [ ]  Delete photo removes from both DB and Cloudflare
- [ ]  Amenities rendered as toggle chips (selected = blue, unselected = gray)
- [ ]  Amenities saved to `facilities.amenities` JSONB array
- [ ]  **Photos are encouraged but not required** — can proceed without uploading
- [ ]  If no photos uploaded, show gentle nudge: "Recomendamos subir al menos 3 fotos para atraer más jugadores. Puedes agregarlas después."
- [ ]  "Completar Configuración" button always enabled (photos not blocking)
- [ ]  "Anterior" button returns to Step 2

---

### 4.5 Complete Setup → Activate Facility

**Priority:** P0

#### Behavior

After the wizard's last step, the admin clicks "Completar Configuración". The system validates that minimum requirements are met and activates the facility.

#### Activation Requirements (Gate)

| Requirement | Check | Blocking? |
| --- | --- | --- |
| At least 1 court | `courts.count >= 1` for this facility | ✅ Yes — cannot activate without courts |
| Operating hours set | `operating_hours` has at least 1 open day | ✅ Yes — cannot activate without schedule |
| Court pricing set | All courts have `hourly_rate_cents > 0` | ✅ Yes — cannot accept bookings without pricing |
| Facility photos | `photos.length >= 1` | ❌ No — encouraged, not required |
| Amenities | `amenities.length >= 0` | ❌ No — optional |

#### Completion Screen

After activation:

```
┌────────────────────────────────────────┐
│  🎉                                       │
│  ¡[Facility Name] está listo!              │
│                                            │
│  Tu local ya está activo y visible para    │
│  los jugadores en la app de PadelHub.      │
│                                            │
│  ✅ 3 canchas configuradas                  │
│  ✅ Horarios establecidos                   │
│  ⚠️ Sin fotos (puedes agregarlas después)   │
│                                            │
│  [Ir al Dashboard]  [Agregar Fotos]        │
└────────────────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  "Completar Configuración" validates blocking requirements before activating
- [ ]  If requirements not met → show what's missing with links to fix: "Necesitas al menos 1 cancha" → link to Step 1
- [ ]  On success: `is_active` set to `true`, `setup_status` set to `'complete'`
- [ ]  Completion screen shows summary of what was configured
- [ ]  Warnings for optional missing items (photos, amenities) with "Agregar" links
- [ ]  "Ir al Dashboard" button navigates to `/org/[slug]/f/[facilitySlug]/dashboard`
- [ ]  "Agregar Fotos" navigates to facility profile/photos section
- [ ]  Confetti or celebration animation (subtle, not over-the-top)
- [ ]  Facility now appears as "Activo" in the org facilities overview (Flow 2)

#### API

```tsx
facility.completeSetup.mutate({ facilitySlug: string })
// Validates: hasCourts, hasSchedule, hasPricing
// Sets: is_active = true, setup_status = 'complete'
// Returns: { success: true, facility, warnings: string[] }
```

---

### 4.6 Setup Progress Tracking

**Priority:** P0

#### Behavior

Track which setup steps are complete so the wizard knows where the user left off and the dashboard knows whether to show the setup banner.

#### Setup Status Model

```tsx
type SetupStatus = 'pending' | 'in_progress' | 'complete';

type SetupProgress = {
  hasCourts: boolean;       // courts.count >= 1
  hasSchedule: boolean;     // operating_hours has >= 1 open day with non-default values
  hasPricing: boolean;      // all courts have hourly_rate_cents > 0
  hasPhotos: boolean;       // photos.length >= 1
  hasAmenities: boolean;    // amenities.length >= 1
  completedSteps: number;   // 0-3
  totalSteps: number;       // 3
  canActivate: boolean;     // hasCourts && hasSchedule && hasPricing
};
```

#### Acceptance Criteria

- [ ]  `facility.getSetupProgress.query()` returns the current setup state
- [ ]  Progress is computed from actual data (courts count, operating_hours, etc.), not from a flag
- [ ]  Wizard stepper reflects completed steps (✅) vs pending (○) vs active (●)
- [ ]  `canActivate` is true only when all blocking requirements are met
- [ ]  Setup status used by: wizard stepper (4.2-4.4), completion gate (4.5), dashboard banner (4.7), resume logic (4.8)

#### API

```tsx
facility.getSetupProgress.query({ facilitySlug: string })
// Returns: SetupProgress
// Computed from: courts count, operating_hours, photos, amenities
```

---

### 4.7 Incomplete Setup Banner on Facility Dashboard

**Priority:** P0

#### Behavior

When a user navigates to a facility that hasn't completed setup, show a prominent banner at the top of the dashboard nudging them to finish.

#### Banner Design

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Completa la configuración de tu local                           │
│                                                                   │
│  Tu local aún no está visible para los jugadores.                  │
│  Completa los pasos restantes para activarlo.                      │
│                                                                   │
│  [============───────] 1 de 3 pasos completados                     │
│                                                                   │
│  [Continuar Configuración →]                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Banner shown on all facility dashboard pages when `setup_status !== 'complete'`
- [ ]  Shows progress bar with completed/total steps
- [ ]  Lists what's missing: "❌ Canchas" / "❌ Horarios" / "✅ Canchas" etc.
- [ ]  "Continuar Configuración" button → resumes wizard at the next incomplete step (4.8)
- [ ]  Banner does NOT show once facility is activated (`is_active: true` and `setup_status: 'complete'`)
- [ ]  Banner is dismissible per session (but returns on next visit until setup is complete)
- [ ]  Visible to `org_admin` and `facility_manager` (staff doesn't see it — they can't configure)

---

### 4.8 Resume Setup From Where You Left Off

**Priority:** P1

#### Behavior

If the admin starts the wizard, adds 2 courts, then closes the browser, they should be able to return and pick up where they left off.

#### Acceptance Criteria

- [ ]  Visiting `/setup` when Step 1 is done but Step 2 isn't → wizard opens on Step 2
- [ ]  Visiting `/setup` when Steps 1-2 are done → wizard opens on Step 3
- [ ]  Visiting `/setup` when all steps are done → redirect to completion screen or dashboard
- [ ]  Stepper allows clicking completed steps to review/edit them
- [ ]  Data from completed steps is preserved and editable
- [ ]  "Continuar Configuración" from dashboard banner (4.7) routes to correct step
- [ ]  Resume logic uses `facility.getSetupProgress` to determine current step

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 4.6 — Setup progress tracking | API foundation. Everything else reads from this | 2h |
| 2 | 4.1 — Quick create facility | Entry point. Creates the facility shell | 4-5h |
| 3 | 4.2 — Wizard Step 1: Courts | First wizard step. Includes wizard stepper UI | 5-6h |
| 4 | 4.3 — Wizard Step 2: Hours + Pricing | Second step. 7-day grid + peak periods | 5-6h |
| 5 | 4.5 — Complete setup / activation | Activation gate + completion screen | 2-3h |
| 6 | 4.7 — Incomplete setup banner | Dashboard nudge for incomplete facilities | 2h |
| 7 | 4.4 — Wizard Step 3: Photos | P1. Depends on Image System being ready | 3-4h |
| 8 | 4.8 — Resume setup | P1. Smart routing based on progress | 2h |

**Total estimate:** ~25-30 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/
│   ├── facilities/
│   │   └── new/
│   │       └── page.tsx                  # 4.1 — Quick create form
│   └── f/[facilitySlug]/
│       ├── setup/
│       │   └── page.tsx                  # 4.2-4.5 — Wizard (all steps)
│       └── dashboard/
│           └── page.tsx                  # 4.7 — Setup banner (conditional)
├── components/
│   ├── facility/
│   │   ├── CreateFacilityForm.tsx      # 4.1 — Quick create form
│   │   ├── SetupWizard.tsx             # 4.2-4.4 — Wizard container + stepper
│   │   ├── SetupStepCourts.tsx         # 4.2 — Courts step
│   │   ├── SetupStepSchedule.tsx       # 4.3 — Hours + pricing step
│   │   ├── SetupStepPhotos.tsx         # 4.4 — Photos + amenities step
│   │   ├── SetupComplete.tsx           # 4.5 — Completion screen
│   │   ├── SetupBanner.tsx             # 4.7 — Dashboard banner
│   │   ├── OperatingHoursGrid.tsx      # 4.3 — 7-day hours editor
│   │   ├── PeakPeriodForm.tsx          # 4.3 — Peak period config
│   │   ├── CourtCard.tsx               # 4.2 — Court summary card
│   │   ├── AmenityChips.tsx            # 4.4 — Toggle chip grid
│   │   └── DistrictSelector.tsx        # 4.1 — Lima districts autocomplete

packages/api/src/router/
├── facility.ts                            # create, completeSetup, getSetupProgress
└── court.ts                               # create, update, delete (wizard usage)
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 1 (Auth) + Flow 3 (RBAC) | 🔲 In progress | Only org_admin can create facilities |
| Flow 2 (Org) — Facilities overview page | 🔲 Not started | "Agregar Local" button entry point |
| 🖼️ Image System | 🔲 Not started | 4.4 (photos step). Other steps work without it |
| `facilities` table | ✅ Exists | — |
| `courts` table | ✅ Exists | — |
| `time_slots` table | ✅ Exists | Peak period storage |
| Geocoding API | 🔲 Needs setup | 4.1 address geocoding. Can defer with manual lat/lng entry |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Duplicate facility name in same org | Allowed (different facilities can share names). Slug is auto-deduplicated: "trigal-padel", "trigal-padel-2" |
| Admin closes browser mid-wizard | Facility exists in DB (incomplete). Courts from Step 1 are saved. Resume from 4.8 on return |
| Admin navigates away from wizard | Data is saved per-step. No "unsaved changes" warning in wizard (unlike profile edit forms) |
| Try to activate with 0 courts | Blocked: "Necesitas al menos 1 cancha para activar tu local" |
| Court with S/0 pricing | Blocked: "Todas las canchas necesitan un precio por hora" |
| All days set to closed | Blocked: "Tu local necesita al menos 1 día abierto" |
| Facility manager visits setup page | Setup wizard not accessible to managers — redirect to facility dashboard. Only org_admin creates and configures initial setup |
| Revisit wizard after activation | Redirect to facility dashboard (or show "already complete" with link to settings for further edits) |
| Delete all courts after completing Step 1 | Step 1 reverts to incomplete. "Siguiente" disabled again. Setup banner reappears |

---

## Testing Checklist

### Quick Create

- [ ]  Fill form → facility created with `is_active: false` → redirect to wizard
- [ ]  Slug generated and unique within org
- [ ]  District selector works with search
- [ ]  Geocoding shows map preview
- [ ]  Only `org_admin` can access create page

### Wizard Step 1: Courts

- [ ]  Add 3 courts → cards appear in grid
- [ ]  Edit a court → card updates
- [ ]  Delete a court → card removed (confirm if last)
- [ ]  Try to proceed with 0 courts → "Siguiente" disabled
- [ ]  Price in Soles, stored as cents
- [ ]  Close browser → reopen → courts still there

### Wizard Step 2: Schedule

- [ ]  7-day grid pre-filled with defaults
- [ ]  Toggle a day closed → time selects disabled
- [ ]  "Aplicar a todos" copies hours
- [ ]  Add peak period → validates within operating hours
- [ ]  Skip peak entirely → proceed to Step 3

### Wizard Step 3: Photos

- [ ]  Upload 3 photos → appear in gallery
- [ ]  First photo shows "Portada" badge
- [ ]  Reorder photos via drag
- [ ]  Delete a photo → removed from Cloudflare + DB
- [ ]  Amenity chips toggle correctly
- [ ]  Proceed without photos → nudge shown but not blocked

### Activation

- [ ]  Complete all blocking requirements → activation succeeds
- [ ]  Completion screen shows summary with warnings for missing optional items
- [ ]  Facility appears as "Activo" in org overview
- [ ]  Missing courts → activation blocked with clear message

### Dashboard Banner

- [ ]  Incomplete facility → banner shown with progress
- [ ]  "Continuar Configuración" → resumes at correct step
- [ ]  Complete facility → no banner
- [ ]  Staff user → no banner (they can't configure)

### Resume

- [ ]  Complete Step 1 → leave → return → wizard opens on Step 2
- [ ]  Complete Steps 1-2 → leave → return → wizard opens on Step 3
- [ ]  Can click back to completed steps to review/edit

---

## Definition of Done

- [ ]  Facility creation form works with geocoding and slug generation
- [ ]  3-step wizard (Courts → Schedule → Photos) guides admin through setup
- [ ]  Data saved per-step (survives browser close)
- [ ]  Setup progress computed from actual data, not flags
- [ ]  Activation gate validates blocking requirements before going live
- [ ]  Completion screen with summary and optional item warnings
- [ ]  Dashboard banner nudges incomplete setups
- [ ]  Resume logic routes to correct wizard step
- [ ]  Only `org_admin` can create facilities and run wizard
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows