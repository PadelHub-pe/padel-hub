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

---

## Next: Flow 4 — Facility Onboarding

> Technical plan: [docs/TECHNICAL_PLAN.md](./TECHNICAL_PLAN.md)
> Spec: `what-needs-to-be-build/Flow 4 Facility Onboarding`

### TASK-4.00: Schema migration — slug + geocoding columns [config]

**Priority:** P0 | **Depends on:** none

Add `slug`, `latitude`, and `longitude` columns to the `facilities` table.

**Changes:**
- `packages/db/src/schema.ts` — add to `facilities` table:
  - `slug` varchar(250), nullable (backfill existing facilities in seed)
  - `latitude` decimal/numeric, nullable
  - `longitude` decimal/numeric, nullable
- Add unique constraint: `(organizationId, slug)` — slug unique within org
- `packages/db/src/seed.ts` — set slugs for seeded facilities (e.g., "padel-club-san-isidro")
- Run `pnpm db:push` to apply schema changes
- Update `CreateFacilitySchema` (drizzle-zod) if auto-generated

**Acceptance criteria:**
- [ ] `slug`, `latitude`, `longitude` columns exist on facilities table
- [ ] Unique constraint on (organizationId, slug)
- [ ] `pnpm db:push` succeeds
- [ ] Seed data has valid slugs
- [ ] Existing code unaffected (all new columns nullable)

---

### TASK-4.01: Enhance setup progress tracking API [feature]

**Priority:** P0 | **Depends on:** none

Expand `facility.getSetupStatus` to return full progress model needed by wizard, banner, and resume logic.

**Changes:**
- `packages/api/src/router/facility.ts` — expand `getSetupStatus` return type:
  - `hasCourts` (courts.count >= 1) — already exists
  - `hasSchedule` (operatingHours with non-default or any rows exist) — already exists
  - `hasPricing` (ALL courts have `priceInCents > 0`) — NEW
  - `hasPhotos` (photos.length >= 1) — NEW
  - `hasAmenities` (amenities.length >= 1) — NEW
  - `completedSteps` / `totalSteps` (0-3 / 3) — NEW
  - `canActivate` (hasCourts && hasSchedule && hasPricing) — NEW
- `packages/api/src/__tests__/setup.test.ts` — write comprehensive tests:
  - Facility with no courts → hasCourts=false, completedSteps=0
  - Facility with courts but no pricing → hasPricing=false, canActivate=false
  - Facility with courts + pricing + schedule → canActivate=true
  - Facility with photos → hasPhotos=true
  - Already complete facility → isComplete=true

**Acceptance criteria:**
- [ ] `getSetupStatus` returns all fields
- [ ] Progress computed from actual DB data
- [ ] Tests cover all combinations
- [ ] `canActivate` is true only when all P0 requirements met

---

### TASK-4.02: Default operating hours on facility creation [feature]

**Priority:** P0 | **Depends on:** none

When a facility is created, insert default operating hours (Mon-Sun 7:00-22:00) so the schedule step in the wizard shows pre-filled values.

**Changes:**
- `packages/api/src/router/org.ts` — in `createFacility`, after inserting facility, insert 7 `operatingHours` rows with defaults (open 07:00, close 22:00, isClosed=false for all days)
- Verify admin panel's `approveAccessRequest` also creates facilities — ensure it goes through the same path or add defaults there too

**Acceptance criteria:**
- [ ] New facility has 7 operating hours rows (dayOfWeek 0-6)
- [ ] All days default to 07:00-22:00, isClosed=false
- [ ] Schedule wizard step shows pre-filled hours
- [ ] Admin panel facility creation also gets defaults

---

### TASK-4.03: District autocomplete + geocoding on create form [feature]

**Priority:** P0 | **Depends on:** TASK-4.00

Replace the free-text district input with a searchable combobox, and add address geocoding with map preview.

**Changes:**
- `apps/nextjs/src/components/district-selector.tsx` — NEW component:
  - Searchable combobox (shadcn Popover + Command)
  - Pre-populated with ~40 Lima districts (Surco, Miraflores, San Isidro, La Molina, San Borja, Barranco, Chorrillos, Jesus Maria, Lince, Pueblo Libre, Magdalena, San Miguel, Brena, Ate, San Juan de Lurigancho, Comas, Los Olivos, etc.)
  - Allow selecting from list OR typing custom value
  - Compatible with react-hook-form (controlled via `value`/`onChange`)
- `apps/nextjs/src/components/address-map-preview.tsx` — NEW component:
  - Calls Nominatim API: `https://nominatim.openstreetmap.org/search?q={address},{district},Lima,Peru&format=json`
  - Triggered on address/district blur (debounced, max 1 req/sec)
  - Shows small map preview with pin (static OpenStreetMap tile or Leaflet embed)
  - Displays geocoded lat/lng
  - Graceful fallback if geocoding fails (just hide map, don't block form)
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/new/_components/quick-create-form.tsx` — enhance:
  - Replace district `<Input>` with `<DistrictSelector>`
  - Add `<AddressMapPreview>` below address/district fields
  - Add hidden `latitude`/`longitude` fields populated by geocoding result
  - Pass lat/lng to `org.createFacility` mutation
- `packages/api/src/router/org.ts` — update `createFacilitySchema` to accept optional `latitude`/`longitude`
  - Save to facilities row on creation

**Acceptance criteria:**
- [ ] District combobox shows Lima districts filtered by search
- [ ] Can select from list or enter custom district
- [ ] Geocoding triggers on address+district blur
- [ ] Map preview shows pin for geocoded location
- [ ] Lat/lng saved to facilities table
- [ ] Geocoding failure doesn't block form submission (lat/lng remain null)
- [ ] Nominatim rate limit respected (1 req/sec throttle)

---

### TASK-4.04: Redesign courts wizard step [feature]

**Priority:** P0 | **Depends on:** TASK-4.01

Redesign the courts step to use individual court CRUD (persists immediately), card layout, and pricing fields.

**Changes:**
- `apps/nextjs/src/components/facility-setup/step-courts.tsx` — full rewrite:
  - Fetch courts via `trpc.court.list` query
  - Add court form: name, type (indoor/outdoor), priceInCents (in Soles, converted to cents), peakPriceInCents (optional)
  - "Agregar Cancha" creates via `trpc.court.create` mutation (immediate DB save)
  - Court cards grid (not list): show name, type, price, edit/delete buttons
  - Edit: opens form pre-filled, saves via `trpc.court.update`
  - Delete: confirmation dialog, removes via `trpc.court.delete`
  - Max 10 courts (existing `court.create` already validates this)
  - "Agregar Cancha" card as last item in grid (if under 10)
- `apps/nextjs/src/components/facility-setup/step-schedule.tsx` — remove default price field (pricing now per-court)
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/_components/setup-wizard.tsx` — update to:
  - Remove `saveCourts` mutation (no longer needed)
  - Pass facilityId to StepCourts for direct CRUD
  - "Siguiente" button enabled when court.list.length >= 1

**Acceptance criteria:**
- [ ] Courts saved to DB on each add (not batched)
- [ ] Court cards show name, type, price
- [ ] Can edit court → card updates
- [ ] Can delete court → card removed (confirmation if last)
- [ ] Max 10 courts enforced
- [ ] Price input in Soles, stored as cents
- [ ] "Siguiente" disabled until >= 1 court
- [ ] Progress survives page close/reopen

---

### TASK-4.05: Enhance schedule wizard step [feature]

**Priority:** P0 | **Depends on:** TASK-4.02

Enhance the schedule step with "Aplicar a todos" button and optional peak period configuration.

**Changes:**
- `apps/nextjs/src/components/facility-setup/step-schedule.tsx` — enhance:
  - Remove default price field (moved to per-court in TASK-4.04)
  - Remove duration selector (keep default 90 min, configurable in Flow 6)
  - Add "Aplicar a todos" button: copies selected day's hours to all other open days
  - Add peak periods section (optional, collapsible):
    - "Tienes horarios de hora punta?" toggle
    - If yes: days multi-select, start/end time, uses `schedule.createPeakPeriod`
    - Can add multiple peak periods
    - Can delete peak periods
  - Validate close time > open time per day
  - Save operating hours via `schedule.updateOperatingHours` (existing procedure)
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/_components/setup-wizard.tsx` — update Step 2 to use `schedule.updateOperatingHours` instead of `facility.saveSchedule`

**Acceptance criteria:**
- [ ] "Aplicar a todos" copies one day's hours to all open days
- [ ] Peak periods optional — can skip
- [ ] Peak time validated within operating hours
- [ ] Can add/delete multiple peak periods
- [ ] Close time must be after open time
- [ ] "Anterior" returns to Step 1 without losing data

---

### TASK-4.06: Completion screen and activation gate [feature]

**Priority:** P0 | **Depends on:** TASK-4.01, TASK-4.04, TASK-4.05

Enhance the activation gate with pricing validation and build a proper completion screen.

**Changes:**
- `packages/api/src/router/facility.ts` — enhance `completeSetup`:
  - Add validation: all courts must have `priceInCents > 0` ("Todas las canchas necesitan un precio por hora")
  - Return `warnings` array for missing optional items (photos, amenities)
- `apps/nextjs/src/components/facility-setup/setup-complete.tsx` — NEW component:
  - Celebration heading ("!Tu local esta listo!")
  - Summary: X canchas configuradas, Horarios establecidos
  - Warnings for optional missing items (photos, amenities) with action links
  - "Ir al Dashboard" button → facility dashboard
  - "Agregar Fotos" button → facility photos section (if no photos)
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/_components/setup-wizard.tsx` — show completion screen after successful `completeSetup`

**Acceptance criteria:**
- [ ] Activation blocked if any court has priceInCents <= 0
- [ ] Activation blocked if 0 courts or 0 open days
- [ ] Clear error messages with links to fix (e.g., "go to Step 1")
- [ ] Completion screen shows configured items summary
- [ ] Warnings for missing photos/amenities with action links
- [ ] "Ir al Dashboard" navigates to facility dashboard
- [ ] Facility appears as "Activo" in org facilities overview

---

### TASK-4.07: Enhanced setup banner on facility dashboard [feature]

**Priority:** P0 | **Depends on:** TASK-4.01

Enhance the existing setup banner with progress bar, step completion status, and correct resume routing.

**Changes:**
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/page.tsx` — enhance banner:
  - Use `facility.getSetupStatus` expanded data
  - Show progress bar (completedSteps / totalSteps)
  - List what's done/missing: checkmarks/crosses for Canchas, Horarios, Precios
  - "Continuar Configuracion" button routes to next incomplete step
  - Only show for `org_admin` and `facility_manager` (use `usePermission`)
  - Dismissible per session (sessionStorage flag)
- Banner hides when `isComplete === true`

**Acceptance criteria:**
- [ ] Progress bar reflects completed steps
- [ ] Shows per-step completion status
- [ ] "Continuar Configuracion" routes to correct wizard step
- [ ] Only visible to org_admin and facility_manager
- [ ] Dismissible per session, returns next visit
- [ ] Hidden once facility is active + setup complete

---

### TASK-4.08: Resume setup from correct step [feature]

**Priority:** P1 | **Depends on:** TASK-4.01

Auto-detect which step the user should be on when visiting the setup wizard.

**Changes:**
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/page.tsx` — enhance:
  - Prefetch `facility.getSetupStatus`
  - If all steps complete → redirect to dashboard (or completion screen)
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/_components/setup-wizard.tsx` — enhance:
  - Initialize `currentStep` based on setup progress (not always 1)
  - If hasCourts && hasPricing → start on Step 2
  - If hasCourts && hasPricing && hasSchedule → start on Step 3
  - Allow clicking completed steps in stepper to review/edit
  - "Continuar Configuracion" from banner (TASK-4.07) passes `?step=N` query param

**Acceptance criteria:**
- [ ] Visit `/setup` with Step 1 done → opens on Step 2
- [ ] Visit `/setup` with Steps 1-2 done → opens on Step 3
- [ ] Visit `/setup` when all done → redirect to dashboard
- [ ] Can click completed steps to review
- [ ] Data from completed steps preserved and editable

---

### TASK-4.09: Photos and amenities wizard step [feature]

**Priority:** P1 | **Depends on:** none (ImageUpload components exist)

Add Step 3 to the wizard for facility photos and amenity selection.

**Changes:**
- `apps/nextjs/src/components/facility-setup/step-photos.tsx` — NEW component:
  - `ImageUpload` in gallery mode (entityType="facility", up to 10 photos)
  - First photo shows "Portada" badge
  - Drag-to-reorder via `images.reorder`
  - Delete via `images.delete`
  - Nudge message if no photos: "Recomendamos subir al menos 3 fotos..."
- `apps/nextjs/src/components/facility-setup/amenity-chips.tsx` — NEW component:
  - Toggle chip grid for amenities
  - Chips: Estacionamiento, Canchas Techadas, Cafe/Snacks, Duchas, Lockers, Alquiler de Equipos, WiFi, Accesible, Area Kids, Pro Shop
  - Selected = blue, unselected = gray
  - Saves to `facility.updateProfile` amenities field
- `apps/nextjs/src/components/facility-setup/step-indicator.tsx` — update default steps to 3
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/setup/_components/setup-wizard.tsx` — add Step 3:
  - Between schedule step and "Completar Configuracion"
  - Not blocking — "Completar Configuracion" button always enabled
  - "Anterior" returns to Step 2

**Acceptance criteria:**
- [x] ImageUpload renders in gallery mode
- [x] Can upload up to 10 photos
- [x] First photo marked as cover
- [x] Drag-to-reorder works
- [x] Delete photo works
- [x] Amenity chips toggle correctly
- [x] Photos NOT required for activation
- [x] Nudge shown if no photos uploaded
- [x] "Completar Configuracion" always enabled on this step

---

### TASK-4.10: Slug auto-generation on facility creation [feature]

**Priority:** P0 | **Depends on:** TASK-4.00

Auto-generate URL-friendly slug from facility name on creation. Show preview on the create form.

**Changes:**
- `packages/api/src/router/org.ts` — in `createFacility`:
  - Generate slug from name: "Trigal Padel" -> `trigal-padel` (lowercase, replace spaces/special chars with hyphens, strip accents)
  - Check uniqueness within org: query existing facility slugs
  - If duplicate, append incrementing suffix: `trigal-padel-2`, `trigal-padel-3`
  - Save slug to facilities row
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/new/_components/quick-create-form.tsx` — enhance:
  - Show slug preview below name field: "URL: trigal-padel"
  - Generate preview client-side as user types (same slugify logic)
  - Slug is auto-generated server-side (preview is informational, not editable)
- `packages/api/src/lib/slugify.ts` — NEW utility:
  - `slugify(name: string): string` — normalize to URL-friendly slug
  - `generateUniqueSlug(db, orgId, name): Promise<string>` — slugify + uniqueness check + suffix

**Acceptance criteria:**
- [ ] Slug auto-generated from facility name on creation
- [ ] Slug preview shown below name field as user types
- [ ] Duplicate names in same org get deduplicated slugs (-2, -3)
- [ ] Slugs handle accents, special chars, multiple spaces
- [ ] Slug saved to facilities table
- [ ] Existing facilities in seed data have slugs

---

### Implementation Order

| Order | Task | Can Parallelize With | Est. |
|---|---|---|---|
| 1 | TASK-4.00 (Schema Migration) | 4.01, 4.02 | 1h |
| 1 | TASK-4.01 (Setup Progress API) | 4.00, 4.02 | 2-3h |
| 1 | TASK-4.02 (Default Hours) | 4.00, 4.01 | 1-2h |
| 2 | TASK-4.03 (District + Geocoding) | 4.10 | 3-4h |
| 2 | TASK-4.10 (Slug Generation) | 4.03 | 2-3h |
| 3 | TASK-4.04 (Courts Step) | 4.05, 4.09 | 4-5h |
| 3 | TASK-4.05 (Schedule Step) | 4.04, 4.09 | 3-4h |
| 3 | TASK-4.09 (Photos Step) | 4.04, 4.05 | 3-4h |
| 4 | TASK-4.06 (Completion Screen) | 4.07 | 2-3h |
| 4 | TASK-4.07 (Setup Banner) | 4.06 | 2h |
| 5 | TASK-4.08 (Resume Logic) | — | 2h |

**Total estimate:** ~26-34 hours
