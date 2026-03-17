# Technical Plan: Flow 10 — Navigation & Context Switching

## 1. Context

### What Exists Today

The two-level sidebar architecture is **already built**:

| Component | File | Status |
|-----------|------|--------|
| OrgSidebar | `app/org/_components/org-sidebar.tsx` | Built, needs spec alignment |
| OrgSidebarNav | `app/org/_components/org-sidebar-nav.tsx` | Built, nav items don't match spec |
| OrgSelector | `app/org/_components/org-selector.tsx` | Built, complete |
| FacilitySidebar | `(facility-view)/.../facility-sidebar.tsx` | Built, missing back link |
| FacilitySidebarNav | `(facility-view)/.../facility-sidebar-nav.tsx` | Built, nav items/sections don't match spec |
| FacilitySwitcher | `(facility-view)/.../facility-switcher.tsx` | Built, missing context preservation |
| usePermission hook | `hooks/use-permission.ts` | Complete |
| useFacilityContext | `hooks/use-facility-context.ts` | Complete |
| Route layouts | Various layout.tsx files | Complete, role-based redirects missing |

### What Doesn't Match the Spec

**Org Sidebar Nav (current → spec):**
- `Resumen` → **REMOVE** (no route, redirects to /facilities)
- `Locales` → Keep (move to "GENERAL" section)
- `Reservas` → **REMOVE** (route `/org/[slug]/bookings` doesn't exist)
- `Reportes` → **REMOVE** (route `/org/[slug]/reports` doesn't exist)
- `Ajustes` → Rename to `Organización`
- Section titles: add "GENERAL" header to first section

**Facility Sidebar Nav (current → spec):**
- First section (untitled) → Rename to "GENERAL"
- `RESERVAS` → Rename to "OPERACIONES"
- `Lista` → Rename to `Reservas`
- `Ajustes` → Rename to `Configuración`
- Staff sees Dashboard (shouldn't) — need permission on Dashboard item
- Settings missing permission check — staff shouldn't see it

**Missing features:**
1. "← Volver a Organización" link in facility sidebar (org_admin only)
2. Context preservation when switching facilities (keep same page)
3. Single-facility user: no dropdown in switcher
4. Sign out confirmation dialog
5. Role-based landing pages (manager → facility dashboard, staff → bookings)
6. Staff route guards (redirect `/courts`, `/schedule`, etc. → `/bookings`)
7. Breadcrumbs component
8. Mobile responsive nav (hamburger + sheet overlay)
9. 404 page for invalid org slugs

## 2. Architecture Decisions

### Keep, Don't Change

- **Dark sidebar theme** — Spec describes light styling (`primary-50` bg), but our dark sidebar (`bg-gray-900`) is consistent and polished. Keep it.
- **Active item: filled blue** — Spec says left border accent + light bg. Current `bg-blue-600 text-white` looks better on dark theme. Keep it.
- **Facility ID in routes** (not slug) — Spec mentions `facilitySlug` but our routing uses `facilityId` throughout all flows. Changing would require touching every facility route, every link, and every `useParams()` call. Not worth it for this flow.
- **Route group architecture** — `(org-view)` and `(facility-view)` as siblings under `[orgSlug]` is correct and matches the spec's two-level concept.

### New Components Needed

1. **`Breadcrumbs`** — New component in `components/navigation/breadcrumbs.tsx`. Reads URL segments + loaded entity names to render clickable path.
2. **`MobileNav`** — New component using the existing `Sheet` component from `@wifo/ui`. Wraps the existing sidebar content in a slide-over for mobile.
3. **`SignOutDialog`** — Small confirmation popover/dialog before signing out. Shared between both sidebars.

### No Schema or API Changes

Flow 10 is purely frontend. All data it needs is already available via existing tRPC queries:
- `org.getMyOrganizations()` — org list with roles
- `org.getFacilities()` — facility list (already RBAC-filtered)
- Session data — user name, email, image

## 3. Risk Assessment

**Low risk:**
- Nav item changes (rename, remove) — purely cosmetic, no data dependencies
- Breadcrumbs — additive, doesn't touch existing components
- Sign out dialog — wraps existing `signOut()` call

**Medium risk:**
- Role-based landing redirect — changes where users land after login. Must test all 3 roles.
- Staff route guards — could lock staff out if misconfigured. Need test with staff seed account.
- Mobile nav — responsive breakpoints could cause layout shift on existing pages.

**Mitigated by:**
- Seed data has all 3 roles (`owner@padelhub.pe`, `manager@padelhub.pe`, `staff@padelhub.pe`)
- All changes are in the web app only (no API changes, no schema changes)

## 4. Task Breakdown

See `docs/TASKS.md` for ordered tasks.

### Dependency Graph

```
TASK-10.01 (nav items alignment)
    └─→ No dependencies, can start immediately

TASK-10.02 (back link + facility sidebar fixes)
    └─→ No dependencies

TASK-10.03 (facility switcher enhancements)
    └─→ No dependencies

TASK-10.04 (sign out confirmation)
    └─→ No dependencies

TASK-10.05 (role-based landing + route guards)
    └─→ No dependencies, but should be after 10.01/10.02 for testing

TASK-10.06 (breadcrumbs)
    └─→ After 10.01-10.02 (nav items must be final)

TASK-10.07 (mobile responsive nav)
    └─→ After 10.01-10.04 (sidebar content must be final)

TASK-10.08 (404 page + edge cases)
    └─→ After 10.05 (redirect logic must be in place)
```

**Parallelizable:** 10.01 + 10.02 + 10.03 + 10.04 can all run in parallel.
