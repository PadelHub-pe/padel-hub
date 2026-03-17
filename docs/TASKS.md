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

### Flow 4: Facility Onboarding (11 tasks)

Schema migration (slug + geocoding), setup progress API, default operating hours, district autocomplete + geocoding, courts wizard redesign (individual CRUD + pricing), schedule wizard enhancement ("Aplicar a todos"), photos & amenities step, completion screen + activation gate, setup banner with progress, resume from correct step, slug auto-generation. 52 tests (setup: 37, slugify: 15).

### Flow 6: Schedule & Pricing (9 tasks)

Zone calculation utility, facility default pricing schema, enhanced operating hours editor (30-min increments, "Aplicar a todos", validation), peak period full CRUD (create/edit/delete with overlap detection, day shortcuts, max 5 limit), editable rate cards with facility defaults, court default/custom pricing system, revenue calculator (slider + monthly toggle), block time slots UI. 120 tests (schedule-utils: 48, schedule: 30, pricing: 42).

### Flow 7: Booking Management (7 tasks)

On-access status resolver, server-side price calculation, enhanced list API (multi-status, date range, sorting), cancel validations + state machine, comprehensive booking router tests (453 total), UI spec alignment, real dashboard stats. 143 tests (booking: 143).

### Flow 8: Calendar (7 tasks)

Calendar router fixes + tests, day view grid enhancements (zone backgrounds, blocked slots, court headers), booking block + popover polish, URL sync + keyboard shortcuts, legend/stats bar rework with zone colors + role-based display, week view enhancements (court dots, weekend bg, stripes, time indicator, quick booking), quick booking fixes + mini calendar dots. 474 total tests.

### Flow 9: Settings (7 tasks)

Phone column + account API extensions, profile tab (phone + avatar upload), password change modal, RBAC scoped settings tabs, facility team tab, unsaved changes warning + sidebar sync.

---

## Current

### Flow 10: Navigation & Context Switching (8 tasks)

Align existing sidebar architecture with spec, add missing navigation features (breadcrumbs, mobile nav, role-based landing, route guards).

**Reference:** `what-needs-to-be-build/🧭 Flow 10 Navigation...md`
**Technical Plan:** `docs/TECHNICAL_PLAN.md`

---

#### ~~TASK-10.01: Align sidebar nav items with spec~~ - [x] Done

**Type:** refactor | **Priority:** P0

Align org and facility sidebar navigation items with Flow 10 spec. Remove phantom routes, rename sections/labels.

**Org sidebar nav changes** (`org-sidebar-nav.tsx`):
- Remove `Resumen` item (route doesn't exist, `/org/[slug]` redirects to /facilities)
- Remove `Reservas` item (route `/org/[slug]/bookings` doesn't exist)
- Remove `Reportes` item (route `/org/[slug]/reports` doesn't exist)
- First section: add title "GENERAL", keep only `Locales`
- "CONFIGURACIÓN" section: rename `Ajustes` → `Organización`
- Remove now-unused icon components (DashboardIcon, BookingsIcon, ReportsIcon)

**Facility sidebar nav changes** (`facility-sidebar-nav.tsx`):
- First section: add title "GENERAL"
- Rename `RESERVAS` section → `OPERACIONES`
- Rename `Lista` item → `Reservas`
- Rename `Ajustes` item → `Configuración`
- Add `permission: "canConfigureFacility"` to `Dashboard` item (staff shouldn't see it)
- Add `permission: "canConfigureFacility"` to `Configuración/Ajustes` item (staff shouldn't see it)
- Verify: staff sees ONLY "OPERACIONES" section with Reservas + Calendario

**Files:** `org-sidebar-nav.tsx`, `facility-sidebar-nav.tsx`
**Verify:** Login as all 3 seed users, confirm correct nav items per role

---

#### TASK-10.02: Add "← Volver a Organización" link + facility sidebar fixes

**Type:** feature | **Priority:** P0

Add the back-to-org link at the top of the facility sidebar, visible only for `org_admin`.

**Changes:**
- In `facility-sidebar.tsx`: add a `← Volver a Organización` link above the FacilitySwitcher
  - Only visible when `userRole === "org_admin"`
  - Links to `/org/${organization.slug}/facilities`
  - Styling: `text-sm text-gray-400 hover:text-white` with left arrow icon
  - Small padding, border-bottom separating it from switcher
- Remove "Ajustes de organización" link from FacilitySwitcher dropdown (redundant with back link)
  - Keep "Agregar sede" for admin
  - Keep "Ajustes de sede" for all users

**Files:** `facility-sidebar.tsx`, `facility-switcher.tsx`
**Verify:** Visible for `owner@padelhub.pe`, hidden for `manager@` and `staff@`

---

#### TASK-10.03: Facility switcher enhancements ✅

**Type:** feature | **Priority:** P0

Three enhancements to the facility switcher dropdown:

1. **Context preservation** when switching facilities:
   - Extract the current page segment from pathname (e.g., `bookings`, `courts`, `schedule`)
   - Navigate to same page on new facility: `/org/[slug]/facilities/[newId]/[currentPage]`
   - For detail pages (e.g., `/courts/[id]`), navigate to the list page instead
   - Don't attempt to preserve pages that are facility-specific (e.g., `/setup`)

2. **Single-facility behavior**:
   - When `facilities.length === 1`: hide the chevron icon, disable dropdown trigger
   - Show facility info but no expand/collapse

3. **Inactive facility styling** (admin only):
   - Inactive facilities in the list get `opacity-50` + "Inactivo" badge (small gray badge)
   - Manager/staff don't see inactive facilities (already handled by RBAC in `getFacilities`)

**Files:** `facility-switcher.tsx`
**Depends on:** none

---

#### TASK-10.04: Sign out confirmation dialog ✅

**Type:** feature | **Priority:** P0

Replace direct sign-out with a lightweight confirmation popover.

**Changes:**
- Create a shared `SignOutButton` component (or inline in each sidebar)
- Click "Cerrar sesión" → shows popover: "¿Cerrar sesión?" with Cancel/Confirm buttons
- Use `Popover` from `@wifo/ui` (not a full Dialog — lightweight per spec)
- Confirm → `await signOut()` → `router.push("/login")`
- Error handling: if signOut fails, show toast "Error al cerrar sesión. Intenta de nuevo."
- Apply to both `org-sidebar.tsx` and `facility-sidebar.tsx`

**Files:** `org-sidebar.tsx`, `facility-sidebar.tsx` (or new shared `sign-out-button.tsx`)

---

#### TASK-10.05: Role-based landing pages + staff route guards ✅

- [x] Completed

**Type:** feature | **Priority:** P0

Two changes:

**1. Role-based default landing after login:**

In `app/org/page.tsx` (the `/org` redirect page):
- Currently: all roles → `/org/[slug]/facilities`
- New logic:
  - `org_admin` → `/org/[slug]/facilities` (no change)
  - `facility_manager` → `/org/[slug]/facilities/[firstFacilityId]` (facility dashboard)
  - `staff` → `/org/[slug]/facilities/[firstFacilityId]/bookings`
- Need to fetch facilities for non-admin roles to determine first facility
- If user has no accessible facilities → `/org/[slug]/facilities` (they'll see empty state)

**2. Staff route guards in facility layout:**

In `(facility-view)/facilities/[facilityId]/layout.tsx`:
- If `role === "staff"` and path includes `/courts`, `/schedule`, `/pricing`, or `/settings`:
  - Redirect to `../bookings` (staff's default page)
- This prevents staff from accessing config pages via direct URL

**Files:** `app/org/page.tsx`, `(facility-view)/facilities/[facilityId]/layout.tsx`
**Verify:** Login as each role, confirm correct landing. Try staff direct URL to /courts.

---

#### TASK-10.06: Breadcrumbs component

**Type:** feature | **Priority:** P1

Add breadcrumbs at the top of the main content area.

**Component:** `components/navigation/breadcrumbs.tsx`

**Behavior:**
- Reads URL segments + page-level props/context to build path
- Each segment is clickable except the last (current page)
- Examples:
  - Facilities list: `OnePadel > Locales`
  - Facility dashboard: `OnePadel > Trigal > Dashboard`
  - Court detail: `OnePadel > Trigal > Canchas > Cancha 1`
  - Booking detail: `OnePadel > Trigal > Reservas > PH-2026-A7K2`
- Staff breadcrumbs start at facility level (no org segment)
- Responsive: on mobile, show last 2 segments with "…" ellipsis

**Integration:**
- Add to org-view and facility-view layouts (above `{children}` in `<main>`)
- Org name from layout data (already fetched)
- Facility name from layout data (already fetched)
- Page name from URL segment mapping (hardcoded: `courts` → "Canchas", etc.)
- Entity names (court name, booking code) passed via page-level context or search params

**Files:** New `breadcrumbs.tsx`, modify both layout files
**Depends on:** TASK-10.01, TASK-10.02 (nav items must be final)

---

#### TASK-10.07: Mobile responsive navigation

**Type:** feature | **Priority:** P1

Make the sidebar responsive for tablet and mobile viewports.

**Desktop (>1024px):** Full sidebar (current behavior, no change)

**Tablet (768-1024px):**
- Sidebar collapses to narrow mode (icon-only, ~64px width)
- Hover/click expands to full sidebar temporarily (overlay, not push)
- Or: hide sidebar, show top bar with hamburger

**Mobile (<768px):**
- Sidebar completely hidden
- Top bar with: hamburger button (left), PadelHub logo (center), user avatar (right)
- Hamburger opens `Sheet` (from `@wifo/ui`) sliding from left
- Sheet content = existing sidebar content (same component, wrapped in Sheet)
- Sheet closes on outside click, Escape, or nav link click

**Implementation approach:**
- Create `MobileNav` wrapper component
- Use Tailwind responsive utilities: `hidden lg:flex` on sidebar, `flex lg:hidden` on mobile header
- Wrap existing sidebar content in a shared `SidebarContent` component
- Desktop: render `SidebarContent` in `<aside>`
- Mobile: render `SidebarContent` inside `<Sheet>` triggered by hamburger

**Files:** New `mobile-nav.tsx`, modify `org-sidebar.tsx`, `facility-sidebar.tsx`, both layouts
**Depends on:** TASK-10.01 through TASK-10.04 (sidebar content must be finalized)

---

#### TASK-10.08: 404 page + navigation edge cases

**Type:** feature | **Priority:** P1

Handle edge cases and error states in navigation.

**1. Custom 404 page:**
- Create `app/not-found.tsx` with PadelHub branding
- Message: "Página no encontrada" + link back to `/org`
- Simple, clean design matching sidebar dark theme

**2. Invalid org slug handling:**
- Current: redirects to first org. Per spec: show 404 for truly invalid slugs.
- Decision: keep current behavior (redirect to first org) — friendlier UX than 404
- Only show 404 if user has NO orgs at all (already redirects to `/no-organization`)

**3. Facility switcher: navigate away from detail pages correctly:**
- When on `/courts/[courtId]` and switching facility → go to `/courts` (list, not detail)
- When on `/bookings/[bookingId]` → go to `/bookings`
- When on `/setup` → go to facility root (dashboard)

**4. Back button behavior verification:**
- Verify: org→facility→back returns to org view
- Verify: sign out→back doesn't show dashboard
- Verify: facility switch→back returns to previous facility

**Files:** New `not-found.tsx`, update `facility-switcher.tsx`
**Depends on:** TASK-10.05
