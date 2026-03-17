# Level 3: Mobile Responsive

Verify the web dashboard adapts correctly to mobile viewports. All scenarios use a 375x667 viewport (iPhone SE) set via `browser_resize`. After the full suite, resize back to desktop (1280x720).

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

---

## M1: Sidebar Collapses on Mobile

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Use `browser_resize` to set viewport to 375x667
2. Navigate to `http://localhost:3000/login`
3. Fill email field with `owner@padelhub.pe`
4. Fill password field with `password123`
5. Click the login/submit button
6. Wait for navigation to complete (should land on `/org/padel-group-lima/facilities`)
7. Take a snapshot of the page

### Expected Results
- [ ] The desktop sidebar (`hidden lg:flex`) is NOT visible
- [ ] A fixed mobile header bar is visible at the top with a hamburger menu icon (three-line icon)
- [ ] The mobile header shows the PadelHub branding (P logo + "PadelHub" text)
- [ ] The user avatar or initials are shown on the right side of the mobile header
- [ ] The main content area has top padding to account for the fixed header

---

## M2: Sheet/Drawer Navigation

**Role:** org_admin (continue from M1)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. From the facilities list page, click the hamburger menu button (aria-label: "Abrir menu")
3. Wait for the sheet animation to complete
4. Take a snapshot

### Expected Results
- [ ] A sidebar sheet slides in from the left side of the screen
- [ ] The sheet has a dark background (`bg-gray-900`) matching the desktop sidebar style
- [ ] Navigation items are visible inside the sheet (e.g., "Locales" under "GENERAL" section)
- [ ] The sheet has an overlay/backdrop behind it
- [ ] The sheet title "Menu de navegacion" is present (visually hidden / sr-only)

---

## M3: Sheet Closes on Navigation

**Role:** org_admin (continue from M2)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. With the sidebar sheet open (open it via hamburger if not already open)
3. Take a snapshot to confirm the sheet is open
4. Click the "Locales" navigation link inside the sheet
5. Wait for navigation to complete
6. Take a snapshot

### Expected Results
- [ ] After clicking the nav link, the sheet automatically closes
- [ ] The page navigates to the facilities list
- [ ] The sheet overlay is no longer visible
- [ ] The hamburger button is visible again in the mobile header
- [ ] The facilities list content is visible below the mobile header

---

## M4: Sheet Closes on Outside Click

**Role:** org_admin (continue from M3)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Click the hamburger menu button to open the sidebar sheet
3. Wait for the sheet animation to complete
4. Take a snapshot to confirm the sheet is open
5. Click on the overlay/backdrop area (the dimmed area outside the sheet on the right side)
6. Wait for the close animation
7. Take a snapshot

### Expected Results
- [ ] The sheet closes after clicking the overlay
- [ ] The main page content is fully visible again
- [ ] The hamburger button remains accessible in the mobile header
- [ ] No navigation occurred (URL remains the same)

---

## M5: Bookings Table Horizontal Scroll

**Role:** org_admin (continue from M4)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Navigate to a facility: from the facilities list, click on an active facility card (e.g., "Padel Club San Isidro")
3. Wait for the facility dashboard to load
4. Click the hamburger menu to open the sidebar sheet
5. Click "Reservas" in the navigation
6. Wait for the bookings page to load
7. Take a snapshot

### Expected Results
- [ ] The bookings table renders without overflowing the viewport width
- [ ] The table is contained within a scrollable wrapper (horizontally scrollable if columns exceed viewport)
- [ ] Table column headers are visible (e.g., Codigo, Cliente, Cancha, Fecha, Estado)
- [ ] Booking rows are readable even on the narrow viewport
- [ ] No horizontal page-level scrollbar appears (only the table container scrolls if needed)

---

## M6: Facility Cards Stack Vertically

**Role:** org_admin (continue from M5)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
3. Wait for the facilities list to load
4. Take a snapshot

### Expected Results
- [ ] Facility cards are stacked in a single column (the `grid` uses default single-column layout below `sm` breakpoint)
- [ ] Each card takes the full width of the content area
- [ ] Cards are NOT side-by-side (no 2-column or 3-column grid)
- [ ] Each card shows: photo header, name, district, court type pills, stats row, and footer link
- [ ] All 3 seeded facility cards are visible by scrolling down

---

## M7: Dialog/Modal Fits Viewport

**Role:** org_admin (continue from M6)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Navigate to a facility's bookings page via the hamburger menu and sidebar navigation
3. Look for the "Nueva Reserva" or create booking button
4. Click the create booking button to open the dialog
5. Take a snapshot

### Expected Results
- [ ] The dialog/modal is fully visible within the 375x667 viewport
- [ ] The dialog does NOT overflow horizontally beyond the screen edges
- [ ] Dialog content (form fields, selectors) is readable and not clipped
- [ ] The dialog has proper padding from the viewport edges
- [ ] The close button or cancel action is accessible
- [ ] Form fields within the dialog are full-width and tappable

---

## M8: Calendar Day View on Mobile

**Role:** org_admin (continue from M7)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Close any open dialog
3. Open the hamburger menu and click "Calendario" in the navigation
4. Wait for the calendar page to load
5. Ensure the view is in "day" mode (click the day toggle if in week mode)
6. Take a snapshot

### Expected Results
- [ ] The calendar day view renders within the mobile viewport
- [ ] The mini-calendar sidebar is NOT visible (it uses `hidden lg:flex`, hidden on mobile)
- [ ] The calendar header with date navigation and view toggle is accessible
- [ ] The time grid is vertically scrollable to show all hours
- [ ] Court column headers are visible at the top of the grid
- [ ] Booking blocks (if any) are visible and distinguishable
- [ ] The "Hoy" button and navigation arrows are tappable

---

## M9: Form Inputs Accessible

**Role:** None (unauthenticated)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Sign out if currently logged in (hamburger menu -> sign out -> confirm)
3. Navigate to `http://localhost:3000/login`
4. Take a snapshot of the login form

### Expected Results
- [ ] The login card is centered and fits within the mobile viewport
- [ ] Email input field is full-width within the card
- [ ] Password input field is full-width within the card
- [ ] The "Iniciar Sesion" submit button is visible without scrolling (or with minimal scroll)
- [ ] The "Olvidaste tu contrasena?" link is visible
- [ ] Google OAuth button is visible and full-width
- [ ] All form elements are tappable with adequate touch target size
- [ ] The PadelHub logo is visible above the form

---

## M10: Breadcrumbs on Mobile

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Confirm viewport is 375x667 (use `browser_resize` if needed)
2. Navigate to `http://localhost:3000/login`
3. Log in as `owner@padelhub.pe` / `password123`
4. Navigate to a facility's bookings page (click a facility card, then open hamburger -> "Reservas")
5. Take a snapshot

### Expected Results
- [ ] The desktop breadcrumb trail (full path) is hidden (`hidden sm:flex`)
- [ ] The mobile breadcrumb trail is shown (`flex sm:hidden`)
- [ ] Mobile breadcrumbs show an ellipsis ("...") followed by the last 2 segments (e.g., "... > [Facility Name] > Reservas")
- [ ] Breadcrumb text is truncated with ellipsis if too long (`max-w-[200px] truncate` / `max-w-[150px] truncate`)
- [ ] The clickable breadcrumb segment navigates correctly when tapped

---

## Cleanup: Restore Desktop Viewport

### Steps
1. Use `browser_resize` to set viewport back to 1280x720
2. Take a snapshot to confirm desktop layout is restored

### Expected Results
- [ ] Desktop sidebar is visible again
- [ ] Mobile header is hidden
- [ ] Page content uses full desktop layout

---

## Reporting

After running all 10 mobile responsive tests, report:

| Test | Status | Notes |
|------|--------|-------|
| M1: Sidebar collapses on mobile | PASS/FAIL | |
| M2: Sheet/drawer navigation | PASS/FAIL | |
| M3: Sheet closes on navigation | PASS/FAIL | |
| M4: Sheet closes on outside click | PASS/FAIL | |
| M5: Bookings table horizontal scroll | PASS/FAIL | |
| M6: Facility cards stack vertically | PASS/FAIL | |
| M7: Dialog/modal fits viewport | PASS/FAIL | |
| M8: Calendar day view on mobile | PASS/FAIL | |
| M9: Form inputs accessible | PASS/FAIL | |
| M10: Breadcrumbs on mobile | PASS/FAIL | |

**Result: X/10 passed**
