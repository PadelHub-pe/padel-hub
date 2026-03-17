# Suite C: Team & RBAC

End-to-end tests for team member management, invitations, role editing, and role-based access control enforcement.

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

## Seed Data Reference

| User | Email | Role | Facility Access |
|---|---|---|---|
| Carlos Mendoza | owner@padelhub.pe | org_admin | All facilities |
| Ana Garcia | manager@padelhub.pe | facility_manager | San Isidro + Miraflores |
| Luis Vargas | staff@padelhub.pe | staff | San Isidro only |
| (invite) | invited@padelhub.pe | facility_manager | San Isidro |

**Org slug:** `padel-group-lima`
**Password (all accounts):** `password123`

**Role labels in UI:**
- `org_admin` = "Administrador" (red badge)
- `facility_manager` = "Gerente" (blue badge)
- `staff` = "Staff" (green badge)

**Team table columns:** Miembro, Rol, Locales, Estado, Actions

---

## C1: View Team Members Table

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill the email field with `owner@padelhub.pe`
3. Fill the password field with `password123`
4. Click the login/submit button
5. Wait for navigation to `/org/padel-group-lima/facilities`
6. Navigate to `http://localhost:3000/org/padel-group-lima/settings`
7. Wait for the settings page to load
8. Take a snapshot of the page
9. Click the "Equipo y Roles" tab
10. Wait for the team tab content to load
11. Take a snapshot

### Expected Results
- [ ] Settings page heading says "Ajustes"
- [ ] Tabs are visible: "Organizacion", "Equipo y Roles", "Locales", "Facturacion" (disabled with "Pronto" badge)
- [ ] After clicking "Equipo y Roles" tab, the team section is visible
- [ ] Section heading says "Equipo y Roles"
- [ ] Member count subtitle shows "3 miembros / 1 invitacion pendiente" (or similar)
- [ ] "Invitar Miembro" button is visible in the top-right of the section
- [ ] Team table has 4 rows total: 3 active members + 1 pending invite
- [ ] First row is the current user (Carlos Mendoza) with "(Tu)" indicator and highlighted background (blue)
- [ ] Carlos Mendoza row: "Administrador" badge (red), "Todos los locales" in Locales column, "Activo" status with green dot
- [ ] Ana Garcia row: "Gerente" badge (blue), facility badges for assigned facilities, "Activo" status with green dot
- [ ] Luis Vargas row: "Staff" badge (green), facility badge for San Isidro, "Activo" status with green dot
- [ ] invited@padelhub.pe row: shows email instead of name, "Gerente" badge, "Pendiente" status with amber dot, shows "Invitado hace..." time

---

## C2: Invite New Member Dialog

**Role:** org_admin (continue from C1)

### Steps
1. On the "Equipo y Roles" tab, click the "Invitar Miembro" button
2. Wait for the invite dialog to appear
3. Take a snapshot of the dialog
4. Fill the "Email" field with `newmember@test.pe`
5. The role selector shows 3 options as radio-style cards: "Administrador", "Manager de Local", "Staff"
6. Click on the "Staff" role option
7. Verify that a "Locales asignados" section appears with checkboxes for each facility
8. Check the checkbox for "Padel Club San Isidro"
9. Take a snapshot showing the completed form
10. Click "Enviar Invitacion"
11. Wait for the toast notification
12. Take a snapshot of the updated team table

### Expected Results
- [ ] Dialog title is "Invitar Miembro"
- [ ] Dialog description mentions joining the organization
- [ ] Email field has placeholder "usuario@ejemplo.com"
- [ ] Three role options are shown: "Administrador" (with description "Acceso total a la organizacion"), "Manager de Local" (with description "Gestiona y configura locales asignados"), "Staff" (with description "Opera reservas y calendario en locales asignados")
- [ ] Default selected role is "Manager de Local" (facility_manager)
- [ ] When "Staff" or "Manager de Local" is selected, a "Locales asignados" section appears with facility checkboxes
- [ ] When "Administrador" is selected, no facility checkboxes appear (admin has access to all)
- [ ] "Enviar Invitacion" button is disabled until at least 1 facility is selected (for non-admin roles)
- [ ] After submitting, a success toast appears: "Invitacion enviada"
- [ ] The team table now shows the new invite row for `newmember@test.pe` with "Staff" badge and "Pendiente" status

---

## C3: View Pending Invites in Team Table

**Role:** org_admin (continue from C2)

### Steps
1. Take a snapshot of the team table
2. Identify all rows with "Pendiente" status (amber dot)

### Expected Results
- [ ] At least 2 pending invites are visible: `invited@padelhub.pe` and `newmember@test.pe`
- [ ] Pending invite rows show the email address (not a name) in the Miembro column
- [ ] Pending invite rows show a mail icon instead of an avatar
- [ ] Pending invite rows show "Invitado hace..." time text
- [ ] Pending invite rows have an actions dropdown (three dots button) with options "Reenviar invitacion" and "Cancelar invitacion"

---

## C4: Cancel Pending Invite

**Role:** org_admin (continue from C3)

### Steps
1. Locate the row for `newmember@test.pe` (the invite created in C2)
2. Click the actions dropdown button (three dots) on that row
3. Wait for the dropdown menu to appear
4. Click "Cancelar invitacion"
5. Wait for the confirmation dialog to appear
6. Take a snapshot of the confirmation dialog
7. Click the destructive confirmation button ("Cancelar Invitacion" in the dialog)
8. Wait for the toast notification
9. Take a snapshot of the updated team table

### Expected Results
- [ ] Confirmation dialog title is "Cancelar Invitacion"
- [ ] Confirmation dialog asks "Estas seguro de cancelar la invitacion a newmember@test.pe?"
- [ ] Dialog has two buttons: "No, volver" (outline) and "Cancelar Invitacion" (destructive/red)
- [ ] After confirming, a success toast appears: "Invitacion cancelada"
- [ ] The row for `newmember@test.pe` disappears from the team table
- [ ] The member count subtitle updates (one fewer pending invite)

---

## C5: Edit Member Role Dialog

**Role:** org_admin (continue from C4)

### Steps
1. Locate the row for Ana Garcia (facility_manager)
2. Click the actions dropdown button (three dots) on her row
3. Click "Editar rol"
4. Wait for the edit dialog to appear
5. Take a snapshot of the edit dialog
6. The dialog should show a role selector dropdown with current role "Gerente de Local" (facility_manager)
7. Verify the "Locales asignados" section shows checkboxes with her currently assigned facilities checked

### Expected Results
- [ ] Dialog title is "Editar Miembro"
- [ ] Dialog description mentions "Cambia el rol y los locales asignados de Ana Garcia"
- [ ] Role dropdown is a select element showing the current role
- [ ] Role dropdown options: "Administrador", "Gerente de Local", "Staff"
- [ ] "Locales asignados" section is visible (since current role is not org_admin)
- [ ] Facility checkboxes show the 3 facilities, with San Isidro and Miraflores checked
- [ ] "Guardar" and "Cancelar" buttons are present in the dialog footer

### Cleanup
1. Click "Cancelar" to close the dialog without saving

---

## C6: Edit Facility Scope for Member

**Role:** org_admin (continue from C5)

### Steps
1. Locate the row for Luis Vargas (staff)
2. Click the actions dropdown button (three dots) on his row
3. Click "Editar rol"
4. Wait for the edit dialog to appear
5. Verify his current role is "Staff" and only "Padel Club San Isidro" is checked
6. Check the checkbox for "Padel Club Miraflores" (adding a second facility)
7. Take a snapshot showing the updated facility selection
8. Click "Guardar"
9. Wait for the toast notification
10. Take a snapshot of the updated team table

### Expected Results
- [ ] Edit dialog shows role "Staff" for Luis Vargas
- [ ] Initially only "Padel Club San Isidro" checkbox is checked
- [ ] After checking "Padel Club Miraflores", both checkboxes are checked
- [ ] After saving, a success toast appears: "Miembro actualizado"
- [ ] The Luis Vargas row now shows badges for both "Padel Club San Isidro" and "Padel Club Miraflores" in the Locales column

### Cleanup
1. Re-open the edit dialog for Luis Vargas
2. Uncheck "Padel Club Miraflores" to restore original state
3. Click "Guardar"
4. Wait for the success toast

---

## C7: Last Admin Protection

**Role:** org_admin (continue from C6)

### Steps
1. Locate the row for Carlos Mendoza (the current user, org_admin)
2. Verify that Carlos Mendoza's row does NOT have an actions dropdown (current user row has no actions)
3. Now open the edit dialog for Ana Garcia (to test last-admin role demotion prevention indirectly)
4. Click the actions dropdown on Ana Garcia's row
5. Click "Editar rol"
6. In the edit dialog, change her role to "Administrador" using the role dropdown
7. Click "Guardar" to make her an admin too
8. Wait for the success toast
9. Close the dialog
10. Now verify that Carlos Mendoza still cannot be edited (current user always excluded from actions)
11. Take a snapshot

### Expected Results
- [ ] The current user (Carlos Mendoza) row never shows an actions dropdown -- self-editing is not permitted through the table
- [ ] When only 1 org_admin exists and you try to edit them, the role dropdown disables non-admin options with tooltip "Es el unico administrador"
- [ ] After making Ana Garcia an admin, there are now 2 admins in the table

### Cleanup (Important -- restore Ana Garcia to facility_manager)
1. Open the edit dialog for Ana Garcia
2. Change her role back to "Gerente de Local" from the role dropdown
3. A demotion warning should appear (amber box) explaining she will lose org-level access
4. Check the "Confirmo el cambio de rol" checkbox
5. Select facilities: check "Padel Club San Isidro" and "Padel Club Miraflores"
6. Click "Guardar"
7. Wait for the success toast

---

## C8: Staff Cannot Access Org Settings

**Role:** staff (`staff@padelhub.pe`)

### Steps
1. Sign out of the current session:
   - Find and click the sign-out button/link in the sidebar
   - Confirm sign-out if a confirmation dialog appears
   - Wait for redirect to `/login`
2. Log in as staff user:
   - Fill the email field with `staff@padelhub.pe`
   - Fill the password field with `password123`
   - Click the login/submit button
   - Wait for navigation to complete
3. Take a snapshot of the landing page
4. Verify the sidebar navigation does NOT show "Organizacion" settings link
5. Navigate directly to `http://localhost:3000/org/padel-group-lima/settings` via the browser URL
6. Wait for the page to load/redirect
7. Take a snapshot

### Expected Results
- [ ] Staff user lands on a page after login (likely facilities list or facility bookings based on their scoped access)
- [ ] The sidebar navigation under "CONFIGURACION" section is NOT visible (because `canManageOrg` is false for staff)
- [ ] When navigating directly to `/org/padel-group-lima/settings`, the user is redirected to `/org/padel-group-lima/facilities`
- [ ] The settings page content is NOT displayed
- [ ] No error page is shown -- just a clean redirect

---

## C9: Facility Manager Cannot Access Org Settings

**Role:** facility_manager (`manager@padelhub.pe`)

### Steps
1. Sign out of the current session:
   - Find and click the sign-out button/link in the sidebar
   - Confirm sign-out if a confirmation dialog appears
   - Wait for redirect to `/login`
2. Log in as facility manager:
   - Fill the email field with `manager@padelhub.pe`
   - Fill the password field with `password123`
   - Click the login/submit button
   - Wait for navigation to complete
3. Take a snapshot of the landing page
4. Verify the sidebar navigation does NOT show "Organizacion" settings link
5. Navigate directly to `http://localhost:3000/org/padel-group-lima/settings` via the browser URL
6. Wait for the page to load/redirect
7. Take a snapshot

### Expected Results
- [ ] Facility manager lands on the facilities list page after login
- [ ] The sidebar navigation under "CONFIGURACION" section is NOT visible (because `canManageOrg` is false for facility_manager)
- [ ] When navigating directly to `/org/padel-group-lima/settings`, the user is redirected to `/org/padel-group-lima/facilities`
- [ ] The settings page content is NOT displayed
- [ ] No error page is shown -- just a clean redirect

---

## Reporting

After running all 9 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| C1: View team members table | PASS/FAIL | |
| C2: Invite new member dialog | PASS/FAIL | |
| C3: View pending invites | PASS/FAIL | |
| C4: Cancel pending invite | PASS/FAIL | |
| C5: Edit member role dialog | PASS/FAIL | |
| C6: Edit facility scope | PASS/FAIL | |
| C7: Last admin protection | PASS/FAIL | |
| C8: Staff cannot access org settings | PASS/FAIL | |
| C9: Facility manager cannot access org settings | PASS/FAIL | |

**Result: X/9 passed**
