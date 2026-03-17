# Suite I: Navigation & Context Switching

Tests for sidebar structure, breadcrumbs, facility switching, sign-out confirmation, 404 handling, and role-based navigation restrictions.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

### Test Accounts

| Email                  | Password      | Role              | Org Slug           |
|------------------------|---------------|-------------------|--------------------|
| `owner@padelhub.pe`    | `password123` | `org_admin`       | `padel-group-lima` |
| `manager@padelhub.pe`  | `password123` | `facility_manager`| `padel-group-lima` |
| `staff@padelhub.pe`    | `password123` | `staff`           | `padel-group-lima` |

### Auth Helper

For tests that require an authenticated session, log in first:
1. Navigate to `http://localhost:3000/login`
2. Fill email field with the appropriate test account email
3. Fill password field with `password123`
4. Click the "Iniciar sesion" button
5. Wait for navigation to complete

---

## I1: Org Sidebar Structure

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** `http://localhost:3000/org/padel-group-lima/facilities`

### Steps
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. Confirm URL is `/org/padel-group-lima/facilities` (org-view)
3. Take a snapshot of the page focusing on the sidebar

### Expected Results
- [ ] **Logo area**: Top of sidebar shows "P" logomark in a blue square and "PadelHub" text
- [ ] **Org selector**: Below the logo, an organization selector/dropdown is visible showing the current org name
- [ ] **GENERAL section**: A section labeled "GENERAL" with a "Locales" nav item
- [ ] **CONFIGURACION section**: A section labeled "CONFIGURACION" with an "Organizacion" nav item (visible for org_admin)
- [ ] **Active state**: "Locales" nav item is highlighted (blue background) since we are on the facilities page
- [ ] **User info**: Bottom of sidebar shows user name or email (`owner@padelhub.pe`) with an avatar placeholder
- [ ] **Sign out button**: "Cerrar sesion" button is visible in the sidebar footer

### Cleanup
4. Click "Cerrar sesion" > "Confirmar"
5. Wait for `/login`

---

## I2: Facility Sidebar Structure

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** Facility dashboard

### Steps
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. From the facilities list, click on an active facility card (note the facility name, e.g., "Padel Club San Isidro")
3. Wait for the facility dashboard to load
4. Take a snapshot of the full page, focusing on the sidebar

### Expected Results
- [ ] **Logo area**: "P" logomark + "PadelHub" text at the top (same as org sidebar)
- [ ] **Back to org link**: "Volver a Organizacion" link with a left arrow icon is visible below the logo (org_admin only)
- [ ] **Facility switcher**: Below the back link, shows the current facility name and district with a gradient-colored initial avatar
- [ ] **Switcher chevron**: Up/down chevron icon indicating the switcher is a dropdown (only if multiple facilities exist)
- [ ] **GENERAL section**: Contains "Dashboard" and "Canchas" nav items
- [ ] **OPERACIONES section**: Contains "Reservas" and "Calendario" nav items
- [ ] **CONFIGURACION section**: Contains "Horarios", "Precios", and "Configuracion" nav items
- [ ] **Active state**: "Dashboard" is highlighted since we are on the facility root page
- [ ] **User info**: Same user info footer as org sidebar with avatar, name/email, and "Cerrar sesion"

### Cleanup
5. Click "Cerrar sesion" > "Confirmar"
6. Wait for `/login`

---

## I3: Breadcrumb Trail on Various Pages

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** `http://localhost:3000/login`

### Steps

#### I3a: Facilities List Breadcrumbs
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. Confirm URL is `/org/padel-group-lima/facilities`
3. Take a snapshot and inspect the breadcrumb area (below the mobile header, above the page content)

#### I3a Expected Results
- [ ] Breadcrumb shows: `[Org Name] > Locales`
- [ ] Org name segment is a link (clickable)
- [ ] "Locales" is the current page (styled as bold/non-link text)

#### I3b: Facility Dashboard Breadcrumbs
4. Click on an active facility card (note facility name, e.g., "Padel Club San Isidro")
5. Wait for the dashboard to load
6. Take a snapshot of the breadcrumb area

#### I3b Expected Results
- [ ] Breadcrumb shows: `[Org Name] > [Facility Name] > Dashboard`
- [ ] Org name is a link pointing to `/org/padel-group-lima/facilities`
- [ ] Facility name is a link pointing to the facility root
- [ ] "Dashboard" is the current page (non-link)

#### I3c: Bookings Page Breadcrumbs
7. Click "Reservas" in the sidebar
8. Wait for the bookings page to load
9. Take a snapshot of the breadcrumb area

#### I3c Expected Results
- [ ] Breadcrumb shows: `[Org Name] > [Facility Name] > Reservas`
- [ ] "Reservas" is the current page (non-link)

#### I3d: Calendar Page Breadcrumbs
10. Click "Calendario" in the sidebar
11. Wait for the calendar page to load
12. Take a snapshot of the breadcrumb area

#### I3d Expected Results
- [ ] Breadcrumb shows: `[Org Name] > [Facility Name] > Reservas > Calendario`
- [ ] "Reservas" is a link; "Calendario" is current (non-link)

#### I3e: Courts Page Breadcrumbs
13. Click "Canchas" in the sidebar
14. Wait for the courts page to load
15. Take a snapshot of the breadcrumb area

#### I3e Expected Results
- [ ] Breadcrumb shows: `[Org Name] > [Facility Name] > Canchas`
- [ ] "Canchas" is the current page (non-link)

#### I3f: Org Settings Breadcrumbs
16. Click "Volver a Organizacion" link in the sidebar
17. Wait for redirect to facilities list
18. Click "Organizacion" in the sidebar (under CONFIGURACION section)
19. Wait for the settings page to load
20. Take a snapshot of the breadcrumb area

#### I3f Expected Results
- [ ] Breadcrumb shows: `[Org Name] > Organizacion`
- [ ] "Organizacion" is the current page (non-link)

### Cleanup
21. Click "Cerrar sesion" > "Confirmar"
22. Wait for `/login`

---

## I4: Facility Switcher

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** Facility dashboard

### Steps
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. From the facilities list, click on the first active facility card
3. Note the current facility name and URL (facility ID)
4. Take a snapshot of the sidebar showing the facility switcher
5. Click the facility switcher dropdown button (the area showing facility name + chevron icon)
6. Wait for the dropdown menu to appear
7. Take a snapshot of the open dropdown

#### I4a: Verify Dropdown Contents
8. Inspect the dropdown content

#### I4a Expected Results
- [ ] Dropdown header shows the organization name with an initial avatar
- [ ] "Tus sedes" label is visible
- [ ] All user-accessible facilities are listed with name, district, and gradient initial avatar
- [ ] Current facility has a checkmark icon next to it
- [ ] Current facility row has a highlighted/selected background
- [ ] Inactive facilities show an "Inactivo" badge and appear dimmed
- [ ] "Agregar sede" option is visible (org_admin only)
- [ ] "Ajustes de sede" option is visible

#### I4b: Switch Facility
9. Click on a different facility in the dropdown (not the currently selected one)
10. Wait for navigation to complete
11. Take a snapshot of the new facility dashboard

#### I4b Expected Results
- [ ] URL changes to include the new facility's ID
- [ ] Sidebar facility switcher now shows the newly selected facility name
- [ ] Dashboard content updates to show the new facility's data
- [ ] Breadcrumbs update to show the new facility name

### Cleanup
12. Click "Cerrar sesion" > "Confirmar"
13. Wait for `/login`

---

## I5: Back to Org Link (org_admin Only)

**Role:** org_admin (`owner@padelhub.pe`), then facility_manager for negative test
**Start URL:** Facility dashboard

### Steps

#### I5a: org_admin Has Back Link
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. From the facilities list, click on an active facility card
3. Wait for the facility dashboard to load
4. Take a snapshot focusing on the sidebar area below the logo

#### I5a Expected Results
- [ ] "Volver a Organizacion" link is visible below the PadelHub logo, above the facility switcher
- [ ] Link has a left arrow icon

#### I5b: Click Back Link
5. Click "Volver a Organizacion"
6. Wait for navigation to complete
7. Take a snapshot

#### I5b Expected Results
- [ ] URL changes to `/org/padel-group-lima/facilities`
- [ ] Org sidebar is displayed (with "Locales" and "Organizacion" nav items)
- [ ] Facilities list/cards are visible
- [ ] Facility sidebar is no longer shown

#### I5b Cleanup
8. Click "Cerrar sesion" > "Confirmar"
9. Wait for `/login`

#### I5c: facility_manager Does NOT Have Back Link
10. Log in as `manager@padelhub.pe` (follow Auth Helper)
11. Wait for the facility dashboard to load (manager lands on facility dashboard)
12. Take a snapshot focusing on the sidebar area below the logo

#### I5c Expected Results
- [ ] "Volver a Organizacion" link is NOT visible
- [ ] Facility switcher is shown directly below the logo area
- [ ] No back arrow or organization link is present

### Cleanup
13. Click "Cerrar sesion" > "Confirmar"
14. Wait for `/login`

---

## I6: Sign-Out Confirmation Dialog

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** Any authenticated page

### Steps
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. Wait for the facilities page to load
3. Scroll to the bottom of the sidebar (if needed) and locate "Cerrar sesion" button
4. Take a snapshot showing the sign-out button
5. Click "Cerrar sesion"
6. Wait for the confirmation popover to appear
7. Take a snapshot of the popover

#### I6a: Verify Popover Contents
8. Inspect the popover content

#### I6a Expected Results
- [ ] A popover appears near the sign-out button (not a full-page dialog)
- [ ] Popover text reads "Cerrar sesion?" (as a question/confirmation prompt)
- [ ] Two buttons are present: "Cancelar" and "Confirmar"
- [ ] "Confirmar" button has a destructive/red style
- [ ] "Cancelar" button has a ghost/secondary style

#### I6b: Cancel Sign-Out
9. Click "Cancelar" in the popover
10. Take a snapshot

#### I6b Expected Results
- [ ] Popover closes/disappears
- [ ] User remains on the same page, still authenticated
- [ ] Sidebar and page content are unchanged

#### I6c: Confirm Sign-Out
11. Click "Cerrar sesion" again to reopen the popover
12. Click "Confirmar"
13. Wait for navigation to complete
14. Take a snapshot

#### I6c Expected Results
- [ ] User is redirected to `/login`
- [ ] Login form is displayed
- [ ] No authenticated sidebar or content is visible

---

## I7: 404 Page for Invalid URLs

**Role:** org_admin (`owner@padelhub.pe`) for authenticated test; none for unauthenticated
**Start URL:** Various invalid URLs

### Steps

#### I7a: Invalid Path (Authenticated)
1. Log in as `owner@padelhub.pe` (follow Auth Helper)
2. Wait for the facilities page to load
3. Navigate to `http://localhost:3000/org/padel-group-lima/this-page-does-not-exist`
4. Wait for the page to render
5. Take a snapshot

#### I7a Expected Results
- [ ] A 404 error page is displayed
- [ ] Page shows "404" text prominently
- [ ] Message reads "Pagina no encontrada"
- [ ] Description text: "La pagina que buscas no existe o fue movida"
- [ ] "Volver al inicio" button/link is present
- [ ] The page has a dark background (bg-gray-900) with the PadelHub "P" icon

#### I7b: Click Return Link
6. Click "Volver al inicio"
7. Wait for navigation
8. Note the final URL

#### I7b Expected Results
- [ ] User is redirected to `/org` which then redirects to the role-based landing page
- [ ] Authenticated content is visible (facilities list for org_admin)

#### I7b Cleanup
9. Click "Cerrar sesion" > "Confirmar"
10. Wait for `/login`

#### I7c: Invalid Org Slug (Authenticated)
11. Log in as `owner@padelhub.pe` (follow Auth Helper)
12. Navigate to `http://localhost:3000/org/nonexistent-org/facilities`
13. Wait for the page to render
14. Take a snapshot

#### I7c Expected Results
- [ ] Either a 404 page is displayed OR the user is redirected to a valid page
- [ ] The app does not crash or show a blank white screen

#### I7c Cleanup
15. Click "Cerrar sesion" > "Confirmar" (if still on an authenticated page)
16. Wait for `/login`

---

## I8: Staff Restricted Navigation

**Role:** staff (`staff@padelhub.pe`)
**Start URL:** `http://localhost:3000/login`

### Steps

#### I8a: Verify Sidebar Does Not Show Restricted Items
1. Log in as `staff@padelhub.pe` (follow Auth Helper)
2. Wait for navigation to complete (staff lands on `/bookings`)
3. Take a snapshot of the full sidebar

#### I8a Expected Results
- [ ] Sidebar does NOT show "Dashboard" nav item (requires `canConfigureFacility`)
- [ ] Sidebar does NOT show "Canchas" nav item (requires `canConfigureFacility`)
- [ ] Sidebar does NOT show "Horarios" nav item (requires `canConfigureFacility`)
- [ ] Sidebar does NOT show "Precios" nav item (requires `canConfigureFacility`)
- [ ] Sidebar does NOT show "Configuracion" nav item (requires `canConfigureFacility`)
- [ ] Sidebar DOES show "Reservas" nav item (no permission required)
- [ ] Sidebar DOES show "Calendario" nav item (no permission required)
- [ ] Only the "OPERACIONES" section is visible (not "GENERAL" or "CONFIGURACION")
- [ ] "Volver a Organizacion" link is NOT shown (staff only)

#### I8b: Direct URL to Courts (Staff Restricted)
4. Note the current URL to extract the facility ID (from the `/bookings` path)
5. Navigate directly to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/courts` (replace `{facilityId}` with the actual ID from step 4)
6. Wait for the redirect to complete
7. Take a snapshot

#### I8b Expected Results
- [ ] Staff is redirected away from `/courts` (restricted page)
- [ ] URL changes to end with `/bookings` (redirected to the bookings page)
- [ ] Bookings content is displayed, not courts

#### I8c: Direct URL to Schedule (Staff Restricted)
8. Navigate directly to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/schedule`
9. Wait for the redirect to complete
10. Take a snapshot

#### I8c Expected Results
- [ ] Staff is redirected to `/bookings`
- [ ] Schedule page is not shown

#### I8d: Direct URL to Pricing (Staff Restricted)
11. Navigate directly to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/pricing`
12. Wait for the redirect to complete
13. Take a snapshot

#### I8d Expected Results
- [ ] Staff is redirected to `/bookings`
- [ ] Pricing page is not shown

#### I8e: Direct URL to Settings (Staff Restricted)
14. Navigate directly to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/settings`
15. Wait for the redirect to complete
16. Take a snapshot

#### I8e Expected Results
- [ ] Staff is redirected to `/bookings`
- [ ] Settings page is not shown

#### I8f: Breadcrumbs for Staff
17. Navigate to the bookings page (should already be there from previous redirects)
18. Take a snapshot of the breadcrumb area

#### I8f Expected Results
- [ ] Breadcrumbs do NOT show the org name segment (staff breadcrumbs omit org level)
- [ ] Breadcrumbs show: `[Facility Name] > Reservas`
- [ ] Only the facility name and current page are shown

### Cleanup
19. Click "Cerrar sesion" > "Confirmar"
20. Wait for `/login`

---

## Reporting

After running all scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| I1: Org sidebar structure | PASS/FAIL | |
| I2: Facility sidebar structure | PASS/FAIL | |
| I3a: Breadcrumbs - facilities list | PASS/FAIL | |
| I3b: Breadcrumbs - facility dashboard | PASS/FAIL | |
| I3c: Breadcrumbs - bookings | PASS/FAIL | |
| I3d: Breadcrumbs - calendar | PASS/FAIL | |
| I3e: Breadcrumbs - courts | PASS/FAIL | |
| I3f: Breadcrumbs - org settings | PASS/FAIL | |
| I4a: Facility switcher dropdown | PASS/FAIL | |
| I4b: Facility switcher - switch | PASS/FAIL | |
| I5a: Back to org link visible (org_admin) | PASS/FAIL | |
| I5b: Back to org link navigation | PASS/FAIL | |
| I5c: No back link (facility_manager) | PASS/FAIL | |
| I6a: Sign-out popover contents | PASS/FAIL | |
| I6b: Sign-out cancel | PASS/FAIL | |
| I6c: Sign-out confirm | PASS/FAIL | |
| I7a: 404 page display | PASS/FAIL | |
| I7b: 404 return link | PASS/FAIL | |
| I7c: Invalid org slug | PASS/FAIL | |
| I8a: Staff sidebar restrictions | PASS/FAIL | |
| I8b: Staff direct URL courts redirect | PASS/FAIL | |
| I8c: Staff direct URL schedule redirect | PASS/FAIL | |
| I8d: Staff direct URL pricing redirect | PASS/FAIL | |
| I8e: Staff direct URL settings redirect | PASS/FAIL | |
| I8f: Staff breadcrumbs (no org) | PASS/FAIL | |

**Result: X/25 passed**
