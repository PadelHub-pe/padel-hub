# Suite E: Schedule & Pricing

Verifies operating hours management, peak period CRUD, facility default pricing, court-level custom pricing, revenue calculator, and blocked time slots.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

## Shared Setup: Login as org_admin

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for redirect to `/org/padel-group-lima/facilities`
6. Click on an active facility card (e.g., "Padel Club San Isidro")
7. Note the facility URL — this is the `{basePath}` for subsequent scenarios

---

## E1: View Operating Hours Page

**Role:** org_admin (continue from setup)

### Steps
1. Click "Horarios" in the facility sidebar navigation
2. Wait for the schedule page to load
3. Take a snapshot of the page

### Expected Results
- [ ] Page title is "Horarios y Disponibilidad"
- [ ] Subtitle text reads "Configura los horarios de operacion y periodos pico de tu instalacion"
- [ ] "Horarios de Operacion" card is visible with 7 day rows
- [ ] Days are displayed in order: Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo
- [ ] Each open day shows time range (e.g., "08:00 - 22:00")
- [ ] Closed days show a "Cerrado" badge
- [ ] "Editar" button is present in the card header
- [ ] "Periodos Pico" card is visible
- [ ] "Horarios Bloqueados" section is visible (spans full width below)
- [ ] "Bloquear Horario" button appears in both the page header and the blocked slots section header

---

## E2: Edit Operating Hours for a Specific Day

**Role:** org_admin (continue from E1)

### Steps
1. In the "Horarios de Operacion" card, click the "Editar" button
2. Take a snapshot to verify edit mode is active
3. Locate the "Lunes" (Monday) row
4. Verify the Abierto/Cerrado checkbox is checked (open)
5. Change the open time select to "09:00" (if different from current)
6. Change the close time select to "21:00" (if different from current)
7. Click "Guardar"
8. Wait for the success toast
9. Take a snapshot

### Expected Results
- [ ] Edit mode shows checkboxes (Abierto/Cerrado) for each day
- [ ] Each open day row shows two time select dropdowns (open/close)
- [ ] Time options are in 30-minute increments from 05:00 to 23:30
- [ ] "Aplicar a todos" button appears on each open day row
- [ ] "Guardar" and "Cancelar" buttons replace the "Editar" button
- [ ] "Guardar" button is disabled until changes are made
- [ ] After saving, success toast "Horarios actualizados" appears
- [ ] Lunes row now shows "09:00 - 21:00" in view mode
- [ ] Edit mode is exited after save

---

## E3: "Aplicar a todos" Copies Hours to All Days

**Role:** org_admin (continue from E2)

### Steps
1. Click "Editar" in the "Horarios de Operacion" card
2. On the "Lunes" row, click "Aplicar a todos"
3. Wait for the toast notification
4. Take a snapshot to verify all open days updated
5. Click "Guardar"
6. Wait for success toast

### Expected Results
- [ ] Toast message appears: "Horario de Lunes aplicado a todos los dias abiertos"
- [ ] All open day rows now show the same open/close times as Lunes
- [ ] Closed days remain unchanged (still show Cerrado)
- [ ] "Guardar" button becomes enabled (form is dirty)
- [ ] After saving, all open days reflect the copied schedule

---

## E4: Create Peak Period

**Role:** org_admin (continue from E3)

### Steps
1. In the "Periodos Pico" card, click the "Agregar" button
2. Wait for the dialog to open
3. Take a snapshot of the dialog
4. Fill "Nombre" with "Horario Nocturno"
5. Click the "Lun-Vie" shortcut button to select weekdays
6. Change "Hora inicio" select to "18:00"
7. Change "Hora fin" select to "22:00"
8. Set "Incremento (%)" input to "30"
9. Click "Crear Periodo"
10. Wait for success toast
11. Take a snapshot

### Expected Results
- [ ] Dialog title is "Agregar Periodo Pico"
- [ ] Dialog description is "Define un periodo con tarifa especial"
- [ ] Name input, day selection, time range, and markup fields are present
- [ ] Day shortcut buttons visible: "Lun-Vie", "Sab-Dom", "Todos"
- [ ] Individual day toggle pills: Dom, Lun, Mar, Mie, Jue, Vie, Sab
- [ ] Clicking "Lun-Vie" highlights Lun through Vie pills in amber
- [ ] Time selects show 30-minute options from 05:00 to 23:00
- [ ] Markup input accepts numbers 0-200
- [ ] "Crear Periodo" button submits the form
- [ ] Toast "Periodo pico creado" appears on success
- [ ] New peak period card appears in the "Periodos Pico" section
- [ ] Card shows name "Horario Nocturno", "+30%", time range "18:00 - 22:00"
- [ ] Card shows highlighted day pills for Lun-Vie

---

## E5: Edit Peak Period

**Role:** org_admin (continue from E4)

### Steps
1. On the "Horario Nocturno" peak period card, click the pencil/edit icon button
2. Wait for the edit dialog to open
3. Take a snapshot to verify pre-filled values
4. Change "Incremento (%)" to "40"
5. Click "Guardar Cambios"
6. Wait for success toast
7. Take a snapshot

### Expected Results
- [ ] Dialog title is "Editar Periodo Pico"
- [ ] Name field is pre-filled with "Horario Nocturno"
- [ ] Days are pre-selected (Lun-Vie)
- [ ] Start time shows "18:00", end time shows "22:00"
- [ ] Markup shows "30"
- [ ] After changing markup to 40, "Guardar Cambios" button is enabled
- [ ] Toast "Periodo actualizado" appears on success
- [ ] Peak period card now shows "+40%" badge

---

## E6: Delete Peak Period (Confirmation Dialog)

**Role:** org_admin (continue from E5)

### Steps
1. On the "Horario Nocturno" peak period card, click the trash/delete icon button
2. Wait for the confirmation dialog to open
3. Take a snapshot
4. Click "Eliminar" to confirm
5. Wait for success toast
6. Take a snapshot

### Expected Results
- [ ] Confirmation dialog title is "Eliminar periodo"
- [ ] Dialog description includes the period name: 'Eliminar periodo "Horario Nocturno"?'
- [ ] Dialog mentions existing bookings will keep their original price
- [ ] "Cancelar" and "Eliminar" buttons are visible (Eliminar is destructive/red)
- [ ] Toast "Periodo eliminado" appears on confirm
- [ ] Peak period card is removed from the section
- [ ] If no more periods exist, empty state message appears: "No hay periodos pico configurados"

---

## E7: View Facility Default Pricing

**Role:** org_admin (continue from E6)

### Steps
1. Click "Precios" in the facility sidebar navigation
2. Wait for the pricing page to load
3. Take a snapshot

### Expected Results
- [ ] Page shows header section with title/description
- [ ] "Tarifas por Defecto" section is visible with "Editar" button
- [ ] Two rate cards are displayed side by side:
  - [ ] "Horario Regular" card (green/emerald themed) showing S/ price per hour
  - [ ] "Hora Pico" card (amber/orange themed) showing S/ price per hour with "PICO" badge
- [ ] Each card shows percentage of weekly hours and a progress bar
- [ ] If markup exists, the peak card shows "+X% incremento" badge
- [ ] "Tarifas por Cancha" table section is visible
- [ ] "Ingreso Semanal Estimado" calculator section (blue gradient) is visible
- [ ] "Periodos Pico" section is visible at the bottom

---

## E8: Edit Facility Default Rates

**Role:** org_admin (continue from E7)

### Steps
1. In the "Tarifas por Defecto" section, click "Editar"
2. Take a snapshot of edit mode
3. Note the current regular and peak prices
4. Change the regular rate input to "80" (soles)
5. Change the peak rate input to "110" (soles)
6. Verify the computed markup updates dynamically
7. Click "Guardar"
8. Wait for the page to refresh
9. Take a snapshot

### Expected Results
- [ ] Edit mode replaces price display with number inputs
- [ ] Regular rate card shows an input labeled "Precio por hora (S/)"
- [ ] Peak rate card shows an input labeled "Precio por hora (S/)"
- [ ] "Guardar" and "Cancelar" buttons appear
- [ ] "Guardar" is disabled if peak rate < regular rate
- [ ] If peak < regular, red error text appears: "Debe ser igual o mayor a la tarifa regular"
- [ ] After saving, the "Horario Regular" card shows "S/ 80 /hora"
- [ ] The "Hora Pico" card shows "S/ 110 /hora"
- [ ] Markup badge updates to reflect the new percentage (e.g., "+38%")

### Cleanup
- Reset the rates back to original values by clicking "Editar" again and reverting

---

## E9: View Court Pricing Table

**Role:** org_admin (continue from E8)

### Steps
1. Scroll to the "Tarifas por Cancha" section
2. Take a snapshot

### Expected Results
- [ ] Table heading says "Tarifas por Cancha"
- [ ] Helper text: "Las canchas sin precio personalizado usan la tarifa por defecto del local"
- [ ] Table has columns: Cancha, Tipo, Tarifa Regular, Tarifa Pico, Estado, Accion
- [ ] Each court row shows court name with a colored dot indicator
- [ ] Type column shows "Indoor" (blue badge) or "Outdoor" (green badge)
- [ ] Courts using defaults show prices in gray text with "Por defecto" status badge
- [ ] Courts with custom prices show prices in color (green for regular, amber for peak) with "Personalizado" status badge (blue)
- [ ] Each row has an "Editar" link/button in the action column

---

## E10: Edit Court Custom Pricing (Override Dialog)

**Role:** org_admin (continue from E9)

### Steps
1. In the court pricing table, find a court that shows "Por defecto" status
2. Click the "Editar" button on that court row
3. Wait for the pricing dialog to open
4. Take a snapshot
5. Fill "Tarifa regular por hora (S/)" with "90"
6. Fill "Tarifa hora pico por hora (S/)" with "120"
7. Click "Guardar precio personalizado"
8. Wait for success toast
9. Take a snapshot to verify the table updated

### Expected Results
- [ ] Dialog title is "Editar Precio - [Court Name]"
- [ ] Description: "Configura las tarifas por hora para esta cancha"
- [ ] Two input fields: regular rate and peak rate (in soles)
- [ ] If court had no custom price, info box shows: "Esta cancha usa las tarifas por defecto del local"
- [ ] "Guardar precio personalizado" button is present
- [ ] "Cancelar" button is present
- [ ] "Restablecer a valores por defecto" link is NOT shown (since court was using defaults)
- [ ] Toast "Precio actualizado" appears on success
- [ ] Court row now shows colored prices (green regular, amber peak) instead of gray
- [ ] Status badge changes from "Por defecto" to "Personalizado"

---

## E11: Reset Court to Facility Defaults

**Role:** org_admin (continue from E10)

### Steps
1. In the court pricing table, find the court that was just given custom pricing (from E10)
2. Click "Editar" on that court row
3. Take a snapshot to verify the dialog shows current custom prices
4. Click "Restablecer a valores por defecto"
5. Wait for success toast
6. Take a snapshot

### Expected Results
- [ ] Dialog shows the court's current custom prices in the input fields
- [ ] "Restablecer a valores por defecto" link is now visible (since court has custom pricing)
- [ ] Toast "Precio restablecido a valores por defecto" appears after clicking reset
- [ ] Court row in table now shows gray-colored prices (facility defaults)
- [ ] Status badge reverts from "Personalizado" to "Por defecto"

---

## E12: Revenue Calculator (Slider and Monthly Toggle)

**Role:** org_admin (continue from E11)

### Steps
1. Scroll to the revenue calculator section (blue gradient card)
2. Take a snapshot
3. Note the default values (70% occupancy, weekly view)
4. Click the "80%" preset button
5. Wait for the revenue estimate to update
6. Take a snapshot
7. Click the "Ver proyeccion mensual" button
8. Take a snapshot

### Expected Results
- [ ] Calculator section has blue gradient background
- [ ] Title shows "Ingreso Semanal Estimado" initially
- [ ] Subtitle shows occupancy percentage and court count
- [ ] Large revenue number displayed (e.g., "S/ X,XXX")
- [ ] Occupancy slider is present (range 10-100, step 5)
- [ ] Preset buttons visible: 50%, 60%, 70%, 80%, 90%
- [ ] 70% button is initially highlighted (white background)
- [ ] Revenue breakdown shows three columns: "Horas Regulares", "Horas Pico", "Bonus Hora Pico"
- [ ] After clicking 80%, the 80% button highlights and revenue increases
- [ ] Revenue numbers update reactively
- [ ] After clicking "Ver proyeccion mensual":
  - [ ] Title changes to "Ingreso Mensual Estimado"
  - [ ] Revenue amounts increase (approximately 4.33x weekly)
  - [ ] Button text changes to "Ver proyeccion semanal"

---

## E13: Block Time Slot

**Role:** org_admin (continue from E12)

### Steps
1. Navigate back to the schedule page by clicking "Horarios" in the sidebar
2. Click the "Bloquear Horario" button in the page header
3. Wait for the dialog to open
4. Take a snapshot of the dialog
5. Check the "Todas las canchas" checkbox
6. The date field should default to today's date
7. Change "Hora inicio" to "10:00"
8. Change "Hora fin" to "12:00"
9. Leave "Motivo" as "Mantenimiento" (default)
10. Optionally type "Reparacion de piso" in the "Notas (opcional)" textarea
11. Click "Bloquear Horario" button
12. Wait for success toast
13. Take a snapshot of the blocked slots section

### Expected Results
- [ ] Dialog title is "Bloquear Horario"
- [ ] Dialog description: "Bloquea un rango de tiempo para mantenimiento, eventos u otras razones"
- [ ] "Canchas" section shows "Todas las canchas" checkbox
- [ ] When "Todas las canchas" is unchecked, individual court checkboxes appear
- [ ] "Fecha" field is a date input (min = today)
- [ ] Time range selects show 30-minute increments
- [ ] "Motivo" dropdown options: Mantenimiento, Evento privado, Torneo, Clima, Otro
- [ ] "Notas (opcional)" textarea is present (max 500 chars)
- [ ] If blocking conflicts with existing bookings, amber warning appears showing conflicting booking details
- [ ] Toast "Horario bloqueado" appears on success
- [ ] New blocked slot card appears in the "Horarios Bloqueados" section
- [ ] Card shows date (formatted as "EEE dd/MM"), time range, reason badge ("Mantenimiento" in orange)
- [ ] Card shows "Todas las canchas" text and any notes
- [ ] Card has a trash icon button for deletion

### Cleanup
- Delete the blocked slot by clicking the trash icon, then clicking "Confirmar" on the double-click confirmation

---

## Reporting

After running all 13 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| E1: View operating hours | PASS/FAIL | |
| E2: Edit operating hours | PASS/FAIL | |
| E3: Aplicar a todos | PASS/FAIL | |
| E4: Create peak period | PASS/FAIL | |
| E5: Edit peak period | PASS/FAIL | |
| E6: Delete peak period | PASS/FAIL | |
| E7: View facility default pricing | PASS/FAIL | |
| E8: Edit facility default rates | PASS/FAIL | |
| E9: View court pricing table | PASS/FAIL | |
| E10: Edit court custom pricing | PASS/FAIL | |
| E11: Reset court to defaults | PASS/FAIL | |
| E12: Revenue calculator | PASS/FAIL | |
| E13: Block time slot | PASS/FAIL | |

**Result: X/13 passed**
