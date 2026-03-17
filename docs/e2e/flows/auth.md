# Suite A: Authentication & Access

Comprehensive tests for login, forgot password, invite-based registration, session persistence, and role-based landing behavior.

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

---

## A1: Login with Valid Credentials (All 3 Roles)

**Role:** All three roles, tested sequentially
**Start URL:** `http://localhost:3000/login`

### Steps

#### A1a: org_admin Login
1. Navigate to `http://localhost:3000/login`
2. Take a snapshot to confirm the login page is rendered
3. Fill the email field (`Correo electr`) with `owner@padelhub.pe`
4. Fill the password field (`Contrase`) with `password123`
5. Click the "Iniciar sesion" submit button
6. Wait for navigation to complete (wait for URL to change from `/login`)
7. Take a snapshot of the landing page

#### A1a Expected Results
- [ ] URL is `/org/padel-group-lima/facilities` (org_admin lands on facilities list)
- [ ] Facility cards are visible on the page
- [ ] Sidebar is present with "PadelHub" branding and "Locales" nav item

#### A1a Cleanup
8. Click "Cerrar sesion" in the sidebar footer
9. If the confirmation popover appears with text "Cerrar sesion?", click "Confirmar"
10. Wait for redirect to `/login`

#### A1b: facility_manager Login
11. Navigate to `http://localhost:3000/login`
12. Fill the email field with `manager@padelhub.pe`
13. Fill the password field with `password123`
14. Click the "Iniciar sesion" submit button
15. Wait for navigation to complete
16. Take a snapshot of the landing page

#### A1b Expected Results
- [ ] URL contains `/org/padel-group-lima/facilities/` followed by a facility ID (manager lands on first facility dashboard)
- [ ] URL does NOT end with `/bookings` (managers go to facility dashboard, not bookings)
- [ ] Dashboard stats cards are visible (revenue, bookings, or utilization indicators)

#### A1b Cleanup
17. Click "Cerrar sesion" in the sidebar footer
18. Click "Confirmar" on the confirmation popover
19. Wait for redirect to `/login`

#### A1c: staff Login
20. Navigate to `http://localhost:3000/login`
21. Fill the email field with `staff@padelhub.pe`
22. Fill the password field with `password123`
23. Click the "Iniciar sesion" submit button
24. Wait for navigation to complete
25. Take a snapshot of the landing page

#### A1c Expected Results
- [ ] URL contains `/org/padel-group-lima/facilities/` and ends with `/bookings` (staff lands on bookings)
- [ ] Bookings list/table is visible
- [ ] Sidebar shows "Reservas" and "Calendario" but NOT "Dashboard", "Canchas", "Horarios", "Precios", or "Configuracion"

#### A1c Cleanup
26. Click "Cerrar sesion" in the sidebar footer
27. Click "Confirmar" on the confirmation popover
28. Wait for redirect to `/login`

---

## A2: Login with Invalid Password

**Role:** None (unauthenticated)
**Start URL:** `http://localhost:3000/login`

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill the email field with `owner@padelhub.pe`
3. Fill the password field with `wrongpassword123`
4. Click the "Iniciar sesion" submit button
5. Wait for the error message to appear (do NOT wait for navigation)
6. Take a snapshot

### Expected Results
- [ ] URL remains `/login` (no redirect occurred)
- [ ] An error message is displayed in Spanish: "Email o contrasena incorrectos"
- [ ] The error is shown in a red/error-styled container (red background with red text)
- [ ] The email field still contains `owner@padelhub.pe` (not cleared)
- [ ] The password field is present (may be cleared or retained)

---

## A3: Forgot Password Flow

**Role:** None (unauthenticated)
**Start URL:** `http://localhost:3000/login`

### Steps
1. Navigate to `http://localhost:3000/login`
2. Take a snapshot to confirm login page is rendered
3. Click the "Olvidaste tu contrasena?" link
4. Wait for navigation to `/forgot-password`
5. Take a snapshot of the forgot password page

#### A3a: Verify Forgot Password Page
6. Confirm the page shows:
   - Title: "Olvidaste tu contrasena?"
   - Description about receiving a reset link
   - Email input field
   - "Enviar enlace de recuperacion" button
   - "Volver a iniciar sesion" link

#### A3b: Submit Email
7. Fill the email field with `owner@padelhub.pe`
8. Click the "Enviar enlace de recuperacion" button
9. Wait for the success state to render
10. Take a snapshot

### Expected Results
- [ ] After clicking the forgot password link, URL changes to `/forgot-password`
- [ ] Forgot password form shows email field and submit button in Spanish
- [ ] After submitting, success message appears: "Revisa tu correo"
- [ ] Success message includes description: "Si existe una cuenta con ese email, recibiras un enlace para restablecer tu contrasena"
- [ ] A "Volver a iniciar sesion" button/link is shown to go back to login
- [ ] No error is shown (the form always shows success to avoid leaking account info)

---

## A4: Invalid/Expired Invite Token on Register Page

**Role:** None (unauthenticated)
**Start URL:** `http://localhost:3000/register`

### Steps

#### A4a: No Token
1. Navigate to `http://localhost:3000/register` (no query params)
2. Wait for the page to render
3. Take a snapshot

#### A4a Expected Results
- [ ] Page shows "Acceso solo por invitacion" title
- [ ] Description says registration requires an invitation from an org admin
- [ ] "Solicitar acceso" button is present (links to padelhub.pe)
- [ ] "Iniciar sesion" button/link is present (links to /login)
- [ ] No registration form fields are shown

#### A4b: Invalid Token
4. Navigate to `http://localhost:3000/register?token=invalid-token-12345`
5. Wait for the page to render (may show loading skeleton briefly)
6. Take a snapshot

#### A4b Expected Results
- [ ] Page shows an error state with "Invitacion no valida" title
- [ ] Description explains the invite link is not valid
- [ ] An alert/error icon is displayed (red circle)
- [ ] "Ir a iniciar sesion" link/button is present
- [ ] No registration form fields are shown

---

## A5: Session Persistence

**Role:** org_admin (`owner@padelhub.pe`)
**Start URL:** `http://localhost:3000/login`

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill the email field with `owner@padelhub.pe`
3. Fill the password field with `password123`
4. Click the "Iniciar sesion" submit button
5. Wait for navigation to `/org/padel-group-lima/facilities`
6. Take a snapshot to confirm authenticated state
7. Navigate to `http://localhost:3000/org/padel-group-lima/facilities` (simulates page refresh by full reload)
8. Wait for the page to load
9. Take a snapshot

### Expected Results
- [ ] After login, user is on `/org/padel-group-lima/facilities` with facility cards visible
- [ ] After navigating again to the same URL (refresh), user is still authenticated
- [ ] Facility cards are still visible (not redirected to login)
- [ ] Sidebar shows user info (name or email) in the footer section
- [ ] No login form is shown after refresh

### Cleanup
10. Click "Cerrar sesion" in the sidebar footer
11. Click "Confirmar" on the confirmation popover
12. Wait for redirect to `/login`

---

## A6: Role-Based Landing Page

**Role:** All three roles
**Start URL:** `http://localhost:3000/org`

This test verifies the `/org` route correctly redirects each role to their appropriate landing page.

### Steps

#### A6a: org_admin Landing
1. Navigate to `http://localhost:3000/login`
2. Fill email with `owner@padelhub.pe`, password with `password123`
3. Click "Iniciar sesion"
4. Wait for navigation to complete
5. Note the final URL
6. Navigate to `http://localhost:3000/org` (the role-based router)
7. Wait for redirect to complete
8. Take a snapshot and note the final URL

#### A6a Expected Results
- [ ] org_admin is redirected to `/org/padel-group-lima/facilities`
- [ ] The facilities list page is displayed (facility cards visible)

#### A6a Cleanup
9. Click "Cerrar sesion" > "Confirmar"
10. Wait for `/login`

#### A6b: facility_manager Landing
11. Navigate to `http://localhost:3000/login`
12. Fill email with `manager@padelhub.pe`, password with `password123`
13. Click "Iniciar sesion"
14. Wait for navigation to complete
15. Note the final URL

#### A6b Expected Results
- [ ] facility_manager is redirected to `/org/padel-group-lima/facilities/{facilityId}` (facility dashboard, not bookings)
- [ ] Dashboard page is displayed with stats

#### A6b Cleanup
16. Click "Cerrar sesion" > "Confirmar"
17. Wait for `/login`

#### A6c: staff Landing
18. Navigate to `http://localhost:3000/login`
19. Fill email with `staff@padelhub.pe`, password with `password123`
20. Click "Iniciar sesion"
21. Wait for navigation to complete
22. Note the final URL

#### A6c Expected Results
- [ ] staff is redirected to `/org/padel-group-lima/facilities/{facilityId}/bookings`
- [ ] Bookings page is displayed

#### A6c Cleanup
23. Click "Cerrar sesion" > "Confirmar"
24. Wait for `/login`

---

## A7: Protected Route Redirect (Unauthenticated)

**Role:** None (unauthenticated, no active session)
**Start URL:** Various protected URLs

### Steps

#### A7a: Facilities List
1. Ensure no session is active (start from `/login` or clear cookies)
2. Navigate to `http://localhost:3000/org/padel-group-lima/facilities`
3. Wait for redirect
4. Take a snapshot

#### A7a Expected Results
- [ ] User is redirected to `/login`
- [ ] Login form is displayed (not the facilities page)

#### A7b: Root URL
5. Navigate to `http://localhost:3000/`
6. Wait for redirect
7. Note the final URL

#### A7b Expected Results
- [ ] User is redirected to `/login` (root always redirects to login)

#### A7c: Facility Dashboard
8. Navigate to `http://localhost:3000/org/padel-group-lima/facilities/some-facility-id`
9. Wait for redirect
10. Note the final URL

#### A7c Expected Results
- [ ] User is redirected to `/login`

#### A7d: Org Settings
11. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
12. Wait for redirect
13. Take a snapshot

#### A7d Expected Results
- [ ] User is redirected to `/login`
- [ ] Login form is displayed

#### A7e: Public Routes Remain Accessible
14. Navigate to `http://localhost:3000/forgot-password`
15. Take a snapshot

#### A7e Expected Results
- [ ] Forgot password page loads normally (not redirected to login)
- [ ] "Olvidaste tu contrasena?" title is visible

16. Navigate to `http://localhost:3000/register`
17. Take a snapshot

#### A7f Expected Results
- [ ] Register page loads normally with "Acceso solo por invitacion" message
- [ ] Not redirected to login (register is a public route)

---

## Reporting

After running all scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| A1a: Login org_admin | PASS/FAIL | |
| A1b: Login facility_manager | PASS/FAIL | |
| A1c: Login staff | PASS/FAIL | |
| A2: Invalid password error | PASS/FAIL | |
| A3: Forgot password flow | PASS/FAIL | |
| A4a: Register no token | PASS/FAIL | |
| A4b: Register invalid token | PASS/FAIL | |
| A5: Session persistence | PASS/FAIL | |
| A6a: Role landing org_admin | PASS/FAIL | |
| A6b: Role landing facility_manager | PASS/FAIL | |
| A6c: Role landing staff | PASS/FAIL | |
| A7a: Protected route redirect (facilities) | PASS/FAIL | |
| A7b: Protected route redirect (root) | PASS/FAIL | |
| A7c: Protected route redirect (facility) | PASS/FAIL | |
| A7d: Protected route redirect (settings) | PASS/FAIL | |
| A7e: Public route forgot-password | PASS/FAIL | |
| A7f: Public route register | PASS/FAIL | |

**Result: X/17 passed**
