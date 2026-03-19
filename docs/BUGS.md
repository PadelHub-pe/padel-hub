# Bugs

Bug reports for PadelHub. Use `/report-bug [description]` to add new entries.

---

## BUG-001: Post-login redirect lands on 404 (`/org/[orgSlug]` has no page)

**Severity:** High
**Status:** Fixed
**Found in:** E2E smoke test S2 (Valid Login)
**Affected area:** web `apps/nextjs/src/app/org/[orgSlug]/`

### Description

After login, the browser lands on `/org/padel-group-lima` which returns 404. The login page pushes to `/org`, the server-side page redirects to `/org/{slug}/facilities`, but the client-side navigation stops at `/org/{slug}` instead of following through.

### Steps to Reproduce

1. Navigate to `http://localhost:3000/login`
2. Login as `owner@padelhub.pe` / `password123`
3. Observe the URL after login completes

### Expected Behavior

Browser should land on `/org/padel-group-lima/facilities` (org_admin role-based landing).

### Actual Behavior

Browser lands on `/org/padel-group-lima` which shows the 404 page ("Página no encontrada").

### Root Cause

There is no `page.tsx` at `apps/nextjs/src/app/org/[orgSlug]/`. The `[orgSlug]` segment has a `layout.tsx` but no page component. When the server-side `redirect()` in `apps/nextjs/src/app/org/page.tsx:52` fires during client-side navigation (`router.push("/org")`), the redirect chain doesn't complete — the browser resolves to the intermediate `/org/{slug}` path which has no page.

### Fix Recommendation

Add a `page.tsx` at `apps/nextjs/src/app/org/[orgSlug]/` that performs a server-side redirect to the role-based destination (same logic as `/org/page.tsx` but scoped to the specific org).

### Workaround

Navigate directly to `/org/padel-group-lima/facilities` instead of relying on the post-login redirect.

### Actual Fix

Created `apps/nextjs/src/app/org/[orgSlug]/page.tsx` — a server component that performs role-based redirect using the same logic as `/org/page.tsx` but scoped to the specific org slug from params:
- `org_admin` → `/org/{slug}/facilities`
- `facility_manager` → first accessible facility dashboard
- `staff` → first accessible facility bookings
- No matching org → falls back to `/org`

**Lesson learned:** In Next.js App Router, every dynamic route segment that users can land on (via redirect chains or direct navigation) needs a `page.tsx`. A `layout.tsx` alone is not enough — it will 404 without a page component.

---

## BUG-002: Hydration mismatch in facility sidebar (Radix UI ID conflict)

**Severity:** Medium
**Status:** Fixed
**Found in:** E2E smoke test S3 (Dashboard Loads)
**Affected area:** web `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/` sidebar components

### Description

The facility sidebar produces a React hydration mismatch error. Server-rendered Radix UI component IDs don't match client-generated IDs, causing a "1 Issue" badge in the Next.js dev overlay on every facility page.

### Steps to Reproduce

1. Login as `owner@padelhub.pe`
2. Navigate to any facility dashboard (e.g., `/org/padel-group-lima/facilities/{id}`)
3. Open browser console — observe hydration mismatch error
4. Check Next.js dev overlay badge — shows "0 errors, 1 issue"

### Expected Behavior

No hydration mismatch. Server and client render identical HTML attributes.

### Actual Behavior

Console error:
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
  + id="radix-_R_935ritpet5ritmlb_"
  - id="radix-_R_14d5ritpet5ritmlb_"
  + aria-controls="radix-_R_a35ritpet5ritmlb_"
  - aria-controls="radix-_R_18d5ritpet5ritmlb_"
```

### Root Cause

Two Radix UI components in the facility sidebar generate sequential auto-IDs that differ between SSR and client hydration:
1. **Facility switcher** (`DropdownMenuTrigger`) — `id` attribute mismatch
2. **Sign-out button** (`PopoverTrigger`) — `aria-controls` attribute mismatch

This happens when Radix's ID counter starts at a different value on server vs client, likely because the component tree shape differs (e.g., conditional rendering, different mount order, or components wrapped in client-only boundaries).

### Fix Recommendation

Pass explicit `id` props to the `DropdownMenu` and `Popover` components in the facility sidebar to avoid relying on Radix's auto-generated sequential IDs. Alternatively, investigate the sidebar for server/client rendering differences (e.g., `useEffect`-driven state that changes the component tree).

### Workaround

None needed for functionality — React patches the mismatch. But the dev overlay issue badge persists and causes BUG-003.

### Actual Fix

Modified `apps/nextjs/src/components/navigation/responsive-sidebar.tsx` — deferred the `Sheet` component mount until after hydration:

```tsx
const [sheetMounted, setSheetMounted] = useState(false);
useEffect(() => {
  requestAnimationFrame(() => setSheetMounted(true));
}, []);

// In JSX:
{sheetMounted && (
  <Sheet open={open} onOpenChange={handleOpenChange}>...</Sheet>
)}
```

The `Sheet` component (backed by Radix `Dialog.Root`) allocates `useId()` slots during rendering. When it renders alongside the sidebar's other Radix components (`DropdownMenu` in `FacilitySwitcher`, `Popover` in `SignOutButton`), it shifts the auto-generated ID sequence. Since the Sheet starts closed and is only visible on mobile (behind a hamburger tap), deferring its mount until after hydration has zero visual impact but ensures the Radix ID tree is consistent between SSR and client.

**Lesson learned:** When multiple Radix UI components coexist in the same component tree, their auto-generated IDs depend on render order. If any component renders conditionally or at different times on server vs client (e.g., a `Sheet`/`Dialog` that's always closed on initial render), it can shift the ID sequence for all sibling Radix components. The fix is to defer the problematic component's mount to after hydration, or pass explicit IDs.

---

## BUG-003: Dev overlay blocks bottom-of-page clicks (downstream of BUG-002)

**Severity:** Low
**Status:** Fixed
**Found in:** E2E smoke test S6 (Logout)
**Affected area:** web — all facility pages in development mode

### Description

The Next.js dev overlay's issue badge (triggered by BUG-002's hydration mismatch) expands the `<nextjs-portal>` element's click target area, intercepting pointer events on elements at the bottom of the sidebar (specifically the "Cerrar sesión" button).

### Steps to Reproduce

1. Navigate to any facility page in dev mode (`pnpm dev:next`)
2. Try to click the "Cerrar sesión" button at the bottom of the sidebar
3. Click is intercepted — nothing happens

### Expected Behavior

"Cerrar sesión" button should be clickable and open the sign-out confirmation popover.

### Actual Behavior

Playwright error: `<nextjs-portal> from <script data-nextjs-dev-overlay="true"> subtree intercepts pointer events`

### Root Cause

The Next.js dev overlay renders a `<nextjs-portal>` element that shows an issue badge when hydration issues exist (BUG-002). This badge element has a click target that overlaps with the bottom of the sidebar. This is dev-mode only — production builds don't include the dev overlay.

### Fix Recommendation

Fix BUG-002 (hydration mismatch). Once there are no hydration issues, the dev overlay badge disappears and no longer intercepts clicks. This is a downstream effect, not a standalone bug.

### Workaround

In dev mode, scroll the sidebar or use keyboard navigation. In E2E tests, the overlay can be dismissed via JS evaluation before clicking bottom elements.

### Actual Fix

No standalone fix needed — resolved by fixing BUG-002. Once the hydration mismatch was eliminated, the dev overlay no longer shows the issue badge, and the `<nextjs-portal>` element no longer expands its click target to intercept sidebar buttons.

---

## BUG-004: "Limpiar filtros" on bookings page navigates to facility dashboard

**Severity:** Medium
**Status:** Fixed
**Found in:** E2E Suite F (Booking Management) — scenarios F2, F3, F4
**Affected area:** web `/org/[orgSlug]/facilities/[facilityId]/bookings`

### Description

Clicking the "Limpiar filtros" button on the bookings page redirects the user to the facility dashboard (`/facilities/[facilityId]`) instead of staying on the bookings page with cleared filters. This also happens when the search input is cleared to empty (same code path).

### Steps to Reproduce

1. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/bookings`
2. Apply any filter: click a status chip (e.g., "Confirmada"), set a date range, or type in the search box
3. Click the "Limpiar filtros" button that appears
4. Observe: browser navigates to `/org/padel-group-lima/facilities/{facilityId}` (facility dashboard)

### Expected Behavior

User stays on `/org/padel-group-lima/facilities/{facilityId}/bookings` with all query params removed and the full unfiltered booking list visible.

### Actual Behavior

User is redirected to `/org/padel-group-lima/facilities/{facilityId}` (the facility dashboard page), losing the bookings context entirely.

### Root Cause

In `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/bookings/_components/bookings-view.tsx`:

**Line 185-187** — `handleClearFilters`:
```typescript
const handleClearFilters = useCallback(() => {
  router.replace(".", { scroll: false });
}, [router]);
```

**Line 116** — `updateParams` fallback (same issue when all params are deleted):
```typescript
const qs = params.toString();
router.replace(qs ? `?${qs}` : ".", { scroll: false });
```

The `"."` in `router.replace(".")` resolves as a **relative URL**. For the path `/org/slug/facilities/abc/bookings`, the browser treats `bookings` as a "filename" and `"."` resolves to its parent directory: `/org/slug/facilities/abc/`. This is standard URL resolution behavior (RFC 3986), not a Next.js-specific issue.

### Fix Recommendation

Import `usePathname` and use the absolute pathname instead of `"."`:

```typescript
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Inside the component:
const pathname = usePathname();

// handleClearFilters — line 186:
router.replace(pathname, { scroll: false });

// updateParams — line 116:
router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
```

Alternatively, use `basePath` from `useFacilityContext()` (already imported) appended with `/bookings`.

### Workaround

Click "Reservas" in the sidebar to navigate back to the bookings page, or manually remove query parameters from the URL bar.

### Actual Fix

Replaced relative URL `"."` with `usePathname()` in `bookings-view.tsx`. The `"."` was resolving to the parent directory per RFC 3986, navigating away from `/bookings`. Using the absolute pathname from `usePathname()` ensures `router.replace()` stays on the current page:

```typescript
const pathname = usePathname();

// updateParams — when all params cleared:
router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

// handleClearFilters:
router.replace(pathname, { scroll: false });
```

**Lesson learned:** Never use relative URLs like `"."` with Next.js `router.replace()` — browsers resolve them against the current path per RFC 3986, treating the last segment as a "filename". Always use `usePathname()` for same-page navigation.

---

## BUG-005: Hydration mismatch on bookings page (2 Issues in dev overlay)

**Severity:** Low
**Status:** Fixed
**Found in:** E2E Suite F (Booking Management) — all scenarios on bookings page
**Affected area:** web `/org/[orgSlug]/facilities/[facilityId]/bookings` — `bookings-filters.tsx`

### Description

The bookings page produces two hydration mismatch errors on every page load. The Next.js dev overlay shows "2 Issues" and the console logs `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties`. This is the same class of bug as BUG-002 (Radix UI auto-generated ID conflicts) but in a different component.

### Steps to Reproduce

1. Start dev server (`pnpm dev:next`)
2. Login as any user and navigate to any facility's bookings page
3. Open browser console — observe hydration mismatch error
4. Check Next.js dev overlay badge — shows "2 Issues"

### Expected Behavior

No hydration mismatch. Server and client render identical HTML attributes. Dev overlay shows "0 Issues".

### Actual Behavior

Console error:
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```
Dev overlay shows "2 Issues" badge, which can intercept clicks on nearby elements (same downstream effect as BUG-003).

### Root Cause

Two Radix UI components in `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/bookings/_components/bookings-filters.tsx` generate auto-IDs via `useId()` that differ between SSR and client hydration:

1. **`Select` component** (lines 124-136) — the "Todas las canchas" court filter dropdown. Radix `Select.Root` allocates `useId()` slots during render.
2. **`Popover` component** (lines 264-332) — the date range picker. `Popover.Root` allocates `useId()` slots even when starting in `open={false}` state.

These components are in the same render tree as the deferred `Sheet` in `responsive-sidebar.tsx`. When the Sheet mount is deferred (BUG-002 fix), it shifts the Radix ID counter for subsequent components, causing the bookings filter components' server-generated IDs to mismatch their client-generated IDs.

### Fix Recommendation

Apply the same deferred-mount pattern used in BUG-002. In `bookings-filters.tsx`:

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => {
  requestAnimationFrame(() => setMounted(true));
}, []);

// Wrap Select and Popover:
{mounted && <Select ...>...</Select>}
{mounted && <Popover ...>...</Popover>}
```

Alternatively, pass explicit `id` props to the Radix `Select` and `Popover` components to avoid relying on auto-generated sequential IDs.

### Workaround

Dev-mode only — no impact on production builds. The overlay badge may intercept clicks near the bottom of the sidebar (same as BUG-003).

### Actual Fix

Applied the same deferred-mount pattern from BUG-002 to both Radix components in `bookings-filters.tsx`:

1. **`BookingsFilters`** — deferred `Select` (court filter) mount with `useState(false)` + `useEffect` + `requestAnimationFrame`. Shows a static `<div>` placeholder matching the trigger dimensions until mounted.
2. **`DateRangePicker`** — deferred `Popover` (date range picker) mount with the same pattern. Shows a disabled `<Button>` placeholder matching the trigger appearance until mounted.

```tsx
const [radixMounted, setRadixMounted] = useState(false);
useEffect(() => {
  requestAnimationFrame(() => setRadixMounted(true));
}, []);

// In JSX:
{radixMounted ? <Select ...> : <div className="..." />}
```

The ~16ms delay (one animation frame) is imperceptible. Both placeholders match the dimensions and style of the real components, so there's no visible layout shift.

**Lesson learned:** When the deferred-mount pattern from BUG-002 shifts the Radix ID tree, all Radix components in the same render tree are affected — not just the ones in the sidebar. Any page with Radix `Select`, `Popover`, `Dialog`, etc. may need the same treatment if it shares a layout with the deferred `Sheet`.
