# Level 3: RBAC Matrix

Systematically verify route-level access control for all 3 roles. Each scenario logs in as one role and navigates to every key route via direct URL, verifying access or redirect behavior.

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

## Route Reference

Facility IDs are dynamic. Discover them by navigating to the facilities list and reading the card links from the DOM snapshot.

- **Facility 1** = Padel Club San Isidro (active)
- **Facility 2** = Padel Club Miraflores (active)
- **Facility 3** = Padel Club La Molina (inactive, setup incomplete)

---

## RBAC-1: org_admin Full Access

**Role:** org_admin (`owner@padelhub.pe`)

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `owner@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Take a snapshot to confirm landing on facilities list
5. Read facility card links to discover Facility 1, 2, and 3 IDs

**Route: Facilities list**

6. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
7. Take a snapshot

**Route: Create new facility**

8. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/new`
9. Take a snapshot

**Route: Facility dashboard (Facility 1)**

10. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}`
11. Take a snapshot

**Route: Courts (Facility 1)**

12. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/courts`
13. Take a snapshot

**Route: Bookings list (Facility 1)**

14. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings`
15. Take a snapshot

**Route: Calendar (Facility 1)**

16. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings/calendar`
17. Take a snapshot

**Route: Schedule (Facility 1)**

18. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/schedule`
19. Take a snapshot

**Route: Pricing (Facility 1)**

20. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/pricing`
21. Take a snapshot

**Route: Facility settings (Facility 1)**

22. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/settings`
23. Take a snapshot

**Route: Org settings**

24. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
25. Take a snapshot

**Route: Facility 3 dashboard (inactive facility)**

26. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility3Id}`
27. Take a snapshot

### Expected Results

- [ ] Facilities list shows all 3 facility cards (San Isidro, Miraflores, La Molina)
- [ ] Create new facility form renders with name, address, district fields
- [ ] Facility dashboard shows stats cards and today's schedule
- [ ] Courts page shows court list with "Agregar cancha" button
- [ ] Bookings list shows table with booking data
- [ ] Calendar page shows day/week view with time grid
- [ ] Schedule page shows operating hours for 7 days
- [ ] Pricing page shows default rates and court pricing
- [ ] Facility settings shows all tabs (profile, team, account, security)
- [ ] Org settings shows team management and org profile tabs
- [ ] Facility 3 (La Molina) dashboard loads with setup incomplete banner

---

## RBAC-2: facility_manager Scoped Access

**Role:** facility_manager (`manager@padelhub.pe`)

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `manager@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Take a snapshot to confirm landing page
5. Read facility card links to discover Facility 1 and 2 IDs

**Route: Facilities list**

6. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
7. Take a snapshot

**Route: Create new facility (restricted)**

8. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/new`
9. Take a snapshot — should redirect to facilities list

**Route: Facility dashboard (Facility 1 - scoped)**

10. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}`
11. Take a snapshot

**Route: Facility dashboard (Facility 2 - scoped)**

12. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility2Id}`
13. Take a snapshot

**Route: Facility dashboard (Facility 3 - unscoped)**

14. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility3Id}`
15. Take a snapshot — should redirect to first assigned facility with `?message=no-access`

**Route: Courts (Facility 1)**

16. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/courts`
17. Take a snapshot

**Route: Bookings list (Facility 1)**

18. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings`
19. Take a snapshot

**Route: Calendar (Facility 1)**

20. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings/calendar`
21. Take a snapshot

**Route: Schedule (Facility 1)**

22. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/schedule`
23. Take a snapshot

**Route: Pricing (Facility 1)**

24. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/pricing`
25. Take a snapshot

**Route: Facility settings (Facility 1)**

26. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/settings`
27. Take a snapshot

**Route: Org settings (restricted)**

28. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
29. Take a snapshot — should redirect to facilities list

### Expected Results

- [ ] Facilities list shows only 2 facility cards (San Isidro and Miraflores) — La Molina is not listed
- [ ] `/facilities/new` redirects to `/org/padel-group-lima/facilities`
- [ ] Facility 1 (San Isidro) dashboard loads with stats and schedule
- [ ] Facility 2 (Miraflores) dashboard loads with stats and schedule
- [ ] Facility 3 (La Molina) redirects to Facility 1 with `?message=no-access` query param
- [ ] Courts page for Facility 1 loads with court list and CRUD controls
- [ ] Bookings list for Facility 1 loads with booking table
- [ ] Calendar for Facility 1 loads with time grid
- [ ] Schedule for Facility 1 loads with operating hours
- [ ] Pricing for Facility 1 loads with rate configuration
- [ ] Facility settings shows profile and team tabs (not restricted to account/security only)
- [ ] Org settings redirects to `/org/padel-group-lima/facilities`
- [ ] No "Nuevo Local" button visible on facilities list page

---

## RBAC-3: staff Restricted Access

**Role:** staff (`staff@padelhub.pe`)

### Steps

1. Navigate to `http://localhost:3000/login`
2. Fill email with `staff@padelhub.pe`, password with `password123`
3. Click login button, wait for redirect
4. Take a snapshot to confirm landing page
5. Read facility card links to discover Facility 1 ID

**Route: Facilities list**

6. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
7. Take a snapshot

**Route: Create new facility (restricted)**

8. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/new`
9. Take a snapshot — should redirect to facilities list

**Route: Facility dashboard (Facility 1 - scoped)**

10. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}`
11. Take a snapshot

**Route: Facility dashboard (Facility 2 - unscoped)**

12. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility2Id}`
13. Take a snapshot — should redirect to Facility 1 with `?message=no-access`

**Route: Facility dashboard (Facility 3 - unscoped)**

14. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility3Id}`
15. Take a snapshot — should redirect to Facility 1 with `?message=no-access`

**Route: Courts (Facility 1 - restricted)**

16. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/courts`
17. Take a snapshot — should redirect to bookings

**Route: Bookings list (Facility 1)**

18. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings`
19. Take a snapshot

**Route: Calendar (Facility 1)**

20. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/bookings/calendar`
21. Take a snapshot

**Route: Schedule (Facility 1 - restricted)**

22. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/schedule`
23. Take a snapshot — should redirect to bookings

**Route: Pricing (Facility 1 - restricted)**

24. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/pricing`
25. Take a snapshot — should redirect to bookings

**Route: Facility settings (Facility 1 - restricted)**

26. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/{facility1Id}/settings`
27. Take a snapshot — should redirect to bookings

**Route: Org settings (restricted)**

28. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
29. Take a snapshot — should redirect to facilities list

### Expected Results

- [ ] Facilities list shows only 1 facility card (San Isidro)
- [ ] `/facilities/new` redirects to `/org/padel-group-lima/facilities`
- [ ] Facility 1 dashboard loads (staff can view dashboard)
- [ ] Facility 2 redirects to Facility 1 with `?message=no-access`
- [ ] Facility 3 redirects to Facility 1 with `?message=no-access`
- [ ] `/courts` redirects to `/org/padel-group-lima/facilities/{facility1Id}/bookings`
- [ ] Bookings list loads with booking table (read access)
- [ ] Calendar loads with time grid (read access)
- [ ] `/schedule` redirects to `/org/padel-group-lima/facilities/{facility1Id}/bookings`
- [ ] `/pricing` redirects to `/org/padel-group-lima/facilities/{facility1Id}/bookings`
- [ ] `/settings` redirects to `/org/padel-group-lima/facilities/{facility1Id}/bookings`
- [ ] Org settings redirects to `/org/padel-group-lima/facilities`
- [ ] Sidebar does not show Canchas, Horarios, Precios, or Configuracion links
- [ ] No "Nuevo Local" button visible on facilities list page

---

## RBAC-4: Sidebar Navigation Filtering by Role

**Role:** All 3 roles (sequential)

### Steps

**org_admin sidebar**

1. Log in as `owner@padelhub.pe`
2. Navigate to Facility 1 dashboard
3. Take a snapshot of the sidebar

**facility_manager sidebar**

4. Sign out
5. Log in as `manager@padelhub.pe`
6. Navigate to Facility 1 dashboard
7. Take a snapshot of the sidebar

**staff sidebar**

8. Sign out
9. Log in as `staff@padelhub.pe`
10. Navigate to Facility 1 dashboard
11. Take a snapshot of the sidebar

### Expected Results

**org_admin:**
- [ ] Sidebar shows all links: Dashboard, Canchas, Reservas, Calendario, Horarios, Precios, Configuracion
- [ ] Facility switcher shows all 3 facilities
- [ ] "Organizacion" back link is visible

**facility_manager:**
- [ ] Sidebar shows all links: Dashboard, Canchas, Reservas, Calendario, Horarios, Precios, Configuracion
- [ ] Facility switcher shows only 2 facilities (San Isidro, Miraflores)
- [ ] "Organizacion" back link is visible

**staff:**
- [ ] Sidebar shows only: Dashboard, Reservas, Calendario
- [ ] Sidebar hides: Canchas, Horarios, Precios, Configuracion
- [ ] Facility switcher shows only 1 facility (San Isidro)
- [ ] "Organizacion" back link is visible

---

## RBAC-5: UI Element Visibility by Role

**Role:** All 3 roles (sequential)

### Steps

**org_admin UI controls**

1. Log in as `owner@padelhub.pe`
2. Navigate to Facility 1 bookings list
3. Take a snapshot — check for action buttons
4. Navigate to Facility 1 courts page
5. Take a snapshot — check for "Agregar cancha" button and edit/delete controls

**facility_manager UI controls**

6. Sign out, log in as `manager@padelhub.pe`
7. Navigate to Facility 1 bookings list
8. Take a snapshot — check for action buttons
9. Navigate to Facility 1 courts page
10. Take a snapshot — check for "Agregar cancha" button and edit/delete controls

**staff UI controls**

11. Sign out, log in as `staff@padelhub.pe`
12. Navigate to Facility 1 bookings list
13. Take a snapshot — check for limited action buttons

### Expected Results

**org_admin:**
- [ ] Bookings list shows full action controls (confirm, cancel, create manual booking)
- [ ] Courts page shows "Agregar cancha" button and edit/delete controls per court

**facility_manager:**
- [ ] Bookings list shows full action controls (confirm, cancel, create manual booking)
- [ ] Courts page shows "Agregar cancha" button and edit/delete controls per court

**staff:**
- [ ] Bookings list shows limited controls (manage bookings but no configuration)
- [ ] Courts page is not accessible (redirected to bookings)

---

## RBAC Matrix Summary

| Route | org_admin | facility_manager | staff |
|-------|-----------|-------------------|-------|
| `/facilities` | All 3 cards | 2 scoped cards | 1 scoped card |
| `/facilities/new` | Create form | Redirect to `/facilities` | Redirect to `/facilities` |
| `/facilities/{id}` (dashboard) | Full stats | Full stats (scoped) | Full stats (scoped) |
| `/facilities/{id}/courts` | Full CRUD | Full CRUD (scoped) | Redirect to `/bookings` |
| `/facilities/{id}/bookings` | Full access | Full access (scoped) | Read + limited manage |
| `/facilities/{id}/bookings/calendar` | Full access | Full access (scoped) | Read access |
| `/facilities/{id}/schedule` | Full CRUD | Full CRUD (scoped) | Redirect to `/bookings` |
| `/facilities/{id}/pricing` | Full CRUD | Full CRUD (scoped) | Redirect to `/bookings` |
| `/facilities/{id}/settings` | All tabs | Profile + team tabs | Redirect to `/bookings` |
| `/settings` (org) | Team + profile | Redirect to `/facilities` | Redirect to `/facilities` |

---

## Reporting

After running all 5 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| RBAC-1: org_admin full access | PASS/FAIL | |
| RBAC-2: facility_manager scoped access | PASS/FAIL | |
| RBAC-3: staff restricted access | PASS/FAIL | |
| RBAC-4: Sidebar filtering by role | PASS/FAIL | |
| RBAC-5: UI element visibility by role | PASS/FAIL | |

**Result: X/5 passed**
