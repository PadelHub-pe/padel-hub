# Suite B: Organization & Facilities

End-to-end tests for the facilities list page, filtering, search, and quick facility creation.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

## Seed Data Reference

| Facility | District | Active | Setup Complete | Courts |
|---|---|---|---|---|
| Padel Club San Isidro | San Isidro | Yes | Yes | 4 (2 indoor, 2 outdoor) |
| Padel Club Miraflores | Miraflores | Yes | Yes | 3 (1 indoor, 2 outdoor) |
| Padel Club La Molina | La Molina | No | No | 2 (1 indoor, 1 outdoor) |

**Test account:** `owner@padelhub.pe` / `password123` (org_admin, org slug: `padel-group-lima`)

---

## B1: View Facilities List

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill the email field with `owner@padelhub.pe`
3. Fill the password field with `password123`
4. Click the login/submit button
5. Wait for navigation to complete (should land on `/org/padel-group-lima/facilities`)
6. Take a snapshot of the page

### Expected Results
- [ ] URL is `/org/padel-group-lima/facilities`
- [ ] Page heading says "Locales"
- [ ] Subheading says "Gestiona los locales de Padel Group Lima"
- [ ] 4 stats cards are visible: "Locales Activos" (showing 2/3), "Canchas Totales", "Reservas del Mes", "Ingresos del Mes"
- [ ] 3 facility cards are visible in the grid: "Padel Club San Isidro", "Padel Club Miraflores", "Padel Club La Molina"
- [ ] An "Agregar Local" button is visible in the top-right area
- [ ] An add facility card ("+") is visible after the 3 facility cards
- [ ] Each facility card shows: name, district, court type pills (Indoor/Outdoor), stats row (Hoy, Este mes, Ocupacion)
- [ ] "Agregar Local" button links to `/org/padel-group-lima/facilities/new`

---

## B2: Filter by Status

**Role:** org_admin (continue from B1)

### Steps
1. Locate the status filter dropdown (shows "Todos los estados" by default)
2. Click the status filter dropdown
3. Select "Activos"
4. Wait for the grid to update
5. Take a snapshot
6. Note the number of facility cards visible
7. Click the status filter dropdown again
8. Select "Inactivos"
9. Wait for the grid to update
10. Take a snapshot
11. Note the number of facility cards visible

### Expected Results
- [ ] After selecting "Activos": exactly 2 facility cards are visible ("Padel Club San Isidro" and "Padel Club Miraflores")
- [ ] Filter count text appears: "Mostrando 2 de 3 locales"
- [ ] URL contains `?status=active`
- [ ] After selecting "Inactivos": exactly 1 facility card is visible ("Padel Club La Molina")
- [ ] Filter count text appears: "Mostrando 1 de 3 locales"
- [ ] URL contains `?status=inactive`
- [ ] "Limpiar filtros" button is visible when a filter is active

### Cleanup
1. Click "Limpiar filtros" to reset all filters
2. Verify all 3 facility cards are visible again

---

## B3: Search by Facility Name

**Role:** org_admin (continue from B2)

### Steps
1. Locate the search input (placeholder: "Buscar locales...")
2. Click on the search input
3. Type "San Isidro"
4. Wait for the debounced search to apply (300ms delay)
5. Take a snapshot

### Expected Results
- [ ] Only 1 facility card is visible: "Padel Club San Isidro"
- [ ] Filter count text appears: "Mostrando 1 de 3 locales"
- [ ] URL contains `?q=San+Isidro` or `?q=San%20Isidro`
- [ ] "Limpiar filtros" button is visible

### Cleanup
1. Clear the search input (select all text and delete)
2. Wait for the debounce to clear
3. Verify all 3 facility cards are visible again

---

## B4: Filter by District

**Role:** org_admin (continue from B3)

### Steps
1. Locate the district filter dropdown (shows "Todos los distritos" by default)
2. Click the district filter dropdown
3. The dropdown should list at least: San Isidro, Miraflores, La Molina
4. Select "Miraflores"
5. Wait for the grid to update
6. Take a snapshot

### Expected Results
- [ ] Only 1 facility card is visible: "Padel Club Miraflores"
- [ ] The district shown on the card is "Miraflores"
- [ ] Filter count text appears: "Mostrando 1 de 3 locales"
- [ ] URL contains `?district=Miraflores`
- [ ] "Limpiar filtros" button is visible

### Cleanup
1. Click "Limpiar filtros" to reset all filters
2. Verify all 3 facility cards are visible again

---

## B5: URL-Persisted Filters

**Role:** org_admin (continue from B4)

### Steps
1. Click the status filter dropdown and select "Activos"
2. Wait for the grid to update
3. Verify URL contains `?status=active`
4. Verify 2 facility cards are visible
5. Navigate to `http://localhost:3000/org/padel-group-lima/facilities?status=active` (simulate a page refresh by navigating to the same URL)
6. Wait for the page to load
7. Take a snapshot

### Expected Results
- [ ] After navigating to the URL with `?status=active`, the status filter dropdown shows "Activos"
- [ ] Exactly 2 facility cards are visible: "Padel Club San Isidro" and "Padel Club Miraflores"
- [ ] Filter count text appears: "Mostrando 2 de 3 locales"
- [ ] The filter state is preserved from the URL parameters

### Cleanup
1. Click "Limpiar filtros" to reset all filters

---

## B6: Quick Create Facility Form

**Role:** org_admin (continue from B5)

### Steps
1. Click the "Agregar Local" button in the page header
2. Wait for navigation to `/org/padel-group-lima/facilities/new`
3. Take a snapshot of the create form
4. Verify the form fields are present
5. Fill "Nombre del local" with `Padel Club Surco Test`
6. Verify the slug preview updates (should show something like "padel-club-surco-test")
7. Fill "Direccion" with `Av. Primavera 1234`
8. Click the "Distrito" selector (it is a combobox/popover, not a plain select)
9. In the district search popover, type "Santiago" to filter
10. Select "Santiago de Surco" from the list
11. Fill "Telefono" with `+51999111222`
12. Leave "Email (opcional)" empty
13. Click "Crear local"
14. Wait for the success dialog to appear
15. Take a snapshot of the success dialog

### Expected Results
- [ ] URL is `/org/padel-group-lima/facilities/new`
- [ ] Breadcrumb shows "Locales / Nuevo Local"
- [ ] Form title is "Crear nuevo local"
- [ ] Form description mentions configuring courts and hours later
- [ ] Form has fields: Nombre del local (required), Direccion (required), Distrito (required), Telefono (required), Email (opcional)
- [ ] Slug preview shows below the name field as the user types
- [ ] District selector is a searchable combobox with Lima districts
- [ ] After submitting, a success dialog appears with title "Local creado exitosamente"
- [ ] Success dialog mentions the created facility name
- [ ] Success dialog has two buttons: "Configurar mas tarde" and "Configurar ahora"
- [ ] Clicking "Configurar ahora" navigates to the setup wizard: `/org/padel-group-lima/facilities/{newId}/setup`

### Cleanup (Important)
1. Click "Configurar mas tarde" to go back to facilities list (this avoids navigating to setup wizard and potentially failing there)
2. Alternatively, if "Configurar ahora" was clicked, navigate back to `/org/padel-group-lima/facilities`

---

## B7: Inactive Facility Badge

**Role:** org_admin (continue from B6)

### Steps
1. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
2. Wait for the page to load
3. Locate the "Padel Club La Molina" facility card
4. Take a snapshot focusing on the La Molina card

### Expected Results
- [ ] "Padel Club La Molina" card has a "Pendiente" badge (amber/yellow colored) because setup is not complete
- [ ] "Padel Club La Molina" card has an "Inactivo" badge (gray colored) because it is not active
- [ ] The card has reduced opacity compared to active facilities
- [ ] The card footer shows "Completar configuracion" link (amber text) instead of "Ver Dashboard"
- [ ] "Padel Club San Isidro" and "Padel Club Miraflores" cards show "Activo" badge (green colored)
- [ ] Active facility cards show "Ver Dashboard" link in the footer

---

## B8: Facility Card Click Navigates to Dashboard

**Role:** org_admin (continue from B7)

### Steps
1. On the facilities list, click on the "Padel Club San Isidro" card (click on the card content or photo area, not the dropdown menu)
2. Wait for navigation to complete
3. Take a snapshot

### Expected Results
- [ ] URL matches pattern `/org/padel-group-lima/facilities/{facilityId}` (the facilityId is a UUID)
- [ ] The facility dashboard page loads
- [ ] Stats cards are visible (revenue, bookings, utilization, or similar)
- [ ] The facility sidebar navigation is present with items like: Dashboard, Canchas, Reservas, Calendario, Horarios, Precios, Ajustes
- [ ] The page is for "Padel Club San Isidro" (visible in breadcrumbs, heading, or sidebar)
- [ ] No error page or 404 is shown

---

## Reporting

After running all 8 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| B1: View facilities list | PASS/FAIL | |
| B2: Filter by status | PASS/FAIL | |
| B3: Search by facility name | PASS/FAIL | |
| B4: Filter by district | PASS/FAIL | |
| B5: URL-persisted filters | PASS/FAIL | |
| B6: Quick create facility form | PASS/FAIL | |
| B7: Inactive facility badge | PASS/FAIL | |
| B8: Facility card click navigates to dashboard | PASS/FAIL | |

**Result: X/8 passed**
