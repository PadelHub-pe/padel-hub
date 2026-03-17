# Suite G: Calendar

E2E flow tests for the calendar view in the PadelHub web dashboard. Covers day view, week view, navigation, zone visualization, booking interactions, quick booking, URL sync, mini calendar, stats bar, and legend.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)
- [ ] Authenticated as `owner@padelhub.pe` (org_admin, password: `password123`)

### Authentication Setup

If not already logged in, perform these steps before starting:

1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for redirect to `/org/padel-group-lima/facilities`

### Discover Facility ID

1. From the facilities list, take a snapshot to identify facility cards
2. Click on "Padel Club San Isidro" (active facility with 4 courts and seeded bookings)
3. Note the facility ID from the URL: `/org/padel-group-lima/facilities/{facilityId}`
4. Navigate to the calendar page: `/org/padel-group-lima/facilities/{facilityId}/bookings/calendar`

The calendar URL for all scenarios below is:
`http://localhost:3000/org/padel-group-lima/facilities/{facilityId}/bookings/calendar`

---

## G1: Day View Loads with Time Grid and Court Columns

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** `{calendarUrl}` (defaults to day view for today)

### Steps
1. Navigate to `{calendarUrl}` (no query params — defaults to day view, today's date)
2. Wait for the page to fully load (wait for network idle)
3. Take a snapshot of the page

### Expected Results
- [ ] The page loads without errors
- [ ] A **time grid** is visible with a left column showing time labels (e.g., "08:00", "09:00", "10:00", etc.) based on the facility's operating hours
- [ ] The header row shows **court column names** — expect 4 courts for Padel Club San Isidro (e.g., "Cancha 1", "Cancha 2", etc.)
- [ ] Each court column header shows a **status dot** (green for active), a **type icon** (indoor/outdoor emoji), and a **type badge** ("Techada" or "Al aire")
- [ ] The grid cells are visible with colored backgrounds — green-tinted (`bg-green-50`) for regular slots
- [ ] If today is within operating hours, a **red "AHORA" time indicator** line is visible horizontally across the grid at the current time
- [ ] The "Hora" label is visible in the top-left corner of the grid
- [ ] The **header** shows the current date formatted in Spanish (e.g., "lunes, 16 de marzo de 2026")
- [ ] The **"Hoy" button** in the header is disabled (since we're already viewing today)
- [ ] The **view toggle** shows "Dia" as the active/selected option (white background with shadow)

---

## G2: Week View Loads with 7-Day Grid

**Role:** org_admin (continue from G1)
**Start URL:** `{calendarUrl}?view=week`

### Steps
1. Navigate to `{calendarUrl}?view=week`
2. Wait for the page to fully load
3. Take a snapshot of the page

### Expected Results
- [ ] The page loads without errors
- [ ] A **7-column day grid** is visible (Monday through Sunday)
- [ ] The left column shows **time labels** (e.g., "08:00", "09:00") matching operating hours
- [ ] Each day column header shows the **abbreviated day name** in Spanish (e.g., "lun", "mar", "mie")
- [ ] Each day column header shows the **day number** (e.g., "16")
- [ ] **Today's column** is highlighted with a blue background (`bg-blue-50`) and the day number has a blue circle (`bg-blue-600 text-white`)
- [ ] Non-closed days show a **booking count** under the day number (e.g., "3 reservas")
- [ ] If any day is closed, it shows "Cerrado" text and has a striped gray background
- [ ] The header shows the **week date range** in Spanish (e.g., "9 - 15 de marzo de 2026" or across months: "28 de febrero - 6 de marzo de 2026")
- [ ] The **view toggle** shows "Semana" as the active/selected option
- [ ] **Booking blocks** appear in their respective time slots with colored left borders and customer names

---

## G3: Switch Between Day and Week Views

**Role:** org_admin (continue from G2)
**Start URL:** `{calendarUrl}` (day view)

### Steps
1. Navigate to `{calendarUrl}` (day view is default)
2. Take a snapshot to confirm day view is active
3. Locate the view toggle in the header — two buttons: "Dia" and "Semana"
4. Click the **"Semana"** button
5. Wait for the view to switch
6. Take a snapshot to confirm week view
7. Verify the URL now contains `view=week` in query params
8. Click the **"Dia"** button
9. Wait for the view to switch back
10. Take a snapshot to confirm day view is restored
11. Verify the URL now contains `view=day` in query params

### Expected Results
- [ ] Initially, "Dia" button is active (white bg, shadow) and "Semana" is inactive
- [ ] After clicking "Semana", the grid switches to a 7-day layout with day columns instead of court columns
- [ ] The "Semana" button becomes active and "Dia" becomes inactive
- [ ] URL updates to include `view=week`
- [ ] After clicking "Dia", the grid switches back to the time/court grid layout
- [ ] The "Dia" button becomes active again
- [ ] URL updates to include `view=day`
- [ ] The date is preserved when switching views (same date shown in both)

---

## G4: Navigate Dates (Forward/Backward with Buttons)

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (defaults to today, day view)
2. Note the current date displayed in the header (e.g., "lunes, 16 de marzo de 2026")
3. Click the **right chevron button** (next day) in the header navigation
4. Take a snapshot — verify the date advanced by 1 day
5. Verify the URL `date` param changed
6. Click the **right chevron button** again
7. Take a snapshot — verify the date advanced by another day
8. Click the **left chevron button** (previous day) twice to go back to today
9. Verify the "Hoy" button is now disabled (back to today)
10. Click the **right chevron button** to move forward one day
11. Verify the "Hoy" button is now enabled (not today)
12. Click the **"Hoy" button**
13. Verify it returns to today's date and the "Hoy" button is disabled again
14. Now switch to **week view** by clicking "Semana"
15. Click the **right chevron button**
16. Take a snapshot — verify the week advanced by 7 days
17. Click the **left chevron button**
18. Verify the week went back to the original week

### Expected Results
- [ ] Right chevron advances date by 1 day in day view
- [ ] Left chevron goes back by 1 day in day view
- [ ] The header date text updates with each click (Spanish format with day name)
- [ ] URL `date` query param updates on every navigation
- [ ] "Hoy" button is disabled when viewing today, enabled otherwise
- [ ] Clicking "Hoy" returns to the current date
- [ ] In week view, right chevron advances by 7 days
- [ ] In week view, left chevron goes back by 7 days
- [ ] Header shows the full week range when in week view

---

## G5: Zone Backgrounds Visible (Peak and Blocked Slots)

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (day view, today)
2. Wait for the page to fully load
3. Take a snapshot of the full grid
4. Look for cells with **amber/orange-tinted background** (`bg-amber-50`) — these are peak period time slots
5. Look for cells with **red-tinted background** (`bg-red-50`) — these are blocked slots
6. Look for cells with **green-tinted background** (`bg-green-50/50`) — these are regular time slots
7. If blocked slots exist, look for the **blocked overlay** with a ban icon and Spanish label (e.g., "Mantenimiento", "Evento Privado", "Torneo", "Clima", or "Bloqueado")
8. If no peak/blocked slots are visible today, navigate to other dates to find them, or check the legend (G12) to confirm the color scheme

### Expected Results
- [ ] **Regular time slots** have a subtle green background (`bg-green-50/50`)
- [ ] If peak periods are configured for today's day-of-week, those time ranges show an **amber/orange striped background** (`bg-stripes-orange bg-amber-50`)
- [ ] If blocked slots exist for today, those cells show a **red background** (`bg-red-50`) and are non-clickable (`cursor-not-allowed`)
- [ ] Blocked slot overlays display a **ban icon** and a **Spanish reason label** (e.g., "Mantenimiento")
- [ ] Courts in maintenance status have a **gray background** (`bg-gray-100`) on their header and cells
- [ ] Zone backgrounds are visually distinct and easy to differentiate

---

## G6: Booking Blocks Displayed in Correct Court Columns and Time Slots

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (day view, today — seed data creates bookings for today)
2. Wait for data to load
3. Take a snapshot of the grid
4. Identify **booking blocks** — these are absolutely positioned colored rectangles overlaid on the grid
5. Verify each booking block contains:
   - Customer name (or email if no name)
   - Player count badge (e.g., "1/4", "2/4")
   - Time range (e.g., "09:00 - 10:30")
   - Status label badge (e.g., "Confirmada", "Pendiente", "En Progreso", "Completada")
   - Booking code (for tall blocks, 90+ minutes)
6. Verify booking blocks have **colored left borders** based on status:
   - Blue border → Confirmed (`border-l-blue-400`)
   - Green border → In Progress (`border-l-green-400`)
   - Gray border → Completed (`border-l-gray-300`)
   - Yellow border → Pending (`border-l-yellow-500`)
   - Red dashed border → Cancelled (`border-l-red-300`, dashed, strikethrough name, 60% opacity)
7. Verify blocks span the **correct time range** vertically (taller for longer bookings)
8. Verify blocks are in the **correct court column** (positioned horizontally under the matching court header)

### Expected Results
- [ ] At least one booking block is visible for today (seed data should have bookings)
- [ ] Booking blocks show customer name, player count, time range, and status
- [ ] Blocks are color-coded by status (blue=confirmed, green=in_progress, gray=completed, yellow=pending, red/dashed=cancelled)
- [ ] Blocks are positioned in the correct court column (horizontally aligned with court header)
- [ ] Blocks span the correct time range (vertically proportional to duration)
- [ ] Peak rate bookings show a **lightning bolt icon** (`⚡`) in an amber badge
- [ ] Multiple bookings in the same court at different times are visible as separate blocks

---

## G7: Click Booking Block Opens Detail Popover and Drawer

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (day view, today)
2. Wait for booking blocks to appear
3. Click on any **booking block** in the grid
4. Wait for the **popover/tooltip** to appear
5. Take a snapshot of the popover

### Expected Results — Popover
- [ ] A **popover** appears near the clicked booking block
- [ ] Popover shows the **booking code** in blue mono font (e.g., "PAD-XXXXXX")
- [ ] Popover shows the **booking status badge** (e.g., "Confirmada")
- [ ] Popover shows **customer info**: avatar circle with initials, name, and email
- [ ] Popover shows **time details**: start - end time with duration (e.g., "09:00 - 10:30 (1.5h)")
- [ ] Popover shows **court name** with a colored dot
- [ ] Popover shows **price** in Soles format (e.g., "S/ 80.00")
- [ ] Popover has a **"Ver detalles"** link/button at the bottom

### Steps (continued)
6. Click the **"Ver detalles"** button in the popover
7. Wait for the **detail drawer** to slide in from the right
8. Take a snapshot of the drawer

### Expected Results — Drawer
- [ ] A **right-side drawer** appears covering the right portion of the screen with a white backdrop overlay
- [ ] Drawer header shows "Detalles de reserva" title and an X close button
- [ ] Drawer shows the **booking code** and **status badge**
- [ ] Drawer shows **player count** section
- [ ] Drawer shows **"Ver detalle completo"** link to the full booking detail page
- [ ] Drawer shows **customer info** (name, email, phone if available)
- [ ] Drawer shows **court name** with badge
- [ ] Drawer shows **date and time** in full Spanish format
- [ ] Drawer shows **price** in Soles
- [ ] If booking is pending, drawer footer shows **"Confirmar"** and **"Cancelar reserva"** buttons
- [ ] If booking is confirmed, drawer footer shows **"Cancelar reserva"** button

### Steps (continued)
9. Click the **X button** or the backdrop overlay to close the drawer
10. Verify the drawer closes and the calendar grid is fully visible again

### Expected Results — Close
- [ ] Drawer closes smoothly
- [ ] Calendar grid is fully visible and interactive again

---

## G8: Quick Booking from Empty Slot (Click Empty Cell)

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (day view, today)
2. Wait for the grid to load
3. Find an **empty time slot cell** (no booking block overlaid) in a regular or peak time
4. Hover over the empty cell — verify a **"+" icon** appears in a blue circle
5. Click the empty cell
6. Wait for the **"Nueva reserva" dialog** to appear
7. Take a snapshot of the dialog

### Expected Results — Dialog Opens
- [ ] A modal dialog appears with title **"Nueva reserva"**
- [ ] Dialog subtitle shows the **court name**, **date** (Spanish format), and **start time** (e.g., "Cancha 1 - lunes 16 de marzo a las 10:00")
- [ ] Dialog has a **"Nombre del cliente *"** required text field
- [ ] Dialog has **"Telefono"** and **"Email"** optional text fields side by side
- [ ] Dialog shows **"Hora inicio"** (disabled, pre-filled with the clicked time slot)
- [ ] Dialog has **"Hora fin *"** editable field (pre-filled with start + 90 minutes)
- [ ] Dialog shows a **"Precio"** read-only field showing the server-calculated price (e.g., "S/ 80.00") or "—" while loading
- [ ] Dialog has a **"Metodo de pago"** dropdown (Efectivo, Tarjeta, App)
- [ ] Dialog has a **"Notas"** optional text field
- [ ] Dialog footer has **"Cancelar"** and **"Crear reserva"** buttons

### Steps (continued)
8. Fill "Nombre del cliente" with `Test E2E Calendar`
9. Verify the price field updates with a value from the server
10. Click the **"Cancelar"** button
11. Verify the dialog closes without creating a booking

### Expected Results — Cancel
- [ ] Dialog closes cleanly
- [ ] No new booking block appears in the grid
- [ ] The calendar grid remains interactive

### Steps (continued) — Alternative: Using Header Button
12. Click the **"+ Nueva Reserva"** button in the calendar header (top-right)
13. Verify the same quick booking dialog opens, pre-filled with the first court and an appropriate start time

### Expected Results — Header Button
- [ ] The quick booking dialog opens
- [ ] The court is pre-filled with the first active court
- [ ] The start time is set to the current hour (if within operating hours) or the facility opening time

---

## G9: URL Sync (Date and View Type Persisted in Query Params)

**Role:** org_admin
**Start URL:** `{calendarUrl}` (no params)

### Steps
1. Navigate to `{calendarUrl}` (no query params)
2. Note that URL initially has no `date` or `view` params (defaults apply)
3. Click the **right chevron button** to go to tomorrow
4. Check the URL — it should now contain `?date=YYYY-MM-DD&view=day` with tomorrow's date
5. Click the **"Semana"** view toggle
6. Check the URL — it should now contain `view=week` (same date)
7. Copy the full URL with query params
8. Open a new browser tab or refresh the page with the full URL
9. Verify the calendar loads in week view at the correct date

### Expected Results
- [ ] Clicking date navigation buttons updates the `date` query param in real time
- [ ] Clicking view toggle updates the `view` query param (`day` or `week`)
- [ ] Both `date` and `view` params are present in the URL after any interaction
- [ ] Refreshing the page preserves the exact date and view from the URL
- [ ] Navigating directly to a URL like `{calendarUrl}?date=2026-03-20&view=week` loads that specific date in week view
- [ ] Invalid date params (e.g., `?date=invalid`) gracefully fall back to today
- [ ] Missing `view` param defaults to `day`

---

## G10: Mini Calendar Sidebar (Dates with Bookings Have Dots)

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view)

### Steps
1. Navigate to `{calendarUrl}` (day view)
2. Wait for the page to load
3. Look at the **left sidebar** — it should contain a mini calendar widget
4. Take a snapshot focusing on the mini calendar sidebar

### Expected Results — Mini Calendar Structure
- [ ] The mini calendar is visible in the left sidebar (on large screens, `lg:flex`)
- [ ] It shows a **month/year header** in Spanish (e.g., "marzo 2026") with left/right chevron arrows
- [ ] A **7-column day grid** is visible with day abbreviations: L, M, X, J, V, S, D (Spanish)
- [ ] Day numbers for the current month are displayed in normal text
- [ ] Days from adjacent months are grayed out and disabled

### Steps (continued)
5. Identify **today's date** in the mini calendar
6. Identify the **selected date** (should match the main calendar's current date)

### Expected Results — Highlighting
- [ ] **Today's date** has a blue background circle (`bg-blue-100`) if not selected, or solid blue (`bg-blue-600`) if selected
- [ ] The **selected date** has a solid blue circle background with white text
- [ ] Dates with bookings have a small **blue dot** indicator below the number (`bg-blue-500`, or `bg-white` if the date is selected)

### Steps (continued)
7. Click on a **different date** in the mini calendar (e.g., a date that has a booking dot)
8. Verify the main calendar grid updates to show that date
9. Verify the URL `date` param updates
10. Click the **right chevron** in the mini calendar to go to the next month
11. Verify the month header updates (e.g., "abril 2026")
12. Verify the days grid shows the next month's dates
13. Click on a date in the next month
14. Verify the main calendar switches to that date

### Expected Results — Interaction
- [ ] Clicking a date in the mini calendar changes the main calendar's date
- [ ] The URL `date` param updates when clicking mini calendar dates
- [ ] Month navigation (chevrons) changes the displayed month without affecting the main calendar
- [ ] Dates in the new month that have bookings show blue dots

### Steps (continued)
15. Locate the **"Ocultar calendario"** button at the bottom of the sidebar
16. Click it
17. Verify the mini calendar sidebar collapses
18. Verify a small vertical **"Calendario"** toggle button appears on the left edge
19. Click the vertical toggle button
20. Verify the mini calendar sidebar reappears

### Expected Results — Toggle
- [ ] The "Ocultar calendario" button collapses the sidebar
- [ ] A vertical "Calendario" toggle button with a right-double-chevron appears
- [ ] Clicking the toggle button restores the mini calendar sidebar

---

## G11: Stats Bar Shows Revenue and Occupancy Metrics

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view, today)

### Steps
1. Navigate to `{calendarUrl}` (day view, today)
2. Wait for data to load
3. Locate the **stats/legend bar** between the header and the grid — it's a rounded border container with gray background
4. Take a snapshot of the stats bar

### Expected Results — org_admin Stats
- [ ] The stats bar shows the **total bookings count** as a number followed by "reservas" (e.g., "5 reservas")
- [ ] The stats bar shows **revenue** in Soles format (e.g., "S/ 400") — this is visible because `org_admin` has `canViewReports` permission
- [ ] The stats bar shows **occupancy/utilization percentage** followed by "ocupacion" (e.g., "25% ocupacion")
- [ ] The three stats are separated by middle-dot characters (" · ")
- [ ] Numeric values are read from the DOM (not hardcoded — they come from server data)

### Steps (continued)
5. Switch to **week view** by clicking "Semana"
6. Take a snapshot of the stats bar in week view

### Expected Results — Week View Stats
- [ ] The stats bar updates to show **weekly totals**: aggregate booking count, total revenue, and average utilization
- [ ] Values reflect the entire week's data (higher numbers than day view)

---

## G12: Legend Shows Zone Color Meanings

**Role:** org_admin
**Start URL:** `{calendarUrl}` (day view)

### Steps
1. Navigate to `{calendarUrl}` (day view)
2. Wait for the page to load
3. Locate the **legend section** on the left side of the stats bar (same row as stats)
4. Take a snapshot of the legend

### Expected Results
- [ ] The legend shows **4 zone items**, each with a colored swatch and a Spanish label:
  1. A **green swatch** (`bg-green-50 border-green-300`) labeled **"Horario Regular"**
  2. An **amber swatch** (`bg-amber-50 border-amber-300`) labeled **"Hora Pico"**
  3. A **blue swatch** (`bg-blue-50 border-blue-300`) labeled **"Reservado"**
  4. A **red swatch** (`bg-red-50 border-red-300`) labeled **"Bloqueado"**
- [ ] Each swatch is a small colored square (`h-3 w-3`) with a border
- [ ] Labels are in regular gray text (`text-gray-600`)
- [ ] The legend is displayed horizontally with gap spacing between items
- [ ] The legend and stats together fit in a single row bar

---

## Reporting

After running all 12 calendar scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| G1: Day view loads | PASS/FAIL | |
| G2: Week view loads | PASS/FAIL | |
| G3: Switch day/week views | PASS/FAIL | |
| G4: Navigate dates | PASS/FAIL | |
| G5: Zone backgrounds | PASS/FAIL | |
| G6: Booking blocks | PASS/FAIL | |
| G7: Click booking (popover + drawer) | PASS/FAIL | |
| G8: Quick booking from empty slot | PASS/FAIL | |
| G9: URL sync | PASS/FAIL | |
| G10: Mini calendar sidebar | PASS/FAIL | |
| G11: Stats bar | PASS/FAIL | |
| G12: Legend zones | PASS/FAIL | |

**Result: X/12 passed**
