# Suite F: Booking Management

Verifies the bookings list view, filtering and search, manual booking creation, booking detail page, status transitions (confirm/cancel), player management (add/remove), status badges, pagination, and staff role restrictions.

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
5. The "Fecha *" field should default to today -- leave as is
6. In "Hora inicio *", select "10:00 AM" (value "10:00")
7. In "Duracion *", select "1.5 horas" (value "90")
8. Verify the computed time summary appears (e.g., "lun 16 mar . 10:00 AM -- 11:30 AM")
9. Fill "Nombre del cliente *" with "Juan Test"
10. Fill "Telefono" with "999111222"
11. Fill "Email" with "juan@test.com"
12. In "Metodo de pago", select "Efectivo"
13. Take a snapshot showing the filled form and price preview
14. Click "Crear reserva"
15. Wait for success toast
16. Take a snapshot of the updated bookings list

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

## Reporting

After running all 13 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
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

**Result: X/13 passed**
