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
