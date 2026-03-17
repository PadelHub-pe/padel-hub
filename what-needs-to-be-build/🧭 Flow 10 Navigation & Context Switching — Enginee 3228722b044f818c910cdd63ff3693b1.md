# 🧭 Flow 10: Navigation & Context Switching — Engineering Task

The navigation shell that ties the entire dashboard together. This flow owns the **structural skeleton** — sidebars, switchers, transitions, breadcrumbs, and deep linking. Every other flow's UI lives inside this navigation container.

---

## Context & Scope

**What Flow 10 owns:** The two-level sidebar architecture (org sidebar + facility sidebar), facility switcher, navigation links, transitions between org and facility contexts, breadcrumbs, sign out, keyboard shortcuts, and deep linking.

**What Flow 10 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 2.4 | Org switcher dropdown (for multi-org users) | Org switching is an org-level concern |
| Flow 3.7 | Role-based nav item visibility (`usePermission()` hook) | Which links appear is an RBAC decision; Flow 10 renders them |
| Flow 3.8 | Facility scoping — which facilities appear in the switcher | The switcher renders what RBAC provides |
| Flow 1.8 | Auth redirects (unauthenticated → login, no org → dead-end) | Middleware handles auth; Flow 10 handles post-auth navigation |

**The two-level sidebar concept:**

The dashboard has two distinct sidebar states based on context:

```
┌─────────────────────┐     ┌─────────────────────┐
│  ORG SIDEBAR           │     │  FACILITY SIDEBAR      │
│                       │     │                       │
│  [Org Switcher]       │     │  [← Back to Org]      │
│  ─────────────────── │     │  [Facility Switcher]  │
│  🏢 Locales (overview) │     │  ─────────────────── │
│  ⚙️ Configuración     │     │  📊 Dashboard         │
│  ─────────────────── │     │  🎾 Canchas          │
│                       │     │  📖 Reservas         │
│  [User avatar + name] │     │  📅 Calendario       │
│  [Sign out]           │     │  ⏰ Horarios         │
└─────────────────────┘     │  💰 Precios          │
                              │  ⚙️ Configuración     │
  For: org_admin only         │  ─────────────────── │
  Route: /org/[slug]/*        │  [User avatar + name] │
                              │  [Sign out]           │
                              └─────────────────────┘
                              
                                For: all 3 roles
                                Route: /org/[slug]/f/[facilitySlug]/*
                                (staff sees fewer links per Flow 3.7)
```

---

## Prerequisites

- Flow 1 (Auth) — user is authenticated, session valid
- Flow 1.7 — OrgContext loaded with role, facilityIds
- Flow 3.7 — `usePermission()` hook determines visible nav items
- Flow 3.8 — facility scoping determines which facilities appear in switcher

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 10.1 | Org-view sidebar navigation | OrgSidebar component | P0 |
| 10.2 | Facility-view sidebar navigation | FacilitySidebar component | P0 |
| 10.3 | Facility switcher (within org) | FacilitySwitcher component | P0 |
| 10.4 | Transition: org-view → facility-view | Click facility card / switcher | P0 |
| 10.5 | Transition: facility-view → org-view | "← Volver a Organización" link | P0 |
| 10.6 | Sign out | Sidebar footer button | P0 |
| 10.7 | Deep linking (direct URL access) | Any route | P0 |
| 10.8 | Breadcrumbs | Main content header | P1 |

**Changes from original:**

- **Removed** org switcher (10.1 original) → delegated to Flow 2.4
- **Renamed** what was 10.3/10.4 (org/facility sidebar nav) to be the first two items — they're the structural foundation
- **Added 10.8 — Breadcrumbs.** Needed for orientation in nested routes
- **Clarified** transitions as distinct sub-flows — org→facility and facility→org have different behavior

---

## Sub-flow Specifications

---

### 10.1 Org-View Sidebar Navigation

**Component:** `OrgSidebar`

**Priority:** P0

**Access:** `org_admin` only (managers and staff go directly to facility view)

#### Sidebar Anatomy

```
┌────────────────────────┐
│  [Org Switcher]  (Flow 2.4) │
│  ──────────────────────  │
│                            │
│  GENERAL                   │
│  🏢 Locales              │  ← /org/[slug]/facilities
│                            │
│  CONFIGURACIÓN              │
│  ⚙️ Organización          │  ← /org/[slug]/settings
│                            │
│  ──────────────────────  │
│  [👤 Luis]                │
│  [Cerrar Sesión]           │
└────────────────────────┘
```

#### Nav Items

| Section | Item | Route | Icon |
| --- | --- | --- | --- |
| General | Locales | `/org/[slug]/facilities` | 🏢 |
| Configuración | Organización | `/org/[slug]/settings` | ⚙️ |

#### Acceptance Criteria

- [ ]  Sidebar renders with org switcher at top (Flow 2.4 component)
- [ ]  Navigation sections with labeled groups ("General", "Configuración")
- [ ]  Active nav item highlighted with `primary-50` bg + `primary-600` text + left border accent
- [ ]  Inactive items: `gray-600` text, `hover:gray-50` bg
- [ ]  User section at bottom: avatar (or initials), display name, role badge
- [ ]  "Cerrar Sesión" button at very bottom
- [ ]  Only visible to `org_admin` — managers and staff never see the org sidebar
- [ ]  Sidebar width: 256px (w-64)
- [ ]  Collapsible on smaller screens (hamburger menu for tablet)
- [ ]  Smooth transition animation when collapsing/expanding

---

### 10.2 Facility-View Sidebar Navigation

**Component:** `FacilitySidebar`

**Priority:** P0

**Access:** All three roles (items filtered by role per Flow 3.7)

#### Sidebar Anatomy

```
┌────────────────────────┐
│  [← Volver a Org]  (admin) │  ← Only for org_admin (10.5)
│  [Facility Switcher]       │  ← (10.3)
│  ──────────────────────  │
│                            │
│  GENERAL                   │
│  📊 Dashboard              │  ← admin + manager
│  🎾 Canchas               │  ← admin + manager
│                            │
│  OPERACIONES               │
│  📖 Reservas              │  ← all 3 roles
│  📅 Calendario            │  ← all 3 roles
│                            │
│  CONFIGURACIÓN              │
│  ⏰ Horarios              │  ← admin + manager
│  💰 Precios               │  ← admin + manager
│  ⚙️ Configuración         │  ← admin + manager
│                            │
│  ──────────────────────  │
│  [👤 Luis]                │
│  [Cerrar Sesión]           │
└────────────────────────┘
```

#### Nav Items by Role

| Section | Item | Route | Admin | Manager | Staff |
| --- | --- | --- | --- | --- | --- |
| General | Dashboard | `.../f/[slug]/dashboard` | ✅ | ✅ | ❌ |
| General | Canchas | `.../f/[slug]/courts` | ✅ | ✅ | ❌ |
| Operaciones | Reservas | `.../f/[slug]/bookings` | ✅ | ✅ | ✅ |
| Operaciones | Calendario | `.../f/[slug]/calendar` | ✅ | ✅ | ✅ |
| Configuración | Horarios | `.../f/[slug]/schedule` | ✅ | ✅ | ❌ |
| Configuración | Precios | `.../f/[slug]/pricing` | ✅ | ✅ | ❌ |
| Configuración | Configuración | `.../f/[slug]/settings` | ✅ | ✅ | ❌ |

**Staff sees only:** Reservas + Calendario (the "Operaciones" section). No Dashboard, no Canchas, no Configuración section at all. Clean, focused sidebar for daily operations.

#### Acceptance Criteria

- [ ]  "← Volver a Organización" link at top (only for `org_admin`)
- [ ]  Facility switcher below back link (10.3)
- [ ]  Nav sections: "General", "Operaciones", "Configuración"
- [ ]  Items filtered by role using `usePermission()` from Flow 3.7
- [ ]  Staff sees only "Operaciones" section with Reservas + Calendario
- [ ]  Empty sections hidden entirely (staff doesn't see "General" or "Configuración" headers)
- [ ]  Active item styling matches org sidebar (primary accent)
- [ ]  User section at bottom with avatar, name, role badge
- [ ]  Sign out button at bottom
- [ ]  Same width (256px) and collapse behavior as org sidebar

---

### 10.3 Facility Switcher

**Component:** `FacilitySwitcher`

**Priority:** P0

**Reference:** [Component: Facility Switcher](https://www.notion.so/Component-Facility-Switcher-30a8722b044f81998fb7d1fa5369a0dc?pvs=21)

#### Collapsed State (Default)

```
┌──────────────────────┐
│  [██] Trigal              │
│       Surco, Lima     ▼  │
└──────────────────────┘
```

#### Expanded Dropdown

```
┌──────────────────────┐
│  OnePadel          BETA │  ← Org name + badge
│  ──────────────────── │
│  TUS LOCALES             │
│  [██] Trigal         ✓  │  ← Current (checkmark)
│       Surco              │
│  [██] Olgín             │
│       Miraflores         │
│  [██] Orue              │
│       San Isidro         │
│  ──────────────────── │
│  ⚙️ Org Settings      │  ← admin only
│  + Agregar Local        │  ← admin only
└──────────────────────┘
```

#### Acceptance Criteria

- [ ]  Collapsed: shows current facility avatar (gradient + initial), name, district, chevron
- [ ]  Click expands dropdown with org header, facility list, and role-based actions
- [ ]  Org header: org logo/name + "BETA" badge (while in beta)
- [ ]  Facility list: all accessible facilities for the user (from Flow 3.8 scoping)
- [ ]  Current facility has checkmark indicator + `primary-50` background
- [ ]  Each facility shows: gradient avatar, name, district
- [ ]  Click a different facility → navigate to `/org/[slug]/f/[newFacilitySlug]/dashboard`
- [ ]  Preserves current page context when possible: if on `/bookings`, switch to same page on new facility
- [ ]  `org_admin` sees: all facilities + "Org Settings" link + "Agregar Local" link
- [ ]  `facility_manager`: only assigned facilities, no org links
- [ ]  `staff`: only assigned facilities, no org links
- [ ]  Single-facility user: show facility name but no dropdown (chevron hidden or disabled)
- [ ]  Dropdown closes on outside click or Escape
- [ ]  Loading state while facilities load
- [ ]  Inactive facilities shown with gray styling and "Inactivo" badge (admin sees them, manager/staff don't)

#### Context Preservation Logic

```tsx
function handleFacilitySwitch(newSlug: string) {
  const currentPath = router.pathname; // e.g., /org/onepadel/f/trigal/bookings
  const currentPage = currentPath.split('/').pop(); // 'bookings'
  
  // Try to navigate to same page on new facility
  const newPath = `/org/${orgSlug}/f/${newSlug}/${currentPage}`;
  
  // If the page doesn't exist for this role, fall back to dashboard
  router.push(newPath).catch(() => {
    router.push(`/org/${orgSlug}/f/${newSlug}/dashboard`);
  });
}
```

---

### 10.4 Transition: Org-View → Facility-View

**Priority:** P0

#### Trigger Points

- Click facility card on org facilities overview (Flow 2.1)
- Click facility in switcher dropdown (10.3)
- Click "View Dashboard" on any facility reference
- Deep link to any `/org/[slug]/f/[facilitySlug]/*` URL (10.7)

#### Behavior

1. User is on org-view (`/org/[slug]/facilities`)
2. Clicks a facility card or switcher item
3. Navigates to `/org/[slug]/f/[facilitySlug]/dashboard` (or specific page)
4. Sidebar transforms from OrgSidebar → FacilitySidebar
5. Facility context loaded: current facility data, courts, schedule

#### Acceptance Criteria

- [ ]  Clicking facility card navigates to facility dashboard
- [ ]  Sidebar transitions from org-view to facility-view smoothly
- [ ]  Facility context (name, district) reflected in sidebar header
- [ ]  Active nav item set to "Dashboard" by default after transition
- [ ]  URL updates to include facility slug
- [ ]  Browser back button returns to org facilities overview
- [ ]  Transition works from any org-view page (facilities, settings)
- [ ]  If facility is in incomplete setup state → navigate to setup wizard instead of dashboard (Flow 4.7)

---

### 10.5 Transition: Facility-View → Org-View

**Priority:** P0

**Access:** `org_admin` only (managers and staff have no way to reach org-view)

#### Trigger

- "← Volver a Organización" link at top of facility sidebar
- Clicking org name in facility switcher dropdown
- "Org Settings" link in facility switcher

#### Behavior

1. User is on facility-view (`/org/[slug]/f/[facilitySlug]/bookings`)
2. Clicks "← Volver a Organización"
3. Navigates to `/org/[slug]/facilities`
4. Sidebar transforms from FacilitySidebar → OrgSidebar

#### Acceptance Criteria

- [ ]  "← Volver a Organización" link visible at top of facility sidebar for `org_admin`
- [ ]  Link not visible for `facility_manager` or `staff`
- [ ]  Click navigates to org facilities overview
- [ ]  Sidebar transitions back to org-view
- [ ]  Browser back button returns to the facility page they were on
- [ ]  "Org Settings" link in switcher also returns to org-view (settings page)

---

### 10.6 Sign Out

**Priority:** P0

**Access:** All three roles

#### Behavior

1. User clicks "Cerrar Sesión" in sidebar footer
2. Confirmation: "¿Cerrar sesión?" (simple, no scary warnings)
3. Confirm → session destroyed via Better-Auth → redirect to `/login`

#### Acceptance Criteria

- [ ]  "Cerrar Sesión" button in sidebar footer (both org and facility sidebar)
- [ ]  Click shows lightweight confirmation (not a full modal — a popover or simple dialog)
- [ ]  Confirm → session cookie cleared → redirect to `/login`
- [ ]  All tabs logged out (via BroadcastChannel or storage event, if feasible)
- [ ]  If sign-out fails (network error) → show error toast, stay on page, allow retry
- [ ]  After sign out, back button doesn't return to dashboard (session is gone)
- [ ]  Sign out works from any page in the dashboard

#### API

```tsx
// Better-Auth built-in
await signOut();
// Clears session cookie, redirects to /login
```

---

### 10.7 Deep Linking (Direct URL Access)

**Priority:** P0

#### Behavior

Users should be able to bookmark or share any dashboard URL and navigate to it directly. The URL is the **source of truth** for the current context: org, facility, and page.

#### URL Structure

```
/login                                          ← Public (auth page)
/register?token=xxx                             ← Public (invite acceptance)
/org                                            ← Redirects to first org
/org/[orgSlug]/facilities                       ← Org facilities overview
/org/[orgSlug]/settings                         ← Org settings
/org/[orgSlug]/f/[facilitySlug]/dashboard       ← Facility dashboard
/org/[orgSlug]/f/[facilitySlug]/courts          ← Courts list
/org/[orgSlug]/f/[facilitySlug]/courts/[id]     ← Court detail
/org/[orgSlug]/f/[facilitySlug]/bookings        ← Bookings list
/org/[orgSlug]/f/[facilitySlug]/bookings/[id]   ← Booking detail
/org/[orgSlug]/f/[facilitySlug]/calendar        ← Calendar
/org/[orgSlug]/f/[facilitySlug]/schedule        ← Schedule
/org/[orgSlug]/f/[facilitySlug]/pricing         ← Pricing
/org/[orgSlug]/f/[facilitySlug]/settings        ← Facility settings
/org/[orgSlug]/f/[facilitySlug]/setup           ← Setup wizard
```

#### Resolution Chain

When a user navigates to any URL, the system resolves context in order:

```
1. Is user authenticated? No → redirect /login
2. Does the org exist? No → 404
3. Is user a member of this org? No → redirect /org (their actual org)
4. Is there a facility slug? No → render org-view page
5. Does the facility exist in this org? No → redirect /org/[slug]/facilities
6. Can user access this facility? No → redirect to first accessible facility
7. Can user access this page based on role? No → redirect to role-appropriate default
8. Render the page
```

#### Default Landing by Role

| Role | Login lands on | Rationale |
| --- | --- | --- |
| `org_admin` | `/org/[slug]/facilities` | See all facilities at a glance |
| `facility_manager` | `/org/[slug]/f/[firstFacility]/dashboard` | Go straight to their facility |
| `staff` | `/org/[slug]/f/[firstFacility]/bookings` | Go straight to today's bookings (their core task) |

#### Acceptance Criteria

- [ ]  Every page has a unique, bookmarkable URL
- [ ]  Sharing a URL with a teammate who has access → they see the same page
- [ ]  Sharing a URL with someone without access → graceful redirect (not error)
- [ ]  Browser back/forward buttons work correctly through all transitions
- [ ]  Page refresh preserves the exact context (org, facility, page, query params)
- [ ]  URL params (filters, pagination, date, view mode) preserved across refresh
- [ ]  `org_admin` landing: org facilities overview
- [ ]  `facility_manager` landing: first assigned facility dashboard
- [ ]  `staff` landing: first assigned facility bookings
- [ ]  Invalid org slug → 404 page
- [ ]  Invalid facility slug → redirect to org facilities overview
- [ ]  Staff accessing config routes (`/courts`, `/schedule`, `/pricing`) → redirect to `/bookings`

---

### 10.8 Breadcrumbs

**Priority:** P1

#### Behavior

Breadcrumbs appear at the top of the main content area (not in the sidebar), showing the hierarchical path to the current page.

#### Examples

```
Org Facilities Overview:   OnePadel > Locales
Facility Dashboard:        OnePadel > Trigal > Dashboard
Court Detail:              OnePadel > Trigal > Canchas > Cancha 1
Booking Detail:            OnePadel > Trigal > Reservas > PH-2026-A7K2
Org Settings:              OnePadel > Configuración
Facility Settings:         OnePadel > Trigal > Configuración
```

#### Acceptance Criteria

- [ ]  Breadcrumbs render at top of main content area
- [ ]  Each segment is clickable and navigates to that level
- [ ]  Org name links to `/org/[slug]/facilities`
- [ ]  Facility name links to `.../f/[slug]/dashboard`
- [ ]  Current page is the last segment (not clickable, muted color)
- [ ]  Responsive: on mobile, show only last 2 segments with "…" for earlier ones
- [ ]  Breadcrumbs generated from URL structure + loaded entity names (not hardcoded)
- [ ]  Staff breadcrumbs start at facility level (they don't have org-level context)

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 10.7 — Deep linking + URL structure | Foundation. Routing + resolution chain must exist before sidebars render correctly | 4-5h |
| 2 | 10.2 — Facility sidebar | Most users land here. The primary navigation container | 4-5h |
| 3 | 10.3 — Facility switcher | Lives inside facility sidebar. Core context-switching UI | 4-5h |
| 4 | 10.1 — Org sidebar | Admin-only. Simpler than facility sidebar (fewer items) | 2-3h |
| 5 | 10.4 + 10.5 — Transitions (both directions) | Connecting org and facility views. Depends on both sidebars existing | 2-3h |
| 6 | 10.6 — Sign out | Simple but essential. Better-Auth integration | 1h |
| 7 | 10.8 — Breadcrumbs | P1. Orientation aid. Builds on URL structure from 10.7 | 2-3h |

**Total estimate:** ~19-25 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/
│   ├── layout.tsx                             # Root dashboard layout — decides org vs facility sidebar
│   ├── org/[orgSlug]/
│   │   ├── layout.tsx                         # Org layout — renders OrgSidebar
│   │   └── f/[facilitySlug]/
│   │       └── layout.tsx                     # Facility layout — renders FacilitySidebar
├── components/
│   ├── navigation/
│   │   ├── OrgSidebar.tsx                     # 10.1 — Org-level sidebar
│   │   ├── FacilitySidebar.tsx                # 10.2 — Facility-level sidebar
│   │   ├── FacilitySwitcher.tsx               # 10.3 — Switcher dropdown
│   │   ├── SidebarNavItem.tsx                 # Shared nav link component
│   │   ├── SidebarNavSection.tsx              # Shared section header ("GENERAL", etc.)
│   │   ├── SidebarUserFooter.tsx              # Shared user section + sign out
│   │   ├── Breadcrumbs.tsx                    # 10.8 — Path breadcrumbs
│   │   └── MobileNav.tsx                      # Hamburger menu for mobile/tablet
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 1 (Auth) — middleware + session | 🔲 | 10.7 resolution chain needs auth check |
| Flow 1.7 — OrgContext in layout | 🔲 | Both sidebars need org + role data from context |
| Flow 2.4 — Org switcher component | 🔲 | 10.1 renders it in org sidebar header |
| Flow 3.7 — `usePermission()` hook | 🔲 | 10.2 filters nav items by role |
| Flow 3.8 — facility scoping | 🔲 | 10.3 switcher shows only accessible facilities |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| User with 1 facility | Facility switcher shows current facility but no dropdown (chevron hidden). No need to switch |
| Manager loses access to current facility (admin changes scope) | Next API call returns 403 → redirect to first remaining accessible facility. If none left → dead-end page |
| Deep link to facility user doesn't have access to | Redirect to first accessible facility with toast: "No tienes acceso a este local" |
| Deep link to page staff can't access (e.g., /courts) | Redirect to /bookings (staff's default) |
| Deep link with invalid org slug | 404 page with link to home |
| Deep link with invalid facility slug | Redirect to org facilities overview (for admin) or first facility (for manager/staff) |
| Browser back after sign out | Session gone → middleware redirects to /login. No cached dashboard content shown |
| Facility switcher while on a page-specific route (e.g., /courts/[id]) | Navigate to same page type on new facility: /courts (list, not detail). Detail pages don't transfer across facilities |
| Sidebar on tablet (768-1024px) | Sidebar collapses to icon-only mode. Hover expands with tooltip labels |
| Sidebar on mobile (<768px) | Sidebar hidden. Hamburger menu in top bar opens overlay sidebar |
| Admin switches between org-view and facility-view rapidly | No state leaks. Each view loads fresh context. No stale facility data in org view or vice versa |

---

## Testing Checklist

### Org Sidebar

- [ ]  Org switcher renders at top (admin only)
- [ ]  Nav items: Locales, Configuración
- [ ]  Active item highlighted correctly
- [ ]  User section shows avatar + name + role badge
- [ ]  Sign out button present
- [ ]  Sidebar not visible for manager or staff

### Facility Sidebar

- [ ]  "← Volver a Organización" visible for admin, hidden for manager/staff
- [ ]  Facility switcher shows current facility
- [ ]  Admin sees all nav items (7 items across 3 sections)
- [ ]  Manager sees all nav items (same as admin for assigned facilities)
- [ ]  Staff sees only Reservas + Calendario (2 items, 1 section)
- [ ]  Empty sections don't render headers

### Facility Switcher

- [ ]  Shows all accessible facilities with current marked
- [ ]  Switch facility → navigates to same page on new facility
- [ ]  Admin sees "Org Settings" and "Agregar Local" links
- [ ]  Manager/staff don't see org links
- [ ]  Single-facility user: no dropdown behavior
- [ ]  Inactive facilities visible to admin only (grayed)

### Transitions

- [ ]  Org → Facility: click card → sidebar changes → correct URL
- [ ]  Facility → Org: click back link → sidebar changes → org overview
- [ ]  Browser back/forward works correctly through transitions
- [ ]  Incomplete setup facility → redirects to wizard

### Sign Out

- [ ]  Click → confirm → session cleared → redirected to /login
- [ ]  Works from any page
- [ ]  Back button after sign out doesn't show dashboard

### Deep Linking

- [ ]  Every page has a unique bookmarkable URL
- [ ]  Page refresh preserves full context
- [ ]  Admin lands on org facilities overview
- [ ]  Manager lands on first facility dashboard
- [ ]  Staff lands on first facility bookings
- [ ]  Invalid org → 404
- [ ]  Invalid facility → redirect
- [ ]  Unauthorized facility → redirect to accessible one
- [ ]  Unauthorized page (staff → /courts) → redirect to /bookings

### Breadcrumbs

- [ ]  Show correct path for every page
- [ ]  Each segment clickable (except current)
- [ ]  Responsive on mobile (truncated)

### Responsive

- [ ]  Desktop (>1024px): full sidebar
- [ ]  Tablet (768-1024px): icon-only sidebar with hover expand
- [ ]  Mobile (<768px): hamburger menu with overlay

---

## Definition of Done

- [ ]  Two-level sidebar architecture (org + facility) with smooth transitions
- [ ]  Facility switcher with context preservation when switching
- [ ]  Role-based nav item filtering (admin=full, manager=config+ops, staff=ops)
- [ ]  Transitions between org and facility views work in both directions
- [ ]  Sign out clears session and redirects to login
- [ ]  Every page has a unique, bookmarkable, shareable URL
- [ ]  Deep linking resolves correctly for all roles and edge cases
- [ ]  Default landing pages differ by role
- [ ]  Breadcrumbs show hierarchical path to current page
- [ ]  Responsive: works on desktop, tablet, and mobile
- [ ]  Browser back/forward works correctly throughout
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows