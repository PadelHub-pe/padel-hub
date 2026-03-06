# Flow 4: Facility Onboarding — Technical Plan

## 1. Context

### What Exists Today

**API layer** — significant infrastructure already built:

- `org.createFacility` — creates facility shell (name, address, district, phone, email) with `isActive: false`
- `facility.getSetupStatus` — basic progress (hasCourts, hasSchedule, isComplete based on `onboardingCompletedAt`)
- `facility.saveCourts` — batch saves 1-6 courts (name + type only, replaces all existing)
- `facility.saveSchedule` — saves operating hours + default duration + facility-wide default price, creates time slot templates
- `facility.completeSetup` — validates courts + schedule exist, sets `isActive=true` + `onboardingCompletedAt`
- `court.*` — full CRUD (create, update, delete, list) with per-court `priceInCents` and `peakPriceInCents`
- `schedule.*` — operating hours CRUD + peak periods CRUD
- `images.*` — upload URL, confirm, delete, reorder (Cloudflare Images)

**Frontend** — 2-step wizard and supporting UI exist:

- Quick create form (`/facilities/new`) — name, address, district (free text), phone, email
- Setup wizard (`/facilities/[id]/setup`) — 2 steps: courts (name+type) → schedule (hours + default price)
- StepIndicator, StepCourts, StepSchedule components
- FacilityCard with "Pendiente" badge for incomplete setups
- Dashboard setup banner (basic amber banner with link to setup)
- ImageUpload/ImageGallery/ImagePreview components (fully functional)
- `usePermission` hook + role-based sidebar filtering

**Database** — all tables exist:

- `facilities` — includes `amenities` (jsonb), `photos` (jsonb), `isActive`, `onboardingCompletedAt`
- `courts` — includes `priceInCents`, `peakPriceInCents`, `type` (indoor/outdoor)
- `operatingHours` — per-day open/close times
- `peakPeriods` — days, times, markupPercent
- `timeSlotTemplates` — pricing templates per day/time/court

### What the Spec Asks For vs What Exists (Delta)

| Spec Requirement | Current State | Delta |
|---|---|---|
| District autocomplete (Lima districts) | Free text input | Build searchable select component |
| Slug generation + preview | No slug column on facilities | Add slug column, auto-generate from name, show preview on create form |
| Geocoding + map preview | No lat/lng columns, no API | Add lat/lng columns, integrate Nominatim (free OSM geocoding), show map preview |
| Court pricing in wizard Step 1 | Wizard only captures name+type; pricing is facility-wide default | Add per-court pricing fields to wizard |
| Surface type, lighting toggle | Not in wizard | Add fields (courts table has no surface/lighting columns) |
| Court cards layout with edit/delete | Simple numbered list, no edit | Redesign as card grid with inline CRUD |
| Individual court saves (survive page close) | Batch replace-all on "Siguiente" | Switch to individual court.create/update/delete |
| Max 10 courts | Currently max 6 | Update validation |
| "Aplicar a todos" for schedule | Not implemented | Add button |
| Peak periods in wizard | Only in post-setup schedule management | Add optional section to wizard Step 2 |
| Photo upload step (Step 3) | No Step 3 in wizard | Add step with ImageUpload gallery |
| Amenity chips | No UI for amenities | Add toggle chip grid |
| Completion screen with summary | Direct redirect to dashboard | Build completion screen |
| Pricing validation in activation gate | Only checks courts + schedule exist | Add priceInCents > 0 check |
| Setup progress with hasPricing/hasPhotos | Basic 2-field progress | Expand to full model |
| Enhanced setup banner with progress bar | Basic amber banner | Add progress bar + step details |
| Resume setup from correct step | Always starts at Step 1 | Auto-detect + route to next incomplete |
| Default operating hours on create | No hours created on facility creation | Insert 7 default rows |

### Deferred Items (Not in Scope)

1. **Surface type / lighting columns** — Not in `courts` table schema. Can be added later as a simple migration.
2. **Confetti animation** — Nice to have, can add post-MVP.
3. **Slug-based dashboard URLs** — Slugs will be added to the schema and generated on creation, but dashboard URLs will keep using `facilityId` (internal tool). Slugs are stored for future player-facing URLs (mobile app, public pages). Rewriting all dashboard routes (~30 files) is a separate effort.

## 2. Architecture Decisions

### Court Management: Individual CRUD vs Batch Replace

**Decision: Switch wizard to individual court CRUD.**

Currently `facility.saveCourts` replaces all courts on each save. The spec requires "data saved to DB on each add" so progress survives page close. The existing `court.create`, `court.update`, `court.delete` procedures already support this — the wizard should use them directly instead of the batch `saveCourts` procedure.

This means:
- Court cards reflect live DB state via `court.list` query
- Add court → `court.create` mutation + query invalidation
- Edit court → `court.update` mutation + query invalidation
- Delete court → `court.delete` mutation + query invalidation
- No more local court state management in wizard

### Wizard Structure: 2 Steps → 3 Steps

**Decision: Add Photos/Amenities as Step 3 (P1, non-blocking).**

Current wizard has 2 steps. Expand to 3:
1. Canchas (courts) — P0, blocking
2. Horarios y Precios (schedule + pricing) — P0, blocking
3. Fotos y Servicios (photos + amenities) — P1, encouraged but not required

The stepper component already supports N steps. Just add the third step config.

### Setup Progress: Computed, Not Stored

**Decision: Keep computing progress from actual data.**

The current `getSetupStatus` already computes from DB state. Expand it to include:
- `hasPricing` — all courts have `priceInCents > 0`
- `hasPhotos` — `photos.length >= 1`
- `hasAmenities` — `amenities.length >= 1`
- `completedSteps` / `totalSteps`
- `canActivate` — hasCourts && hasSchedule && hasPricing

### District Selector

**Decision: Client-side searchable select with hardcoded Lima districts.**

Use a Combobox (shadcn/ui) with ~40 Lima districts pre-populated. Allow free text fallback for districts not in the list. No API call needed — districts are a static list.

### Operating Hours: Default on Creation

**Decision: Insert default operating hours when facility is created.**

Currently no operating hours exist until the wizard Step 2 is saved. The spec says "Pre-filled with defaults from facility creation (7:00-22:00)". Insert 7 rows in `operatingHours` during `org.createFacility`.

### Slug Generation

**Decision: Add `slug` column to facilities, auto-generate from name, keep `facilityId` in dashboard URLs.**

- Add `slug` varchar(250) column to `facilities` table (unique within org via composite unique constraint)
- Auto-generate on creation: "Trigal Padel" -> `trigal-padel`
- Deduplicate within org: `trigal-padel`, `trigal-padel-2`, `trigal-padel-3`
- Show slug preview below name field on create form
- Dashboard URLs keep using `facilityId` (internal tool, no rewrite needed)
- Slugs stored for future player-facing URLs (mobile app, public facility pages)

### Geocoding

**Decision: Use Nominatim (OpenStreetMap) for free geocoding, add lat/lng to facilities.**

- Add `latitude` and `longitude` decimal columns to `facilities` table (nullable)
- Use Nominatim API (free, no API key, no billing): `https://nominatim.openstreetmap.org/search`
- Geocode on address + district input blur (client-side fetch, debounced)
- Show small map preview via static map image or embedded Leaflet/OpenStreetMap tile
- Lat/lng nullable — geocoding failure doesn't block facility creation
- Rate limit: max 1 request per second per Nominatim policy (client-side throttle)
- Can swap to Google Maps Geocoding API later if higher accuracy needed

## 3. Risk Assessment

### Blast Radius

| Area | Risk | Mitigation |
|---|---|---|
| Court wizard step redesign | Breaking existing court state management | Existing `court.*` CRUD is well-tested; just use it |
| Schedule step changes | Could affect post-setup schedule management | Schedule page uses `schedule.*` router, not `facility.saveSchedule` |
| Setup banner changes | Affects facility dashboard layout | Banner is already conditional; just enhance it |
| `completeSetup` validation change | Could prevent activation for existing facilities with S/0 courts | Check seed data — test facilities have pricing set |
| Default operating hours on create | Affects all new facility creation (admin panel too) | Admin panel's `approveAccessRequest` also creates facilities — ensure defaults are inserted there too |

| Schema migration (slug + lat/lng) | Adding columns to facilities table | Nullable columns, no data migration needed. `db:push` handles it |
| Nominatim rate limiting | 1 req/sec policy, could get blocked | Client-side throttle + debounce, graceful fallback if geocoding fails |
| Slug uniqueness race condition | Two facilities created simultaneously with same name | DB-level unique constraint (org_id + slug) catches it, retry with incremented suffix |

### Migration Complexity

**Schema changes required:** Add 3 columns to `facilities` table:
- `slug` varchar(250) — nullable initially, backfill existing facilities
- `latitude` decimal — nullable
- `longitude` decimal — nullable

All nullable, so no data migration needed. Run `pnpm db:push` to apply.

### External Dependencies

- **Image System** — already built and functional. Photos step just integrates existing `ImageUpload` component.
- **Nominatim API** — free OSM geocoding, no API key. Rate limited to 1 req/sec. Graceful degradation if unavailable.

## 4. Task Breakdown

See `docs/TASKS.md` for the ordered task list.

### Dependency Graph

```
TASK-4.00 (Schema: slug + lat/lng) ──┐
                                     │
TASK-4.01 (Setup Progress API) ──────┤
                                     ├──► TASK-4.07 (Setup Banner)
TASK-4.02 (Default Hours)  ──────────┤    TASK-4.08 (Resume Logic)
                                     │
TASK-4.03 (District + Geocoding) ────┤
                                     ├──► TASK-4.04 (Courts Step) ──► TASK-4.06 (Completion Screen)
TASK-4.10 (Slug Generation) ────┐    │
  (depends on 4.00)             │    ├──► TASK-4.05 (Schedule Step)──► TASK-4.06
                                │    │
                                └────┤──► TASK-4.09 (Photos Step) ──► TASK-4.06
```

### Parallel Opportunities

These tasks can run in parallel:
- TASK-4.00 + TASK-4.01 + TASK-4.02 (independent foundation work)
- TASK-4.03 + TASK-4.10 (both depend on 4.00, independent of each other)
- TASK-4.04 + TASK-4.05 + TASK-4.09 (independent wizard steps)
- TASK-4.07 + TASK-4.08 (both depend on 4.01 only)
