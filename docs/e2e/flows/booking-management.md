# Suite F: Booking Management

Verifies the bookings list view, filtering and search, manual booking creation, booking detail page, status transitions (confirm/cancel), player management (add/remove), status badges, pagination, staff role restrictions, **overlap/conflict detection, form validation, status edge cases, player capacity limits, pricing accuracy, data integrity after mutations, and role-based booking restrictions**.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`) -- provides 17+ bookings across facilities
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

## Shared Setup: Login as org_admin

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for redirect to `/org/padel-group-lima/facilities`
6. Click on "Padel Club San Isidro" (active facility with 4 courts)
7. Click "Reservas" in the facility sidebar
8. Wait for the bookings page to load
9. Note the `{basePath}` from the URL for later use

---

## F1: View Bookings List with Seeded Data

**Role:** org_admin (continue from setup)

### Steps
1. Take a snapshot of the bookings page
2. Inspect the table structure and data

### Expected Results
- [ ] Page title is "Reservas"
- [ ] Subtitle is "Gestiona todas las reservas de tu local"
- [ ] "Agregar Reserva" button is visible in the header
- [ ] Filter section is visible with:
  - [ ] Search input with placeholder "Buscar reservas..."
  - [ ] Court filter dropdown ("Todas las canchas")
  - [ ] Date range picker button ("Rango de fechas")
- [ ] Status chip row shows: Pendiente, Confirmada, En Progreso, Completada, Cancelada, Partido Abierto
- [ ] Data table is visible with columns: CODIGO, FECHA, HORARIO, CANCHA, JUGADORES, PRECIO, ESTADO, (actions)
- [ ] Table shows seeded bookings (at least a few rows visible)
- [ ] Each booking row shows:
  - [ ] Booking code as a blue clickable link (mono font)
  - [ ] Date formatted as relative ("Hoy", "Manana") or as "EEE d MMM"
  - [ ] Time range (e.g., "08:00 - 09:30") with duration below (e.g., "1h 30m")
  - [ ] Court name with colored badge
  - [ ] Player count badge
  - [ ] Price in soles (e.g., "S/ 80") with optional "Hora punta" label
  - [ ] Status badge with appropriate color
  - [ ] Three-dot actions menu icon
- [ ] Pagination is visible at the bottom showing "Mostrando X-Y de Z reservas"
- [ ] "Anterior" and "Siguiente" pagination buttons are present

---

## F2: Filter Bookings by Status

**Role:** org_admin (continue from F1)

### Steps
1. Note the total count from pagination text
2. Click the "Confirmada" status chip in the filter row
3. Wait for the table to update
4. Take a snapshot
5. Note the new count from pagination
6. Click the "Pendiente" status chip (add to existing filter)
7. Wait for the table to update
8. Take a snapshot
9. Click "Limpiar filtros" to reset

### Expected Results
- [ ] Clicking "Confirmada" chip highlights it (blue border + blue background)
- [ ] Table filters to only show bookings with "Confirmada" status badge
- [ ] URL updates to include `?status=confirmed`
- [ ] Pagination count decreases to match filtered results
- [ ] Adding "Pendiente" chip shows both confirmed and pending bookings
- [ ] URL updates to `?status=confirmed,pending`
- [ ] "Limpiar filtros" button appears when any filter is active
- [ ] Clicking "Limpiar filtros" removes all active filters and shows full list

---

## F3: Filter Bookings by Date Range

**Role:** org_admin (continue from F2)

### Steps
1. Click the "Rango de fechas" button
2. Wait for the date range popover to open
3. Take a snapshot of the popover
4. Click the "Hoy" preset button
5. Wait for the table to update
6. Take a snapshot
7. Note filtered results
8. Click "Rango de fechas" button again to reopen
9. Click "Limpiar rango" to clear the date filter
10. Take a snapshot

### Expected Results
- [ ] Date range popover opens with preset buttons: "Hoy", "Esta semana", "Este mes"
- [ ] Custom date inputs are present with "Desde" and "Hasta" labels
- [ ] Clicking "Hoy" filters bookings to only today's date
- [ ] Date range button text changes to show selected range (e.g., "16/03 - 16/03")
- [ ] URL updates with `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- [ ] Filtered results only show bookings matching today's date
- [ ] "Limpiar rango" button appears inside the popover when a range is set
- [ ] Clearing the range restores the full booking list

---

## F4: Search Bookings by Code

**Role:** org_admin (continue from F3)

### Steps
1. From the booking table, read the booking code of the first visible row (e.g., "PAD-XXXXX")
2. Click in the search input ("Buscar reservas...")
3. Type the first few characters of the booking code (e.g., "PAD-")
4. Wait 300ms for debounce to trigger
5. Take a snapshot
6. Clear the search input

### Expected Results
- [ ] Search input accepts text and shows it
- [ ] After debounce delay, table filters to show matching bookings
- [ ] URL updates with `?q=PAD-` (search term)
- [ ] If a booking code matches, that booking appears in the results
- [ ] If no bookings match, empty state is shown
- [ ] Clearing the search input restores the full list

---

## F5: Create Manual Booking

**Role:** org_admin (continue from F4)

### Steps
1. Click the "Agregar Reserva" button in the page header
2. Wait for the "Nueva reserva" dialog to open
3. Take a snapshot of the dialog
4. In "Cancha *", select the first available court from the dropdown
5. **Note the selected court name** for use in F14/F15
6. The "Fecha *" field should default to today -- leave as is
7. In "Hora inicio *", select "10:00 AM" (value "10:00")
8. In "Duracion *", select "1.5 horas" (value "90")
9. Verify the computed time summary appears (e.g., "lun 16 mar . 10:00 AM -- 11:30 AM")
10. Fill "Nombre del cliente *" with "Juan Test"
11. Fill "Telefono" with "999111222"
12. Fill "Email" with "juan@test.com"
13. In "Metodo de pago", select "Efectivo"
14. Take a snapshot showing the filled form and price preview
15. Click "Crear reserva"
16. Wait for success toast
17. Take a snapshot of the updated bookings list

### Expected Results
- [ ] Dialog title is "Nueva reserva"
- [ ] Court dropdown shows all courts for this facility
- [ ] Date input defaults to today's date
- [ ] Start time dropdown shows time slots in operating hours (filtered by schedule)
- [ ] Duration options: "1 hora", "1.5 horas", "2 horas"
- [ ] Time summary bar appears after selecting start time and duration, showing day/date and computed end time
- [ ] If the slot is during peak hours, "Horario pico" badge appears in the summary
- [ ] Price preview shows calculated price (e.g., "S/ 120.00")
- [ ] "Jugadores adicionales" section shows "Sin jugadores adicionales" and "+ Agregar jugador" button
- [ ] Payment method options: Efectivo, Tarjeta, App
- [ ] Toast "Reserva creada exitosamente" appears on success
- [ ] Dialog closes after creation
- [ ] New booking appears in the bookings list

---

## F6: View Booking Detail Page

**Role:** org_admin (continue from F5)

### Steps
1. In the bookings table, click on a booking row (not the code link, but the row itself)
2. Wait for the detail drawer to slide in from the right
3. Take a snapshot of the drawer
4. In the drawer, click "Ver detalle completo"
5. Wait for the full booking detail page to load
6. Take a snapshot

### Expected Results
- [ ] Clicking a row opens a drawer panel from the right side
- [ ] Drawer header shows "Detalles de reserva" with a close (X) button
- [ ] Drawer shows booking code (blue mono font) and status badge
- [ ] Drawer sections: Cliente, Cancha, Fecha y hora, Precio, Notes (if any)
- [ ] "Ver detalle completo" link is present with arrow icon
- [ ] If booking is pending/confirmed, action buttons appear at the bottom: "Confirmar" and/or "Cancelar reserva"
- [ ] Full detail page shows:
  - [ ] Booking code as large header with status badge and player count badge
  - [ ] Court visualization (visual padel court diagram)
  - [ ] Booking info panel with date, time, price, payment details
  - [ ] Player grid (4 positions, showing filled and empty slots)
  - [ ] Activity timeline at the bottom
  - [ ] "Confirmar" button (if pending) and "Cancelar reserva" button

---

## F7: Confirm a Pending Booking

**Role:** org_admin (continue from F6)

### Steps
1. Navigate to the bookings list
2. Find a booking with "Pendiente" status badge (yellow)
3. Click on the booking row to open the drawer
4. In the drawer, click "Confirmar"
5. Wait for success toast
6. Take a snapshot
7. Close the drawer
8. Verify the booking row in the table now shows "Confirmada" status

### Expected Results
- [ ] "Confirmar" button is visible in the drawer footer for pending bookings
- [ ] Button shows "Confirmando..." while processing
- [ ] Toast "Reserva confirmada" appears on success
- [ ] Status badge in the drawer updates to "Confirmada" (green)
- [ ] After closing drawer, the booking row in the table shows green "Confirmada" badge
- [ ] The "Confirmar" button disappears from the drawer (now confirmed)

### Alternative path (via detail page)
- On the full detail page, the "Confirmar" button is also available in the header actions area

### Alternative path (via actions menu)
- Click the three-dot menu on a pending booking row
- Select "Confirmar" from the dropdown

---

## F8: Cancel a Booking with Reason

**Role:** org_admin (continue from F7)

### Steps
1. In the bookings table, find a booking with "Confirmada" or "Pendiente" status
2. Click on the booking row to open the drawer
3. Click "Cancelar reserva" button
4. Wait for the cancel dialog to appear
5. Take a snapshot of the cancel dialog
6. In "Motivo (opcional)", select "Solicitud del jugador"
7. In "Nota interna (opcional)", type "Cliente solicito cambio de dia"
8. Click "Cancelar reserva" (the red/destructive button)
9. Wait for success toast
10. Take a snapshot

### Expected Results
- [ ] Cancel dialog appears with title "Cancelar reserva [CODE]?" (or "Cancelar reserva")
- [ ] Booking summary is shown: court name, date, time range
- [ ] If booking has players, notification count text appears (e.g., "2 jugadores seran notificados")
- [ ] Dropdown "Motivo (opcional)" has options: Solicitud del jugador, No-show, Mantenimiento de cancha, Evento privado, Error de reserva, Otro
- [ ] "Nota interna (opcional)" textarea is present (placeholder: "Nota interna, no visible para el jugador...")
- [ ] "Volver" button closes the dialog without cancelling
- [ ] "Cancelar reserva" button (red/destructive) shows "Cancelando..." while processing
- [ ] Toast "Reserva cancelada" appears on success
- [ ] Booking now shows "Cancelada" status badge (red)
- [ ] In the drawer or detail page, cancellation info section appears (red background) showing who cancelled, reason, and timestamp

---

## F9: Add Player to Booking

**Role:** org_admin (continue from F8)

### Steps
1. Navigate to the full detail page of a confirmed or pending booking (click on a booking code link, or use drawer "Ver detalle completo")
2. Scroll to the player grid section
3. Find an empty player position slot (positions 2, 3, or 4)
4. Click the add player button (+ icon) on an empty position
5. Wait for the "Agregar jugador" dialog to open
6. Take a snapshot
7. The dialog should show two tabs: "Buscar usuario" and "Jugador invitado"
8. Click the "Jugador invitado" tab
9. Fill "Nombre *" with "Carlos Test"
10. Fill "Email" with "carlos@test.com"
11. Click "Agregar jugador"
12. Wait for success toast
13. Take a snapshot of the updated player grid

### Expected Results
- [ ] Player grid shows 4 position slots (labeled 1-4)
- [ ] Position 1 always shows the booking creator/customer
- [ ] Empty positions show an add button (+ icon or similar)
- [ ] "Agregar jugador" dialog opens with title and position number in description ("Posicion X")
- [ ] "Buscar usuario" tab is active by default with search input
- [ ] Search tab shows "Escribe para buscar usuarios" placeholder when empty
- [ ] "Jugador invitado" tab shows a form with Name (required), Email, and Phone fields
- [ ] Guest form validates that name is required
- [ ] Toast "Jugador agregado" appears on success
- [ ] Player grid updates to show the new player in the assigned position
- [ ] Player count badge in the header increments

---

## F10: Remove Player from Booking

**Role:** org_admin (continue from F9)

### Steps
1. On the same booking detail page, find the player added in F9 (e.g., "Carlos Test")
2. Click the remove/trash button on that player's position card
3. Wait for the confirmation dialog
4. Take a snapshot
5. Click "Remover" to confirm
6. Wait for success toast
7. Take a snapshot

### Expected Results
- [ ] Remove button is visible on non-primary player positions (positions 2-4)
- [ ] Confirmation dialog title: "Remover jugador?"
- [ ] Dialog description shows player name and position: "[Name] de la posicion [N]"
- [ ] Warning message: "Esta accion no se puede deshacer" (amber background)
- [ ] "Cancelar" and "Remover" (destructive/red) buttons present
- [ ] "Remover" button shows "Removiendo..." while processing
- [ ] Toast "Jugador removido" appears on success
- [ ] Player position reverts to empty slot with add button
- [ ] Player count badge decrements

---

## F11: Status Badges Display Correctly

**Role:** org_admin (continue from F10)

### Steps
1. Navigate back to the bookings list
2. Take a snapshot
3. Inspect the status badges across all visible booking rows

### Expected Results
- [ ] "Pendiente" badges have yellow background (`bg-yellow-100`) with yellow text (`text-yellow-700`)
- [ ] "Confirmada" badges have green background (`bg-green-100`) with green text (`text-green-700`)
- [ ] "En Progreso" badges have amber background (`bg-amber-100`) with amber text (`text-amber-700`)
- [ ] "Completada" badges have gray background (`bg-gray-100`) with gray text (`text-gray-600`)
- [ ] "Cancelada" badges have red background (`bg-red-100`) with red text (`text-red-700`)
- [ ] Cancelled bookings show their code with line-through styling and reduced opacity
- [ ] Bookings starting within 30 minutes show "Comienza pronto" label above the date in amber text
- [ ] Peak-rate bookings show "Hora punta" text below the price in amber

---

## F12: Pagination

**Role:** org_admin (continue from F11)

### Steps
1. Ensure no filters are active (click "Limpiar filtros" if needed)
2. Check the pagination text at the bottom (e.g., "Mostrando 1-10 de 17 reservas")
3. If total > 10, click "Siguiente" button
4. Take a snapshot of page 2
5. Click "Anterior" button
6. Take a snapshot to confirm return to page 1

### Expected Results
- [ ] Pagination shows "Mostrando X-Y de Z reservas" with correct counts
- [ ] Page size is 10 bookings per page
- [ ] "Anterior" button is disabled on page 1
- [ ] "Siguiente" button is disabled on the last page
- [ ] Clicking "Siguiente" loads the next set of bookings
- [ ] URL updates with `?page=2`
- [ ] Clicking "Anterior" returns to the previous page
- [ ] Booking data changes between pages (different booking codes visible)
- [ ] If total bookings <= 10, pagination text shows correct range and both buttons may be disabled

---

## F13: Staff Can View Bookings but Has Limited Actions

**Role:** staff (`staff@padelhub.pe`)

### Steps
1. Sign out from the current session (click sign out in sidebar, confirm if needed)
2. Navigate to `http://localhost:3000/login`
3. Fill email field with `staff@padelhub.pe`
4. Fill password field with `password123`
5. Click the login button
6. Wait for redirect
7. Navigate to the bookings page for the assigned facility (Padel Club San Isidro)
8. Take a snapshot
9. Click on a booking row to open the detail drawer
10. Take a snapshot of the drawer

### Expected Results
- [ ] Staff user can access the bookings page for their assigned facility
- [ ] Bookings table renders with seeded data
- [ ] Staff can see all bookings in the list view
- [ ] Staff can filter and search bookings
- [ ] The "Agregar Reserva" button behavior:
  - [ ] If staff has booking management permission, the button is visible and functional
  - [ ] If staff lacks booking management, the button may be hidden or disabled
- [ ] In the detail drawer or detail page:
  - [ ] Staff can view booking details (code, court, date, time, price, players)
  - [ ] Staff action buttons may be limited compared to org_admin
- [ ] Staff CANNOT access Schedule page (sidebar link should be absent or redirect)
- [ ] Staff CANNOT access Pricing page (sidebar link should be absent or redirect)
- [ ] Staff CANNOT access Courts page (sidebar link should be absent or redirect)

---

# Edge Cases & Reliability

The following scenarios (F14–F32) test conflict detection, validation, error handling, status edge cases, player capacity, pricing accuracy, role restrictions, and data integrity. They exercise the boundaries that make a booking system reliable.

**Setup**: Unless noted otherwise, sign back in as org_admin (`owner@padelhub.pe`) and navigate to the bookings page of Padel Club San Isidro.

---

## F14: Overlap Detection — Same Court, Same Time

**Role:** org_admin

**Depends on:** F5 (booking created at 10:00–11:30 on first court, today)

### Steps
1. Sign out from staff session if still active, log in as `owner@padelhub.pe`
2. Navigate to bookings page of Padel Club San Isidro
3. Click "Agregar Reserva"
4. Select **the same court** used in F5
5. Leave date as today
6. Select "10:00 AM" as start time (value "10:00")
7. Select "1 hora" as duration (value "60")
8. Take a snapshot — inspect the form for conflict warnings **before submitting**
9. Fill "Nombre del cliente *" with "Conflicto Test"
10. Click "Crear reserva"
11. Take a snapshot of the error state

### Expected Results
- [ ] A yellow warning box appears in the form showing overlap info: "**Conflicto:** [Court name] ya tiene reserva de 10:00 a 11:30"
- [ ] The warning appears **before** clicking "Crear reserva" (client-side detection via `getSlotInfo`)
- [ ] If the user submits anyway, server returns CONFLICT error: "La cancha ya tiene una reserva de 10:00 a 11:30"
- [ ] Error is displayed in the form (red text below submit button)
- [ ] The dialog remains open — the user is not kicked out
- [ ] No booking is created (list count unchanged)
- [ ] The user can change the time or court to resolve the conflict

---

## F15: Partial Overlap Detection

**Role:** org_admin (continue from F14)

### Steps
1. In the still-open create dialog (or reopen it), keep the same court from F5
2. Change start time to "10:30 AM" (value "10:30")
3. Set duration to "1 hora" (value "60") — this creates a 10:30–11:30 slot
4. Take a snapshot — inspect for overlap warning

### Expected Results
- [ ] Overlap warning appears because 10:30–11:30 partially overlaps with the F5 booking (10:00–11:30)
- [ ] Warning text references the existing booking's time range
- [ ] The system correctly detects partial overlaps, not just exact matches
- [ ] Close the dialog without creating

---

## F16: Back-to-Back Bookings Are Allowed

**Role:** org_admin (continue from F15)

### Steps
1. Click "Agregar Reserva"
2. Select the **same court** used in F5
3. Leave date as today
4. Select "11:30 AM" as start time (value "11:30") — immediately after the F5 booking ends
5. Select "1 hora" as duration (value "60") — creates 11:30–12:30 slot
6. Take a snapshot — verify **no** conflict warning appears
7. Fill "Nombre del cliente *" with "BackToBack Test"
8. In "Metodo de pago", select "Efectivo"
9. Click "Crear reserva"
10. Wait for success toast

### Expected Results
- [ ] **No** overlap warning appears — back-to-back bookings are valid
- [ ] Toast "Reserva creada exitosamente" appears
- [ ] New booking is created at 11:30–12:30
- [ ] Both bookings (10:00–11:30 and 11:30–12:30) coexist in the list on the same court

---

## F17: Rebook a Cancelled Slot

**Role:** org_admin (continue from F16)

### Steps
1. In the bookings list, find the booking created in F5 (10:00–11:30, "Juan Test")
2. Open the drawer and cancel it (click "Cancelar reserva", confirm with "Cancelar reserva" button)
3. Wait for toast "Reserva cancelada"
4. Close the drawer
5. Click "Agregar Reserva"
6. Select the **same court** used in F5
7. Leave date as today
8. Select "10:00 AM" as start time (value "10:00")
9. Select "1.5 horas" as duration (value "90") — recreates the exact same slot
10. Take a snapshot — verify **no** conflict warning
11. Fill "Nombre del cliente *" with "Rebook Test"
12. In "Metodo de pago", select "Efectivo"
13. Click "Crear reserva"
14. Wait for success toast

### Expected Results
- [ ] After cancelling the original booking, the slot is freed
- [ ] **No** overlap warning appears for the previously-cancelled slot
- [ ] Toast "Reserva creada exitosamente" appears
- [ ] The new booking is created successfully at 10:00–11:30
- [ ] The cancelled booking still appears in the list with "Cancelada" status (red badge, strikethrough)
- [ ] The new booking appears with "Confirmada" status (green badge)

---

## F18: Form Validation — Missing Required Fields

**Role:** org_admin (continue from F17)

### Steps
1. Click "Agregar Reserva"
2. **Do not** fill any fields — leave the form blank
3. Click "Crear reserva" immediately
4. Take a snapshot of validation errors

### Expected Results
- [ ] Form does **not** submit — no network request is made
- [ ] Inline validation errors appear below each required field:
  - [ ] Court: "Selecciona una cancha"
  - [ ] Start time: "Selecciona la hora"
  - [ ] Duration: "Selecciona la duración"
  - [ ] Customer name: "El nombre es requerido"
- [ ] The dialog remains open with error messages visible
- [ ] Error messages are in Spanish
- [ ] After filling the required fields, the errors clear
- [ ] Close the dialog

---

## F19: Cancel Dialog "Volver" Dismisses Without Action

**Role:** org_admin (continue from F18)

### Steps
1. In the bookings table, find a booking with "Confirmada" or "Pendiente" status
2. Note the booking code and current status
3. Open the drawer, click "Cancelar reserva"
4. Wait for the cancel dialog to appear
5. Take a snapshot
6. Click "Volver" (the non-destructive button)
7. Take a snapshot

### Expected Results
- [ ] Cancel dialog opens with booking summary
- [ ] Clicking "Volver" closes the dialog
- [ ] The booking's status is **unchanged** — still shows original status
- [ ] No toast appears
- [ ] No network request is made for cancellation
- [ ] The drawer is still visible behind the dialog (or returns to view after dismiss)

---

## F20: Cancelled Booking — No Action Buttons

**Role:** org_admin (continue from F19)

### Steps
1. In the bookings list, filter by status "Cancelada" (click the "Cancelada" chip)
2. Click on a cancelled booking row to open the drawer
3. Take a snapshot of the drawer
4. Click "Ver detalle completo" to open the full detail page
5. Take a snapshot

### Expected Results
- [ ] In the drawer:
  - [ ] **No** "Confirmar" button is visible
  - [ ] **No** "Cancelar reserva" button is visible
  - [ ] Cancellation info section is shown (red background with who cancelled, reason, timestamp)
- [ ] On the full detail page:
  - [ ] **No** action buttons in the header area ("Confirmar" / "Cancelar reserva" absent)
  - [ ] Cancellation details are displayed
  - [ ] Booking code shows "Cancelada" badge
- [ ] In the three-dot actions menu on the list:
  - [ ] "Confirmar" option is **absent**
  - [ ] "Cancelar" option is **absent**
  - [ ] Only "Ver detalles" is available

---

## F21: Completed Booking — No Action Buttons

**Role:** org_admin (continue from F20)

### Steps
1. Clear filters, then filter by status "Completada" (click the "Completada" chip)
2. If completed bookings exist, click on one to open the drawer
3. Take a snapshot of the drawer
4. Check the three-dot actions menu for the same booking in the list

### Expected Results
- [ ] In the drawer:
  - [ ] **No** "Confirmar" button is visible
  - [ ] **No** "Cancelar reserva" button is visible
  - [ ] Booking shows "Completada" status badge (gray)
- [ ] In the three-dot actions menu:
  - [ ] "Confirmar" option is **absent**
  - [ ] "Cancelar" option is **absent**
  - [ ] Only "Ver detalles" is available
- [ ] If no completed bookings exist in seeded data, skip this scenario (note in report)

---

## F22: Actions Menu Shows Conditional Options per Status

**Role:** org_admin (continue from F21)

### Steps
1. Clear all filters
2. Find a booking with "Pendiente" status — click the three-dot menu
3. Take a snapshot of the menu options
4. Close the menu
5. Find a booking with "Confirmada" status — click the three-dot menu
6. Take a snapshot of the menu options
7. Close the menu

### Expected Results
- [ ] **Pending** booking menu shows: "Ver detalles", "Confirmar", "Cancelar"
- [ ] **Confirmed** booking menu shows: "Ver detalles", "Cancelar" (no "Confirmar")
- [ ] **Confirmed** booking may also show "Editar" option
- [ ] Menu options match the valid state transitions for each status
- [ ] Clicking outside the menu or pressing Escape closes it without action

---

## F23: Auto-Status Resolution on Page Load

**Role:** org_admin (continue from F22)

**Note:** This test verifies that bookings whose start/end time has passed are automatically transitioned to the correct status when the page loads. Depends on seeded bookings having times in the past.

### Steps
1. Navigate to the bookings list (refresh the page)
2. Filter by status "En Progreso" or "Completada"
3. Take a snapshot
4. Find any booking whose time range is entirely in the past
5. Verify its status

### Expected Results
- [ ] Bookings with start time in the past and end time in the future show "En Progreso" (amber)
- [ ] Bookings with both start and end time in the past show "Completada" (gray)
- [ ] The status auto-resolution happens transparently — no user action required
- [ ] Activity timeline on detail pages shows auto-transition entries if applicable
- [ ] If all seeded bookings are in the future, note this in the report — auto-resolution cannot be verified

---

## F24: Player Grid — Fill All 4 Positions

**Role:** org_admin (continue from F23)

### Steps
1. Navigate to a confirmed booking detail page that has empty player positions (click a booking code link)
2. Note how many positions are currently filled (position 1 should always have the owner)
3. Add guest players to fill **all remaining empty positions** (positions 2, 3, 4):
   - For each empty position: click "+" → "Jugador invitado" tab → fill name ("Player N Test") → click "Agregar jugador"
   - Wait for toast "Jugador agregado" between each add
4. Take a snapshot after all 4 positions are filled

### Expected Results
- [ ] After filling all 4 positions, the player count badge shows "4/4"
- [ ] **No** add player button ("+" icon) is visible on any position — all slots are filled
- [ ] Each position shows its player's name and colored left border:
  - [ ] Position 1: Blue border (owner)
  - [ ] Position 2: Green border
  - [ ] Position 3: Amber border
  - [ ] Position 4: Purple border
- [ ] Position 1 shows "Dueño" badge — other positions do not

---

## F25: Owner Position Cannot Be Removed

**Role:** org_admin (continue from F24)

### Steps
1. On the same fully-filled booking detail page
2. Inspect position 1 (the owner/creator)
3. Take a snapshot focusing on position 1's card
4. Compare with position 2's card (a non-owner player)

### Expected Results
- [ ] Position 1 (owner) has **no** remove/trash button visible
- [ ] Positions 2, 3, 4 each have a remove button (X or trash icon)
- [ ] The owner is protected from accidental removal at the UI level
- [ ] Now remove the players added in F24 to clean up (optional — use remove dialog for each)

---

## F26: Price Preview — Regular vs Peak Hours

**Role:** org_admin (continue from F25)

### Steps
1. Click "Agregar Reserva"
2. Select the first court
3. Leave date as today
4. Select a start time during **regular hours** (discover from the time dropdown — pick a morning slot like "08:00 AM")
5. Select "1 hora" duration
6. Take a snapshot — note the price preview value
7. Change the start time to a **peak hour** slot (if peak periods are configured — look for a time where "Horario pico" badge appears in the summary bar)
8. Take a snapshot — note the new price preview value
9. Close the dialog

### Expected Results
- [ ] Price preview updates dynamically when court, time, or duration changes
- [ ] During **regular hours**: price shows the court's regular rate (or facility default)
- [ ] During **peak hours**: price shows a higher amount (markup applied)
- [ ] "Horario pico" orange badge appears in the time summary bar during peak periods
- [ ] If no peak periods are configured for today, the badge never appears — note in report
- [ ] Price format is "S/ XX.XX" (Peruvian Soles)

---

## F27: Facility Manager Creates Booking on Scoped Facility

**Role:** facility_manager (`manager@padelhub.pe`)

### Steps
1. Sign out from org_admin session
2. Log in as `manager@padelhub.pe` (password: `password123`)
3. Wait for redirect to the facility dashboard
4. Navigate to the bookings page (click "Reservas" in sidebar)
5. Click "Agregar Reserva"
6. Fill the form:
   - Select any court
   - Leave date as today
   - Pick an available time slot that has no existing bookings
   - Select "1 hora" duration
   - Customer name: "Manager Booking Test"
   - Payment: "Efectivo"
7. Click "Crear reserva"
8. Wait for success toast
9. Take a snapshot

### Expected Results
- [ ] Facility manager can access the bookings page for their scoped facility
- [ ] "Agregar Reserva" button is visible and functional
- [ ] Booking creation succeeds — toast "Reserva creada exitosamente"
- [ ] New booking appears in the list
- [ ] Manager has full booking management (confirm, cancel, add/remove players) on their scoped facility

---

## F28: Facility Manager Cannot Access Unscoped Facility Bookings

**Role:** facility_manager (continue from F27)

### Steps
1. Note the facilities the manager has access to (should be Padel Club San Isidro and Padel Club Miraflores)
2. Try navigating directly to a facility the manager does **not** have access to:
   - Find the facilityId for "Padel Club La Molina" (the third facility) — this may require checking the URL patterns
   - Navigate to `{basePath}` with La Molina's facilityId + `/bookings`
3. Take a snapshot

### Expected Results
- [ ] If the manager has access to only 2 of 3 facilities, the third should be inaccessible
- [ ] Access is denied — either a redirect or "No tiene permisos" error page
- [ ] The facility sidebar does not show the unscoped facility
- [ ] If the manager has access to all facilities (facilityIds=[]), this test is not applicable — note in report

---

## F29: Create Booking Then Refresh — Data Persists

**Role:** org_admin

### Steps
1. Sign out from facility_manager, log back in as `owner@padelhub.pe`
2. Navigate to bookings page of Padel Club San Isidro
3. Note the current total booking count from pagination
4. Create a new booking:
   - Pick any court, available time slot, "1 hora" duration
   - Customer name: "Persist Test"
   - Payment: "Efectivo"
   - Click "Crear reserva", wait for toast
5. Note the booking code of the new booking
6. **Refresh the page** (navigate to the same URL to simulate browser refresh)
7. Wait for the page to load
8. Take a snapshot

### Expected Results
- [ ] After refresh, the newly created booking is still visible in the list
- [ ] The booking code, customer name, court, time, and status match what was entered
- [ ] Total booking count incremented by 1 compared to pre-creation count
- [ ] Session is preserved — user is still logged in after refresh
- [ ] No data loss or stale cache issues

---

## F30: Cancelled Booking Visual Treatment in List

**Role:** org_admin (continue from F29)

### Steps
1. In the bookings list, ensure cancelled bookings are visible (clear filters if needed, or filter to "Cancelada")
2. Find a cancelled booking row
3. Take a screenshot (not just snapshot — visual verification needed)
4. Compare with a non-cancelled booking row

### Expected Results
- [ ] Cancelled booking code has **line-through** (strikethrough) text decoration
- [ ] Cancelled booking code has **reduced opacity** (60% opacity)
- [ ] Cancelled booking row has "Cancelada" badge in red (`bg-red-100`, `text-red-700`)
- [ ] Non-cancelled bookings show code without strikethrough, full opacity
- [ ] The visual distinction is clear enough to quickly identify cancelled bookings at a glance

---

## F31: Combined Multi-Filter Accuracy

**Role:** org_admin (continue from F30)

### Steps
1. Clear all filters
2. Apply a **status** filter: click "Confirmada" chip
3. Apply a **court** filter: select a specific court from the "Todas las canchas" dropdown
4. Apply a **date range**: click "Rango de fechas" → "Esta semana"
5. Take a snapshot
6. Note the filtered results count
7. Verify each visible row matches ALL active filters
8. Click "Limpiar filtros"
9. Verify all filters reset and full list returns

### Expected Results
- [ ] All three filters combine correctly (AND logic — results must match ALL)
- [ ] URL updates with all filter parameters (e.g., `?status=confirmed&court=xxx&from=...&to=...`)
- [ ] Every visible booking row has:
  - [ ] "Confirmada" status badge
  - [ ] The selected court name
  - [ ] A date within the current week
- [ ] If no bookings match all filters, empty state is shown: "No hay reservas"
- [ ] "Limpiar filtros" resets all filters at once — all chips deselected, court reset to "Todas las canchas", date range cleared
- [ ] Pagination count reflects the filtered total, not the global total

---

## F32: Search with No Results — Empty State

**Role:** org_admin (continue from F31)

### Steps
1. Clear all filters
2. In the search input, type a nonsensical string: "ZZZZ999NOTEXIST"
3. Wait 300ms for debounce
4. Take a snapshot

### Expected Results
- [ ] Table shows empty state — "No hay reservas" (or similar empty state message)
- [ ] No table rows are visible
- [ ] Pagination is hidden or shows "Mostrando 0 de 0"
- [ ] "Limpiar filtros" button is visible to clear the search
- [ ] Clearing the search restores the full booking list

---

## Reporting

After running all 32 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| **Core CRUD & Navigation** | | |
| F1: View bookings list | PASS/FAIL | |
| F2: Filter by status | PASS/FAIL | |
| F3: Filter by date range | PASS/FAIL | |
| F4: Search by code | PASS/FAIL | |
| F5: Create manual booking | PASS/FAIL | |
| F6: View booking detail | PASS/FAIL | |
| F7: Confirm pending booking | PASS/FAIL | |
| F8: Cancel booking with reason | PASS/FAIL | |
| F9: Add player to booking | PASS/FAIL | |
| F10: Remove player from booking | PASS/FAIL | |
| F11: Status badges display | PASS/FAIL | |
| F12: Pagination | PASS/FAIL | |
| F13: Staff limited actions | PASS/FAIL | |
| **Edge Cases & Reliability** | | |
| F14: Overlap — same court same time | PASS/FAIL | |
| F15: Partial overlap detection | PASS/FAIL | |
| F16: Back-to-back bookings allowed | PASS/FAIL | |
| F17: Rebook cancelled slot | PASS/FAIL | |
| F18: Form validation — missing fields | PASS/FAIL | |
| F19: Cancel dialog "Volver" dismiss | PASS/FAIL | |
| F20: Cancelled booking — no actions | PASS/FAIL | |
| F21: Completed booking — no actions | PASS/FAIL | |
| F22: Actions menu per status | PASS/FAIL | |
| F23: Auto-status resolution | PASS/FAIL | |
| F24: Player grid — 4/4 capacity | PASS/FAIL | |
| F25: Owner cannot be removed | PASS/FAIL | |
| F26: Price preview regular vs peak | PASS/FAIL | |
| F27: Manager creates booking | PASS/FAIL | |
| F28: Manager unscoped facility denied | PASS/FAIL | |
| F29: Create + refresh persists | PASS/FAIL | |
| F30: Cancelled booking visual treatment | PASS/FAIL | |
| F31: Combined multi-filter accuracy | PASS/FAIL | |
| F32: Search no results empty state | PASS/FAIL | |

**Result: X/32 passed**
