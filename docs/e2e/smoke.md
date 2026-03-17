# Level 1: Smoke Tests

Quick sanity check that the app is running and core paths work. Run this first before any flow suite.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

---

## S1: Login Page Renders

**Role:** None (unauthenticated)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Take a snapshot of the page

### Expected Results
- [ ] Login form is visible with email and password fields
- [ ] "Iniciar Sesión" or login button is present
- [ ] Google OAuth button is visible
- [ ] PadelHub branding/logo is displayed
- [ ] "¿Olvidaste tu contraseña?" link is present

---

## S2: Valid Login (org_admin)

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for navigation to complete
6. Take a snapshot of the landing page

### Expected Results
- [ ] Redirects to `/org/padel-group-lima/facilities`
- [ ] Facilities list is visible with facility cards
- [ ] Sidebar shows organization navigation
- [ ] User info (email or name) is shown in sidebar

---

## S3: Dashboard Loads

**Role:** org_admin (continue from S2)

### Steps
1. From the facilities list, click on an active facility card (e.g., "Padel Club San Isidro")
2. Wait for the dashboard page to load
3. Take a snapshot

### Expected Results
- [ ] URL is `/org/padel-group-lima/facilities/{facilityId}`
- [ ] Stats cards are visible (revenue, bookings, utilization)
- [ ] Today's schedule table is visible
- [ ] Facility sidebar navigation is shown (Dashboard, Canchas, Reservas, etc.)

---

## S4: Sidebar Navigation

**Role:** org_admin (continue from S3)

### Steps
1. From the facility dashboard, click "Reservas" in the sidebar
2. Take a snapshot — verify bookings page loaded
3. Click "Calendario" in the sidebar
4. Take a snapshot — verify calendar page loaded
5. Click "Canchas" in the sidebar
6. Take a snapshot — verify courts page loaded

### Expected Results
- [ ] Each page loads without errors
- [ ] URL changes to match the clicked section
- [ ] Active sidebar item is highlighted
- [ ] Breadcrumbs update to reflect current page

---

## S5: Breadcrumbs

**Role:** org_admin (continue from S4)

### Steps
1. Navigate to the bookings page for a facility
2. Take a snapshot
3. Check the breadcrumb trail

### Expected Results
- [ ] Breadcrumbs show a path like: Home > [Org Name] > [Facility Name] > Reservas
- [ ] Each breadcrumb segment is clickable
- [ ] Current page segment is not a link (or styled differently)

---

## S6: Logout

**Role:** org_admin (continue from S5)

### Steps
1. Find and click the sign-out button/link in the sidebar
2. If a confirmation dialog appears, confirm the sign-out
3. Wait for navigation
4. Take a snapshot

### Expected Results
- [ ] Redirects to `/login`
- [ ] Login form is visible again
- [ ] No authenticated content is shown
- [ ] Navigating to a protected page (e.g., `/org/padel-group-lima/facilities`) redirects back to login

---

## Reporting

After running all 6 smoke tests, report:

| Test | Status | Notes |
|------|--------|-------|
| S1: Login renders | PASS/FAIL | |
| S2: Valid login | PASS/FAIL | |
| S3: Dashboard loads | PASS/FAIL | |
| S4: Sidebar navigation | PASS/FAIL | |
| S5: Breadcrumbs | PASS/FAIL | |
| S6: Logout | PASS/FAIL | |

**Result: X/6 passed**
