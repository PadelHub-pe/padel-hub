# Suite D: Facility Onboarding

Tests for the setup wizard that guides facility owners through the three-step onboarding process: Courts, Schedule, and Photos/Amenities. Uses the incomplete facility "Padel Club La Molina" which has courts seeded but no operating hours and no onboarding completion.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

---

## D1: Setup Wizard Loads with Step Indicator

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for navigation to complete (should land on `/org/padel-group-lima/facilities`)
6. Take a snapshot of the facilities list
7. Identify the "Padel Club La Molina" facility card -- it should show a "Pendiente" badge
8. Click on the "Padel Club La Molina" card to navigate to its dashboard
9. Take a snapshot of the dashboard page
10. Look for the setup banner with text "Configuracion pendiente"
11. Click the "Continuar configuracion" link on the setup banner
12. Wait for the setup wizard page to load
13. Take a snapshot of the setup wizard page

### Expected Results
- [ ] Setup wizard page loads at a URL matching `/org/padel-group-lima/facilities/{facilityId}/setup`
- [ ] Page heading shows "Configurar Padel Club La Molina"
- [ ] Subtitle text shows "Completa la configuracion para activar tu local"
- [ ] Step indicator is visible with 3 steps labeled: "Canchas", "Horarios", "Fotos"
- [ ] Step circles are visible -- the current step circle is highlighted in blue
- [ ] The "Siguiente" button is present in the bottom right
- [ ] The "Configurar mas tarde" button is present in the bottom left (only on step 1)

---

## D2: Step 1 -- Add a Court

**Role:** org_admin (continue from D1)

### Steps
1. From the setup wizard on Step 1 (Canchas), take a snapshot
2. Note that La Molina already has 2 seeded courts displayed as cards in the grid
3. Click the "Agregar Cancha" dashed button/card (it shows the count e.g. "2/10")
4. Wait for the "Agregar Cancha" dialog to appear
5. Take a snapshot of the dialog
6. Fill the "Nombre" field with `Cancha 3`
7. Select the "Indoor (techada)" radio button (should be default)
8. Fill the "Precio por turno" field with `90`
9. Fill the "Precio hora punta" field with `130`
10. Click the "Agregar" button in the dialog footer
11. Wait for the dialog to close and the court list to refresh
12. Take a snapshot of the courts grid

### Expected Results
- [ ] "Agregar Cancha" dialog appears with fields: Nombre, Tipo de cancha (radio group), Precio por turno, Precio hora punta
- [ ] Dialog title says "Agregar Cancha"
- [ ] Dialog description says "Completa los datos de la nueva cancha."
- [ ] After submitting, a success toast "Cancha creada" appears
- [ ] The courts grid now shows 3 court cards (the 2 seeded + the new one)
- [ ] The new "Cancha 3" card shows: name "Cancha 3", badge "Techada", price "S/ 90", peak price "S/ 130"
- [ ] The "Agregar Cancha" card now shows "3/10"

---

## D3: Step 1 -- Edit Existing Court

**Role:** org_admin (continue from D2)

### Steps
1. From the setup wizard Step 1, locate the "Cancha 3" card just created
2. Click the "Editar" button on the "Cancha 3" card
3. Wait for the edit dialog to appear
4. Take a snapshot of the edit dialog
5. Verify the dialog title says "Editar Cancha"
6. Clear the "Nombre" field and type `Cancha 3 Editada`
7. Select the "Outdoor (al aire libre)" radio button
8. Clear the "Precio por turno" field and type `95`
9. Click the "Guardar" button
10. Wait for the dialog to close
11. Take a snapshot of the courts grid

### Expected Results
- [ ] Edit dialog pre-fills with current values (name, type, price, peak price)
- [ ] Dialog title shows "Editar Cancha"
- [ ] After saving, a success toast "Cancha actualizada" appears
- [ ] The updated card shows: name "Cancha 3 Editada", badge "Al aire libre", price "S/ 95"

### Cleanup
- Delete the test court: click the red trash icon on "Cancha 3 Editada" card, confirm deletion in the dialog by clicking "Eliminar", wait for the toast "Cancha eliminada"

---

## D4: Step 1 -- Court Pricing (Default vs Custom)

**Role:** org_admin (continue from D3)

### Steps
1. From the setup wizard Step 1, take a snapshot of the existing court cards
2. Note the prices displayed on each seeded court card
3. Click "Agregar Cancha" to open the add dialog
4. Fill "Nombre" with `Cancha Precio Test`
5. Fill "Precio por turno" with `75`
6. Leave "Precio hora punta" empty (optional field)
7. Click "Agregar"
8. Wait for the court to appear in the grid
9. Take a snapshot
10. Verify the new court shows price "S/ 75" and no peak price line
11. Now click "Editar" on the new court
12. Fill "Precio hora punta" with `110`
13. Click "Guardar"
14. Take a snapshot

### Expected Results
- [ ] Court created with only base price shows "S/ 75 / turno" and no "Hora punta:" line
- [ ] After adding peak price, the card now shows "Hora punta: S/ 110" below the base price
- [ ] Each court card independently displays its own pricing
- [ ] The "Precio por turno" field is required (trying to submit without it shows "El precio es requerido")
- [ ] The "Precio hora punta" field is optional

### Cleanup
- Delete the "Cancha Precio Test" court via the trash icon and confirm

---

## D5: Step 2 -- Set Operating Hours for a Day

**Role:** org_admin (continue from D4)

### Steps
1. From the setup wizard Step 1, click the "Siguiente" button
2. Wait for Step 2 to load
3. Take a snapshot of the Step 2 (Horarios) content
4. Verify the step indicator now highlights step 2 ("Horarios")
5. Verify the heading shows "Horarios de Operacion"
6. Locate the "Lunes" row in the schedule form
7. Note the default open/close times (should be "07:00" and "22:00")
8. Click the open time dropdown for Lunes and select "08:00"
9. Click the close time dropdown for Lunes and select "23:00"
10. Take a snapshot to verify the Lunes row shows "08:00" to "23:00"

### Expected Results
- [ ] Step 2 shows a form with 7 day rows: Lunes through Domingo
- [ ] Each open day row has: day name, "Cerrado" checkbox, open time dropdown, "a" separator, close time dropdown, and "Aplicar a todos" button
- [ ] Default hours are pre-filled (Mon-Fri: 07:00-22:00, Sat: 08:00-22:00, Sun: 09:00-21:00)
- [ ] Time dropdowns show 30-minute intervals from 05:00 to 23:30
- [ ] After changing Lunes times, the row reflects "08:00" and "23:00"
- [ ] The "Atras" button is visible in the bottom left (instead of "Configurar mas tarde")
- [ ] The "Siguiente" button remains in the bottom right

---

## D6: Step 2 -- "Aplicar a Todos" Copies Hours to All Days

**Role:** org_admin (continue from D5)

### Steps
1. From Step 2, locate the "Lunes" row (which should now show 08:00 to 23:00 from D5)
2. Click the "Aplicar a todos" button on the Lunes row
3. Wait for the toast message
4. Take a snapshot of all day rows

### Expected Results
- [ ] A success toast appears with text like "Horario de Lunes aplicado a todos los dias abiertos"
- [ ] All open (non-closed) day rows now show the same times as Lunes (08:00 to 23:00)
- [ ] Any day marked as "Cerrado" retains its closed state and does not get the new times
- [ ] The "Aplicar a todos" button is present on every open day row

---

## D7: Step 2 -- Mark a Day as Closed

**Role:** org_admin (continue from D6)

### Steps
1. From Step 2, locate the "Domingo" row
2. Check the "Cerrado" checkbox for Domingo
3. Take a snapshot of the Domingo row

### Expected Results
- [ ] When "Cerrado" is checked, the time dropdowns for Domingo disappear (are hidden)
- [ ] The "Aplicar a todos" button for Domingo is no longer visible
- [ ] The Domingo row is visually distinct (no time selectors shown)
- [ ] Other day rows are unaffected and still show their times
- [ ] Unchecking "Cerrado" would bring back the time dropdowns (do not uncheck -- leave closed for the next step)

---

## D8: Step 3 -- Amenity Chips Selection

**Role:** org_admin (continue from D7)

### Steps
1. From Step 2, click the "Siguiente" button to save the schedule and advance
2. Wait for Step 3 to load
3. Take a snapshot of Step 3 (Fotos) content
4. Verify the step indicator now highlights step 3 ("Fotos")
5. Scroll down to find the "Amenidades" section (below the photos section)
6. Note the heading "Amenidades" with subtitle "Selecciona las amenidades que ofrece tu local"
7. Look for amenity chip buttons. Available options include: Estacionamiento, Canchas Techadas, Cafe/Snacks, Duchas, Lockers, Alquiler de Equipos, WiFi, Accesible, Area Kids, Pro Shop
8. Note that "Estacionamiento" may already be selected (seeded data has `["estacionamiento", "vestuarios"]`)
9. Click the "WiFi" chip button
10. Click the "Duchas" chip button
11. Take a snapshot of the amenity chips area
12. Click "WiFi" again to deselect it
13. Take a snapshot

### Expected Results
- [ ] Amenity chips are displayed as rounded buttons in a flex-wrap layout
- [ ] Selected chips have a blue border and blue background (`border-blue-600 bg-blue-50 text-blue-700`)
- [ ] Unselected chips have a gray border and white background
- [ ] Clicking a chip toggles its selection state
- [ ] A success toast "Amenidades actualizadas" appears after each toggle (amenities are saved immediately)
- [ ] After clicking WiFi and Duchas, both appear selected (blue styling)
- [ ] After clicking WiFi again, it returns to unselected (gray styling)
- [ ] The "Completar Configuracion" button is visible in the bottom right (instead of "Siguiente")
- [ ] Photo upload section is visible above amenities with message about recommending at least 3 photos

**Note:** Photo upload functionality requires Cloudflare Images API keys. If not configured, the upload component may show an error or disabled state. This is expected in local development. Skip photo upload testing if Cloudflare credentials are not available.

---

## D9: Setup Banner on Dashboard Shows Progress

**Role:** org_admin (continue from D8 -- navigate back without completing setup)

### Steps
1. From Step 3, click the "Atras" button twice to go back to Step 1
2. Click the "Configurar mas tarde" button on Step 1 to exit the wizard
3. Wait for redirect to the facilities list
4. Click on "Padel Club La Molina" to go to its dashboard
5. Take a snapshot of the dashboard page
6. Look for the setup banner with amber/yellow background

### Expected Results
- [ ] Setup banner is visible at the top of the dashboard with amber background (`bg-amber-50`)
- [ ] Banner heading shows "Configuracion pendiente"
- [ ] Banner description mentions the facility is inactive and needs configuration to activate
- [ ] A progress bar is visible showing "X de Y pasos" completed
- [ ] A step checklist shows the status of each step: Canchas (check/cross), Horarios (check/cross), Precios (check/cross)
- [ ] Steps that are completed show a green check icon
- [ ] Steps that are incomplete show an amber minus/cross icon
- [ ] A "Continuar configuracion" link/button is present pointing to the setup wizard
- [ ] The banner has a dismiss (X) button in the top right corner

---

## D10: Wizard Auto-Resumes from Correct Step

**Role:** org_admin (continue from D9)

### Steps
1. From the La Molina dashboard, note which steps are completed vs incomplete from the banner
2. Since La Molina has courts with pricing (seeded) but the schedule was saved in D5-D7, the wizard should auto-detect progress
3. Navigate directly to the setup wizard URL by clicking "Continuar configuracion" on the banner
4. Take a snapshot of the setup wizard
5. Note which step the wizard opens on
6. Now navigate directly to the setup URL with a `?step=1` query param: go to `http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/setup?step=1` (use the facilityId from the URL)
7. Take a snapshot -- wizard should open on Step 1 since step=1 is reachable

### Expected Results
- [ ] The wizard auto-detects the first incomplete step and opens there
- [ ] Since La Molina has courts + pricing (seeded), and schedule was saved in D5-D7, the wizard should open on Step 3 (Fotos)
- [ ] If schedule was NOT saved (e.g., fresh seed without running D5-D7), wizard opens on Step 2 (Horarios)
- [ ] The step indicator reflects which steps are completed (filled blue circles with checkmarks) vs current (numbered blue circle) vs future (gray circles)
- [ ] Clicking a completed step circle in the indicator navigates back to that step
- [ ] When navigating with `?step=1`, the wizard opens on Step 1 since it is a completed/reachable step
- [ ] Completed step circles are clickable, future step circles are not clickable

---

## Reporting

After running all 10 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| D1: Setup wizard loads | PASS/FAIL | |
| D2: Add a court | PASS/FAIL | |
| D3: Edit existing court | PASS/FAIL | |
| D4: Court pricing | PASS/FAIL | |
| D5: Set operating hours | PASS/FAIL | |
| D6: Aplicar a todos | PASS/FAIL | |
| D7: Mark day as closed | PASS/FAIL | |
| D8: Amenity chips | PASS/FAIL | |
| D9: Setup banner progress | PASS/FAIL | |
| D10: Wizard auto-resume | PASS/FAIL | |

**Result: X/10 passed**
