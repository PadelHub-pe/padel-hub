# Level 3: Error States

Test error handling and edge cases across the web dashboard. Verifies 404 pages, unauthorized access redirects, expired sessions, and scoped facility guards.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

## Test Accounts

| Email | Role | Facility Access |
|-------|------|-----------------|
| `owner@padelhub.pe` | `org_admin` | All 3 facilities |
| `manager@padelhub.pe` | `facility_manager` | Facility 1 (San Isidro) + Facility 2 (Miraflores) |
| `staff@padelhub.pe` | `staff` | Facility 1 (San Isidro) only |

**Password for all:** `password123`
**Org slug:** `padel-group-lima`

---

## ERR-1: Invalid Org Slug (404)

**Role:** org_admin (`owner@padelhub.pe`)

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `owner@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Navigate to `http://localhost:3000/org/org-que-no-existe/facilities`
5. Take a snapshot

### Expected Results

- [ ] User is redirected to their first available org (`/org/padel-group-lima/facilities`)
- [ ] The invalid org slug does not cause a crash or unhandled error
- [ ] The facilities list for the correct org is displayed

---

## ERR-2: Invalid Facility ID (404)

**Role:** org_admin (continue from ERR-1)

### Steps

1. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/00000000-0000-0000-0000-000000000000`
2. Take a snapshot

### Expected Results

- [ ] User is redirected to the facilities list (`/org/padel-group-lima/facilities`)
- [ ] No unhandled error or blank page is shown
- [ ] The facilities list loads correctly

---

## ERR-3: Non-Existent Route (404 Page)

**Role:** org_admin (continue from ERR-2)

### Steps

1. Navigate to `http://localhost:3000/ruta-que-no-existe`
2. Take a snapshot

### Expected Results

- [ ] 404 page is displayed
- [ ] Page shows "404" heading
- [ ] Page shows "Pagina no encontrada" message
- [ ] Page shows "La pagina que buscas no existe o fue movida" description
- [ ] "Volver al inicio" link is visible and points to `/org`
- [ ] PadelHub branding (blue "P" icon) is displayed

---

## ERR-4: Expired / Invalid Session (Redirect to Login)

**Role:** None (manipulate session)

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `owner@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect to facilities list
4. Take a snapshot to confirm authenticated state
5. Clear all cookies via browser developer tools or `browser_evaluate` with `document.cookie` manipulation
6. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
7. Take a snapshot

### Expected Results

- [ ] After clearing cookies, navigating to a protected route redirects to `/login`
- [ ] Login form is displayed
- [ ] No authenticated content is leaked or visible
- [ ] No unhandled error is shown

---

## ERR-5: Facility Manager Accessing Unscoped Facility

**Role:** facility_manager (`manager@padelhub.pe`)

Manager has access to Facility 1 (San Isidro) and Facility 2 (Miraflores), but NOT Facility 3 (La Molina).

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `manager@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Discover Facility 3 ID from org_admin's facilities list (if not already known, navigate to facilities list and read available facility links)
5. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility3Id}`
6. Take a snapshot

### Expected Results

- [ ] User is redirected away from the unscoped facility
- [ ] User lands on their first assigned facility (Facility 1 - San Isidro) with `?message=no-access` query param
- [ ] No forbidden error page is shown — redirect is seamless
- [ ] The redirected facility dashboard loads correctly with stats and schedule

### Additional Checks

7. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility3Id}/courts`
8. Take a snapshot

- [ ] Courts page for unscoped facility also redirects to first assigned facility
- [ ] Redirect includes `?message=no-access` query param

---

## ERR-6: Staff Accessing Unscoped Facility

**Role:** staff (`staff@padelhub.pe`)

Staff has access to Facility 1 (San Isidro) only, NOT Facility 2 (Miraflores) or Facility 3 (La Molina).

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `staff@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Discover Facility 2 ID (if not already known)
5. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility2Id}`
6. Take a snapshot

### Expected Results

- [ ] User is redirected away from the unscoped facility (Miraflores)
- [ ] User lands on Facility 1 (San Isidro) with `?message=no-access` query param
- [ ] The redirected facility dashboard loads correctly

### Additional Checks — Staff Config Routes on Scoped Facility

7. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/courts`
8. Take a snapshot — should redirect to bookings

9. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/schedule`
10. Take a snapshot — should redirect to bookings

11. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/pricing`
12. Take a snapshot — should redirect to bookings

13. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/settings`
14. Take a snapshot — should redirect to bookings

- [ ] All restricted config routes (`/courts`, `/schedule`, `/pricing`, `/settings`) redirect to `/bookings`
- [ ] The redirect target is `/org/padel-group-lima/facilities/{facility1Id}/bookings`
- [ ] Bookings page loads correctly after each redirect

---

## ERR-7: No Organizations User

**Role:** A user with no organization memberships

**Note:** This scenario requires a user account that exists but has no organization memberships. If the seed data does not include such a user, this test is informational only. The expected behavior can be verified by checking the code path.

### Steps

1. If a no-org user exists in seed data, log in as that user
2. Otherwise, navigate to `http://localhost:3000/no-organization` directly while authenticated as any user (to verify the page renders)
3. Take a snapshot

### Expected Results

- [ ] The no-organization page is displayed
- [ ] Page shows "Sin organizacion asignada" heading
- [ ] Page shows the user's email address
- [ ] Page shows instructions to check email for invitation link
- [ ] Page shows support contact (`soporte@padelhub.pe`)
- [ ] "Cerrar sesion" button is present
- [ ] Clicking "Cerrar sesion" redirects to `/login`

---

## ERR-8: Network Error Handling

**Role:** org_admin (`owner@padelhub.pe`)

**Note:** This test verifies graceful handling when API calls fail. It requires throttling or intercepting network requests, which may not be feasible in all Playwright MCP sessions. Mark as SKIP if browser network manipulation is not available.

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `owner@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Navigate to a facility dashboard
5. Use `browser_evaluate` to attempt to intercept or block tRPC requests (e.g., modify fetch or XHR)
6. Trigger a data reload or navigate to a page that fetches data
7. Take a snapshot

### Expected Results

- [ ] No unhandled error crashes the page (no white screen)
- [ ] Error boundary or error message is shown if data fails to load
- [ ] User can still navigate to other pages
- [ ] Page does not show raw stack traces or technical error details

---

## ERR-9: Non-Existent Nested Route

**Role:** org_admin (continue authenticated)

### Steps

1. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/pagina-inventada`
2. Take a snapshot

### Expected Results

- [ ] 404 page is displayed (not a blank page or error)
- [ ] "Volver al inicio" link is present and functional
- [ ] The page matches the same 404 design as ERR-3

---

## ERR-10: Unauthenticated Access to Protected Routes

**Role:** None (not logged in)

### Steps

1. Open a fresh browser session (no cookies)
2. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
3. Take a snapshot

4. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
5. Take a snapshot

6. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/any-id/bookings`
7. Take a snapshot

### Expected Results

- [ ] All three routes redirect to `/login`
- [ ] Login form is displayed after each redirect
- [ ] No protected content is visible before redirect
- [ ] No errors or blank pages during redirect

---

## Reporting

After running all scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| ERR-1: Invalid org slug | PASS/FAIL | |
| ERR-2: Invalid facility ID | PASS/FAIL | |
| ERR-3: Non-existent route (404) | PASS/FAIL | |
| ERR-4: Expired/invalid session | PASS/FAIL | |
| ERR-5: Facility manager unscoped facility | PASS/FAIL | |
| ERR-6: Staff unscoped facility | PASS/FAIL | |
| ERR-7: No organizations user | PASS/FAIL/SKIP | |
| ERR-8: Network error handling | PASS/FAIL/SKIP | |
| ERR-9: Non-existent nested route | PASS/FAIL | |
| ERR-10: Unauthenticated protected routes | PASS/FAIL | |

**Result: X/10 passed (Y skipped)**
