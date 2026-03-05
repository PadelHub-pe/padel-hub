# 🏢 Flow 2: Organization Management — Engineering Task

Build the org-level shell experience — the first thing users see after login. This is the **container** that houses facilities, KPIs, and org configuration. It doesn't go deep into facility creation (Flow 4), team management (Flow 3), or detailed settings (Flow 9) — it provides the surface-level org experience and navigational structure.

---

## Context & Scope

**What Flow 2 owns:** The org landing page, facilities overview with stats, org profile editing, facility status toggling, org switcher, and the billing stub.

**What Flow 2 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 1 (Auth) | `/org` redirect logic, dead-end page | Already defined in 1.8 — redirect unauthorized users |
| Flow 3 (Team & RBAC) | Team tab in org settings, invite flow, role management | RBAC is complex enough to be its own flow |
| Flow 4 (Facility Onboarding) | Create facility wizard, setup steps | Creation is a multi-step flow with its own validation |
| Flow 9 (Settings) | Deep settings (notifications, security, user profile) | Flow 2 only owns the org profile tab |
| Flow 10 (Navigation) | Facility switcher, sidebar nav, context transitions | Flow 2 owns the org switcher; Flow 10 owns everything else |

---

## Prerequisites

- Flow 1 (Auth) complete — user can login and land on `/org/[slug]/facilities` ✅ (or in progress)
- `organizations`, `facilities`, `organization_members`, `courts` tables exist ✅
- Org membership validation in layout (Flow 1.7) ✅ (or in progress)

---

## Refined Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 2.1 | Facilities overview — KPI stats + facility cards | `/org/[slug]/facilities` | P0 |
| 2.2 | Facilities list — search, filter, sort | `/org/[slug]/facilities` | P0 |
| 2.3 | Toggle facility active/inactive | Facility card actions | P0 |
| 2.4 | Org switcher dropdown | OrgSidebar header | P1 |
| 2.5 | Org profile settings (name, contact, logo) | `/org/[slug]/settings` | P1 |
| 2.6 | Billing tab stub | `/org/[slug]/settings` → Facturación | P2 |
| 2.7 | Empty state — no facilities yet | `/org/[slug]/facilities` | P0 |

**Changes from original:**

- **Removed** 2.1 "Org hub redirect" → already lives in Flow 1.8
- **Split** facilities overview into KPIs + cards (2.1) and search/filter/sort (2.2) — they're different engineering concerns
- **Added** 2.7 empty state — critical for onboarding since new orgs start with zero facilities
- **Demoted** org switcher to P1 — most MVP users will have 1 org
- **Demoted** billing to P2 — it's a stub anyway

---

## Sub-flow Specifications

---

### 2.1 Facilities Overview — KPI Stats + Facility Cards

**Route:** `/org/[slug]/facilities`

**Priority:** P0 — This is the landing page after login

**Reference:** [Dashboard: Org Admin Facilities Overview](https://www.notion.so/Dashboard-Org-Admin-Facilities-Overview-2fe8722b044f81c487f3d56b926f937a?pvs=21)

#### Behavior

1. User logs in → redirect to `/org/[orgSlug]/facilities`
2. Page loads org-wide KPI stats at top
3. Below KPIs, facility cards displayed in a responsive grid
4. Each card shows facility photo/gradient, status, name, district, court count, managers, and quick stats
5. Clicking a card navigates to the facility dashboard

#### KPI Stats Row

| Metric | Source | Format |
| --- | --- | --- |
| Total Facilities | `COUNT(facilities) WHERE org_id` | Integer (e.g., "5") |
| Total Courts | `COUNT(courts)` across all org facilities | Integer (e.g., "18") |
| This Month Bookings | `COUNT(bookings)` in current month | Integer (e.g., "847") |
| This Month Revenue | `SUM(price_cents) / 100` current month | Currency: "S/ 68,450" |

Each KPI card shows a trend indicator (↑12% or ↓5%) comparing to previous month. For MVP, trend can show "—" if insufficient data.

#### Facility Card Anatomy

```
┌─────────────────────────────────┐
│  [Photo / Gradient]             │
│  [Active ●]  [3 courts] [Mixed] │  ← badges
│                           [⋯]  │  ← more actions
├─────────────────────────────────┤
│  Trigal                         │  ← facility name
│  📍 Surco, Lima                 │  ← district
│  👤 👤 María, Carlos           │  ← manager avatars
├─────────────────────────────────┤
│  Today: 12  │ Month: S/8.2K │ 78% │  ← stats
├─────────────────────────────────┤
│  Updated 2h ago    View Dashboard → │
└─────────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  Page loads with KPI stats row showing 4 org-wide metrics
- [ ]  KPI cards show trend indicators (or "—" if no previous month data)
- [ ]  Facility cards render in responsive grid (3 cols desktop, 2 tablet, 1 mobile)
- [ ]  Each card shows: photo or gradient fallback, status badge, court count, court type pill, facility name, district, manager avatars (max 3 + "+N"), stats row (today bookings, month revenue, utilization %)
- [ ]  Card photo uses first image from `facilities.photos` JSONB, gradient fallback if none
- [ ]  Status badge: green dot + "Activo" for `is_active: true`, gray + "Inactivo" for `is_active: false`
- [ ]  Inactive facilities show at 75% opacity with gray gradient header
- [ ]  Click card body → navigate to `/org/[slug]/f/[facilitySlug]/dashboard`
- [ ]  "View Dashboard" link in footer → same navigation
- [ ]  "⋯" menu shows: "Ver Dashboard", "Editar", "Desactivar" (or "Reactivar")
- [ ]  "Agregar Local" button in page header → navigates to facility creation (Flow 4)
- [ ]  Loading state: skeleton cards (3 placeholder cards with animated shimmer)
- [ ]  Error state: "No pudimos cargar tus locales. Intenta de nuevo." with retry button

#### API

```tsx
// tRPC
org.getStats.query({ orgSlug: string })
// Returns: OrgStats { totalFacilities, totalCourts, monthBookings, monthRevenue, trends }

org.getFacilities.query({
  orgSlug: string,
  search?: string,
  status?: 'all' | 'active' | 'inactive',
  district?: string,
  sortBy?: 'name' | 'revenue' | 'bookings' | 'courts',
  sortOrder?: 'asc' | 'desc',
})
// Returns: OrgFacilityCard[]
```

---

### 2.2 Facilities List — Search, Filter, Sort

**Route:** `/org/[slug]/facilities` (filter bar above cards)

**Priority:** P0

#### Behavior

Filter controls sit between the KPI row and the facility cards grid. All filtering is client-side for MVP (we'll have <50 facilities max). Filters are URL-persisted via query params so links are shareable.

#### Filter Controls

| Control | Type | Options |
| --- | --- | --- |
| Search | Text input with search icon | Filters by facility name (debounced 300ms) |
| Status | Segmented control | Todos / Activos / Inactivos |
| District | Dropdown | Dynamically populated from facility districts |
| Sort | Dropdown | Nombre A-Z, Nombre Z-A, Más ingresos, Más reservas, Más canchas |

#### Acceptance Criteria

- [ ]  Search filters facility cards by name as user types (debounced 300ms)
- [ ]  Status segmented control filters: Todos (default), Activos (`is_active: true`), Inactivos (`is_active: false`)
- [ ]  District dropdown populated from unique `facilities.district` values in the org
- [ ]  Sort options: name asc/desc, revenue desc, bookings desc, courts desc
- [ ]  Active filters show count badge: "Filtros (2)"
- [ ]  "Limpiar filtros" link appears when any filter is active
- [ ]  Filters persist in URL query params: `?status=active&district=surco&sort=revenue`
- [ ]  No results state: "No se encontraron locales con estos filtros" with clear filters link
- [ ]  Result count shown: "Mostrando 3 de 5 locales"

---

### 2.3 Toggle Facility Active/Inactive

**Route:** Facility card "⋯" menu or facility detail

**Priority:** P0

#### Behavior

Org admins can deactivate a facility (hides from player app, stops accepting bookings) or reactivate it. This is a soft toggle, not a delete.

#### Acceptance Criteria

- [ ]  "Desactivar" option in facility card "⋯" menu for active facilities
- [ ]  "Reactivar" option for inactive facilities
- [ ]  Deactivate triggers confirmation dialog: "¿Desactivar [Facility Name]? Este local dejará de aparecer en la app de jugadores y no aceptará nuevas reservas. Las reservas existentes no se cancelarán."
- [ ]  Confirm → API call → optimistic UI update → card changes to inactive style (75% opacity, gray header)
- [ ]  Reactivate → no confirmation needed → API call → card returns to active style
- [ ]  Toast on success: "[Facility Name] desactivado" / "[Facility Name] reactivado"
- [ ]  Only `org_admin` role can toggle status (button hidden for other roles)
- [ ]  Facilities with pending bookings show warning count in deactivation dialog: "Este local tiene N reservas pendientes"

#### API

```tsx
org.updateFacilityStatus.mutate({
  facilityId: string,
  isActive: boolean,
})
// Validates: user is org_admin for this org
// Updates: facilities.is_active + facilities.updated_at
// Returns: { success: true, facility: { id, isActive } }
```

---

### 2.4 Org Switcher Dropdown

**Route:** OrgSidebar header component

**Priority:** P1 — Most MVP users will have 1 org, but the component needs to exist

#### Behavior

Dropdown in the sidebar header showing the current org with ability to switch. For single-org users, it displays the org name without dropdown functionality.

#### Acceptance Criteria

- [ ]  Sidebar header shows: org logo (or initials fallback) + org name + chevron icon
- [ ]  Single org user: displays org name, chevron hidden or disabled, no dropdown
- [ ]  Multi-org user: click opens dropdown listing all orgs the user belongs to
- [ ]  Each dropdown item shows: org logo/initials + org name + role badge ("Admin" / "Manager")
- [ ]  Current org has checkmark indicator
- [ ]  Click different org → navigate to `/org/[newOrgSlug]/facilities`
- [ ]  Dropdown closes on selection or outside click
- [ ]  Org list loaded from `organization_members` WHERE `user_id = currentUser`
- [ ]  Loading state: skeleton while fetching orgs

#### API

```tsx
user.getOrganizations.query()
// Returns: { id, name, slug, logoUrl, role }[]
// Sorted alphabetically by name
```

---

### 2.5 Org Profile Settings

**Route:** `/org/[slug]/settings`

**Priority:** P1

**Reference:** [Dashboard: Organization Settings screen](https://www.notion.so/Dashboard-Organization-Settings-screen-30a8722b044f819e8d43d9f54d54aa82?pvs=21) — Tab 1 only

#### Behavior

The org settings page has tabs. **Flow 2 only owns the "Organización" (profile) tab.** The "Equipo" tab is Flow 3, "Facturación" is 2.6, and deeper settings are Flow 9.

#### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Logo | Image upload | No | PNG/JPG, max 2MB, 80×80 display |
| Nombre de la Organización | Text | Yes | 2-100 chars |
| Descripción | Textarea | No | Max 500 chars |
| Email de contacto | Email | Yes | Valid email format |
| Teléfono | Tel | No | Peruvian format or E.164 |

#### Acceptance Criteria

- [ ]  Tab navigation: "Organización" (active, this flow), "Equipo" (Flow 3), "Facturación" (2.6)
- [ ]  Form pre-filled with current org data on page load
- [ ]  Logo upload: click to upload or drag-and-drop, preview before save
- [ ]  Logo fallback: initials on `gray-800` background when no logo
- [ ]  Client-side validation on all fields before submit
- [ ]  "Guardar Cambios" button disabled until form is dirty (something changed)
- [ ]  Save → API call → toast: "Cambios guardados" → button returns to disabled
- [ ]  Error on save → toast: "No se pudieron guardar los cambios. Intenta de nuevo."
- [ ]  Only `org_admin` can edit. `facility_manager` sees read-only view or is redirected
- [ ]  Unsaved changes warning if navigating away: "Tienes cambios sin guardar. ¿Salir sin guardar?"

#### API

```tsx
org.get.query({ orgSlug: string })
// Returns: Organization { id, name, description, contactEmail, phone, logoUrl }

org.update.mutate({
  orgSlug: string,
  name?: string,
  description?: string,
  contactEmail?: string,
  phone?: string,
})
// Validates: user is org_admin
// Returns: updated Organization

org.uploadLogo.mutate({ orgSlug: string, file: File })
// Uploads to Supabase Storage → bucket: org-logos/[orgId].png
// Updates organizations.logo_url
// Returns: { logoUrl: string }
```

---

### 2.6 Billing Tab Stub

**Route:** `/org/[slug]/settings` → Facturación tab

**Priority:** P2 — Placeholder only

#### Behavior

A "coming soon" placeholder tab. No real billing functionality for MVP.

#### Acceptance Criteria

- [ ]  Tab labeled "Facturación" with amber "Próximamente" badge
- [ ]  Tab content shows: credit card icon (gray), "Facturación y Suscripción" heading, "Estás en el beta gratuito. Cuando lancemos planes de pago, aquí podrás gestionar tu suscripción." message
- [ ]  "Beta Gratuito" pill/button in disabled style
- [ ]  No interactive elements beyond the tab itself
- [ ]  Controlled by feature flag: `org.billingEnabled` (default `false`)
- [ ]  When `billingEnabled: true` (future): show plan card, usage, payment method, invoices

---

### 2.7 Empty State — No Facilities

**Route:** `/org/[slug]/facilities`

**Priority:** P0 — First thing a new org owner sees

#### Behavior

When an org has zero facilities, the KPIs show zeros and the facility grid is replaced with an illustrated empty state prompting the user to add their first facility.

#### Acceptance Criteria

- [ ]  KPI cards show "0" for all metrics (no trend indicators)
- [ ]  Instead of facility grid, show centered empty state:
    - Icon or illustration (building/court themed)
    - "Aún no tienes locales" heading
    - "Agrega tu primer local de pádel para empezar a gestionar canchas, reservas y más." description
    - "Agregar mi primer local" primary CTA button → Flow 4 (facility creation)
- [ ]  CTA button navigates to `/org/[slug]/facilities/new`
- [ ]  The "Agregar Local" button in the page header also works (same destination)
- [ ]  After creating first facility and returning, empty state is replaced by facility card

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 2.7 — Empty state | First thing a new org sees. Quick to build, validates page structure | 1-2h |
| 2 | 2.1 — Facilities overview (KPIs + cards) | Core landing page. Biggest piece of work | 6-8h |
| 3 | 2.2 — Search, filter, sort | Enhances the overview. Can be added incrementally | 3-4h |
| 4 | 2.3 — Toggle facility active/inactive | Small but important operational action | 2h |
| 5 | 2.4 — Org switcher | P1. Simple for single-org, more work for multi-org | 2-3h |
| 6 | 2.5 — Org profile settings | P1. Standard CRUD form with logo upload | 4-5h |
| 7 | 2.6 — Billing stub | P2. Placeholder only, 30 minutes of work | 30 min |

**Total estimate:** ~19-25 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/
│   ├── facilities/
│   │   └── page.tsx                  # 2.1, 2.2, 2.7 — Main facilities overview
│   └── settings/
│       └── page.tsx                  # 2.5, 2.6 — Org settings tabs
├── components/
│   ├── org/
│   │   ├── OrgKpiCards.tsx            # 2.1 — KPI stats row
│   │   ├── FacilityCard.tsx           # 2.1 — Individual facility card
│   │   ├── FacilityGrid.tsx           # 2.1 — Grid layout with loading/empty states
│   │   ├── FacilityFilters.tsx        # 2.2 — Search, filter, sort bar
│   │   ├── FacilityEmptyState.tsx     # 2.7 — No facilities illustration
│   │   ├── OrgSwitcher.tsx            # 2.4 — Sidebar org dropdown
│   │   ├── OrgProfileForm.tsx         # 2.5 — Profile edit form
│   │   ├── LogoUpload.tsx             # 2.5 — Image upload with preview
│   │   └── BillingStub.tsx            # 2.6 — Coming soon placeholder
│   └── ui/
│       ├── ConfirmDialog.tsx           # 2.3 — Reusable confirmation modal
│       └── StatusBadge.tsx             # 2.1 — Active/Inactive badge

packages/api/src/router/
├── org.ts                              # org.getStats, org.getFacilities, org.update, etc.
└── user.ts                             # user.getOrganizations (for switcher)
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 1 — Auth + org membership validation | 🔲 In progress | Everything (user must be logged in and in an org) |
| `organizations` table | ✅ Exists | — |
| `facilities` table | ✅ Exists | — |
| `courts` table | ✅ Exists | Court count in cards |
| `bookings` table | ✅ Exists | KPI stats (can show 0 if no bookings yet) |
| Supabase Storage | 🔲 Not configured | 2.5 logo upload only. Can defer — initials fallback works |
| Flow 4 — Facility creation | 🔲 Not started | 2.7 CTA links to it. Button can exist, destination can 404 until Flow 4 |

---

## Testing Checklist

- [ ]  **New org, no facilities:** Login → see KPIs at zero → empty state with CTA
- [ ]  **Org with facilities:** Login → KPIs populated → facility cards in grid
- [ ]  **Search:** Type facility name → grid filters in real-time
- [ ]  **Filter by status:** Toggle Activos/Inactivos → correct facilities shown
- [ ]  **Filter by district:** Select district → only matching facilities
- [ ]  **Sort:** Change sort → cards reorder correctly
- [ ]  **Combined filters:** Search + status + district → correct intersection
- [ ]  **Clear filters:** Click "Limpiar filtros" → all filters reset
- [ ]  **Deactivate facility:** ⋯ menu → Desactivar → confirm → card updates to inactive
- [ ]  **Reactivate facility:** ⋯ menu → Reactivar → card returns to active
- [ ]  **Org switcher (single org):** Shows org name, no dropdown action
- [ ]  **Org switcher (multi org):** Dropdown lists orgs, click switches context
- [ ]  **Edit org profile:** Change name → save → toast → refreshed data
- [ ]  **Logo upload:** Upload PNG → preview shown → save → logo appears in sidebar
- [ ]  **Billing tab:** Click → see "coming soon" stub
- [ ]  **Access control:** `facility_manager` cannot access org settings
- [ ]  **Responsive:** Cards reflow correctly on tablet and mobile widths
- [ ]  **URL persistence:** Apply filters → copy URL → paste in new tab → same filters applied

---

## Definition of Done

- [ ]  Facilities overview page loads with KPIs and facility cards
- [ ]  Empty state shown for orgs with no facilities
- [ ]  Search, filter, and sort work correctly with URL persistence
- [ ]  Facility active/inactive toggle works with confirmation dialog
- [ ]  Org switcher shows current org (dropdown for multi-org users)
- [ ]  Org profile tab allows editing name, description, contact info
- [ ]  Billing tab shows "coming soon" stub
- [ ]  Loading skeletons for KPIs and cards
- [ ]  Error states with retry for failed API calls
- [ ]  Only `org_admin` can edit org settings and toggle facility status
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows