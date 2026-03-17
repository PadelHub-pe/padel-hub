# Suite H: Settings & Profile

Tests for organization settings, facility settings, account profile, password management, and RBAC-based tab visibility. Covers both the org-level settings page (`/org/[orgSlug]/settings`) and the facility-level settings page (`/org/[orgSlug]/facilities/[facilityId]/settings`).

## Prerequisites

- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running at `http://localhost:3000` (`pnpm dev:next`)

---

## H1: Org Settings Tabs Visible for org_admin

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Navigate to `http://localhost:3000/login`
2. Fill email field with `owner@padelhub.pe`
3. Fill password field with `password123`
4. Click the login/submit button
5. Wait for navigation to complete (should land on `/org/padel-group-lima/facilities`)
6. Click "Ajustes" in the organization sidebar (or navigate directly to `http://localhost:3000/org/padel-group-lima/settings`)
7. Wait for the settings page to load
8. Take a snapshot of the settings page

### Expected Results
- [ ] URL is `/org/padel-group-lima/settings`
- [ ] Page heading shows "Ajustes"
- [ ] Subtitle shows "Administra tu organizacion, equipo y configuracion"
- [ ] Tab bar is visible with tabs: "Organizacion", "Equipo y Roles", "Locales", "Facturacion"
- [ ] "Organizacion" tab is selected by default
- [ ] "Facturacion" tab shows a "Pronto" badge and is disabled
- [ ] The "Organizacion" tab content shows the org profile form with: "Nombre de la organizacion", "Descripcion", "Email de contacto", "Telefono de contacto"

---

## H2: Edit Org Profile (Name, Contact Email)

**Role:** org_admin (continue from H1)

### Steps
1. From the org settings page on the "Organizacion" tab, take a snapshot
2. Note the current organization name in the "Nombre de la organizacion" field
3. Clear the "Nombre de la organizacion" field and type `Padel Group Lima Editado`
4. Clear the "Email de contacto" field and type `nuevo-contacto@padelhub.pe`
5. Click the "Guardar cambios" button
6. Wait for the save operation to complete
7. Take a snapshot of the form

### Expected Results
- [ ] The "Guardar cambios" button is initially disabled when no changes have been made
- [ ] After modifying a field, the "Guardar cambios" button becomes enabled
- [ ] After clicking "Guardar cambios", a success toast "Organizacion actualizada" appears
- [ ] The form retains the new values after save
- [ ] The "Guardar cambios" button returns to disabled state after successful save

### Cleanup
- Revert the org name: clear the name field, type `Padel Group Lima`, clear the email field, type the original email value (or leave empty), click "Guardar cambios", wait for success toast

---

## H3: Facility Settings Tabs Visible for org_admin

**Role:** org_admin (continue from H2)

### Steps
1. Navigate to the facilities list: click "Locales" in the sidebar or go to `http://localhost:3000/org/padel-group-lima/facilities`
2. Click on an active facility card (e.g., "Padel Club San Isidro")
3. Wait for the facility dashboard to load
4. Click "Ajustes" in the facility sidebar
5. Wait for the facility settings page to load
6. Take a snapshot of the settings page

### Expected Results
- [ ] URL matches `/org/padel-group-lima/facilities/{facilityId}/settings`
- [ ] Page heading shows "Ajustes"
- [ ] Subtitle shows "Administra tu perfil y la configuracion del local"
- [ ] Tab bar is visible with tabs: "Mi Perfil", "Info del Local", "Fotos", "Equipo", "Notificaciones", "Seguridad"
- [ ] "Mi Perfil" tab is selected by default
- [ ] "Notificaciones" tab shows a "Pronto" badge
- [ ] All 6 tabs are visible (no tabs are hidden for org_admin)

---

## H4: Edit Facility Profile (Name, Phone, Description)

**Role:** org_admin (continue from H3)

### Steps
1. From the facility settings page, click the "Info del Local" tab
2. Wait for the facility info form to load
3. Take a snapshot of the form
4. Note the current values for name, phone, email, address, and description
5. Clear the "Telefono" field and type `+51 999 111 222`
6. Clear the "Descripcion" field and type `Club de padel renovado en San Isidro`
7. Click the "Guardar cambios" button
8. Wait for the save operation
9. Take a snapshot

### Expected Results
- [ ] The "Info del Local" tab shows a form with fields: Nombre del local, Telefono, Email (optional), Direccion, Distrito, Ciudad, Descripcion
- [ ] A facility info header shows the facility name with an "Editando" badge
- [ ] The "Guardar cambios" button is disabled when no changes are made
- [ ] After editing fields, the "Guardar cambios" button becomes enabled
- [ ] After saving, a success toast "Local actualizado" appears
- [ ] Below the form, a read-only "Informacion del Local" section shows court count, court types, and status badge
- [ ] An "Accesos Rapidos" section shows links to Horarios, Precios, Canchas

### Cleanup
- Revert the phone and description to original values, click "Guardar cambios"

---

## H5: Account Profile Tab (View Name, Email, Phone)

**Role:** org_admin (continue from H4)

### Steps
1. From the facility settings page, click the "Mi Perfil" tab
2. Wait for the profile form to load
3. Take a snapshot of the profile tab

### Expected Results
- [ ] Section heading shows "Informacion Personal" with subtitle "Actualiza tu informacion de perfil"
- [ ] A profile avatar area is visible (either initials or uploaded photo)
- [ ] Form fields visible: "Nombre completo" (editable), "Email" (disabled/read-only with gray background), "Telefono" (editable)
- [ ] Email field shows `owner@padelhub.pe` and has helper text "Para cambiar tu email, contacta a soporte"
- [ ] Phone field has placeholder text "+51 999 888 777"
- [ ] The "Guardar cambios" button is present and disabled when form is clean
- [ ] Below the form, a "Tu Acceso" section shows: organization name, role badge ("Administrador" for org_admin), and note "Como administrador, tienes acceso a todos los locales"
- [ ] The role badge for org_admin uses red/error styling

---

## H6: Change Password (Current + New Password Flow)

**Role:** org_admin (continue from H5)

### Steps
1. From the facility settings page, click the "Seguridad" tab
2. Wait for the security tab to load
3. Take a snapshot of the security tab
4. Locate the "Contrasena" section with a "Cambiar Contrasena" button
5. Click the "Cambiar Contrasena" button
6. Wait for the "Cambiar Contrasena" dialog/modal to appear
7. Take a snapshot of the dialog
8. Fill the "Contrasena actual" field with `password123`
9. Fill the "Nueva contrasena" field with `NewPassword123!`
10. Observe the password strength indicator that appears below the new password field
11. Fill the "Confirmar nueva contrasena" field with `NewPassword123!`
12. Click the "Cambiar Contrasena" submit button in the dialog footer
13. Wait for the operation to complete
14. Take a snapshot

### Expected Results
- [ ] Security tab shows sections: Contrasena, Autenticacion de Dos Factores (with "Proximamente" badge), Sesiones Activas (with "Proximamente" badge)
- [ ] The "Cambiar Contrasena" dialog has fields: "Contrasena actual", "Nueva contrasena", "Confirmar nueva contrasena"
- [ ] Dialog title is "Cambiar Contrasena" with description "Ingresa tu contrasena actual y la nueva contrasena"
- [ ] A password strength indicator appears when typing in the new password field (5 bars: Debil/Regular/Buena/Fuerte)
- [ ] For `NewPassword123!` the strength should show "Fuerte" (has length >= 12, uppercase, digit, special char)
- [ ] After submitting with correct current password, a success toast "Contrasena actualizada" appears
- [ ] The dialog closes automatically after success

### Cleanup
- Change the password back: click "Cambiar Contrasena" again, enter `NewPassword123!` as current, enter `password123` as new, confirm with `password123`, submit

---

## H7: Change Password with Wrong Current Password (Error)

**Role:** org_admin (continue from H6)

### Steps
1. From the security tab, click the "Cambiar Contrasena" button
2. Wait for the dialog to appear
3. Fill the "Contrasena actual" field with `wrongpassword`
4. Fill the "Nueva contrasena" field with `SomeNewPass123`
5. Fill the "Confirmar nueva contrasena" field with `SomeNewPass123`
6. Click the "Cambiar Contrasena" submit button
7. Wait for the error response
8. Take a snapshot of the dialog

### Expected Results
- [ ] The dialog remains open (does not close)
- [ ] An error message appears on the "Contrasena actual" field: "Contrasena actual incorrecta"
- [ ] No success toast appears
- [ ] The form fields retain their values
- [ ] The user can correct the current password and retry, or click "Cancelar" to close

### Cleanup
- Click "Cancelar" to close the dialog

---

## H8: RBAC Tab Visibility for Staff

**Role:** staff (`staff@padelhub.pe`)

### Steps
1. Sign out from the current session: find and click the sign-out button in the sidebar, confirm if prompted
2. Navigate to `http://localhost:3000/login`
3. Fill email field with `staff@padelhub.pe`
4. Fill password field with `password123`
5. Click the login/submit button
6. Wait for navigation to complete
7. Navigate to a facility's settings page. Since staff only has access to Facility 1, use the sidebar to navigate to that facility, then click "Ajustes" in the facility sidebar. If needed, navigate directly to the settings page URL from the DOM snapshot.
8. Wait for the facility settings page to load
9. Take a snapshot of the settings page

### Expected Results
- [ ] Page heading shows "Ajustes"
- [ ] Subtitle shows "Administra tu perfil y preferencias" (different from org_admin subtitle)
- [ ] Tab bar shows ONLY 3 tabs: "Mi Perfil", "Notificaciones", "Seguridad"
- [ ] The following tabs are NOT visible: "Info del Local", "Fotos", "Equipo"
- [ ] "Mi Perfil" is selected by default
- [ ] The profile form works the same as for org_admin (name, email read-only, phone)
- [ ] The "Tu Acceso" section shows role badge "Staff" with gray styling
- [ ] The "Tu Acceso" section shows the assigned facility name(s) for this staff member
- [ ] Clicking "Seguridad" tab shows the security section with "Cambiar Contrasena" button
- [ ] Staff cannot see org-level settings (no "Ajustes" link in the org sidebar)

---

## H9: Unsaved Changes Warning

**Role:** org_admin (`owner@padelhub.pe`)

### Steps
1. Sign out from the staff session
2. Navigate to `http://localhost:3000/login`
3. Fill email field with `owner@padelhub.pe`
4. Fill password field with `password123`
5. Click the login/submit button
6. Wait for navigation to complete
7. Navigate to a facility's settings page (click on an active facility, then click "Ajustes" in sidebar)
8. Click the "Info del Local" tab
9. Wait for the facility info form to load
10. Modify the "Nombre del local" field -- append " TEST" to the current value
11. Do NOT click "Guardar cambios"
12. Attempt to navigate away by clicking a different sidebar link (e.g., "Reservas" or "Canchas")
13. The browser should show a native `beforeunload` confirmation dialog
14. Take a screenshot if possible (note: native dialogs may not be capturable via snapshot)
15. If the dialog appears, dismiss it (stay on page) by clicking Cancel/Stay
16. Verify you are still on the settings page with the unsaved changes
17. Now clear the change by reverting the name field to its original value
18. Attempt to navigate away again -- this time no warning should appear

### Expected Results
- [ ] After modifying a form field, the `useUnsavedChanges` hook activates
- [ ] Attempting to close the tab or navigate away triggers the browser's native `beforeunload` dialog
- [ ] The dialog asks the user to confirm leaving the page (browser native text)
- [ ] Choosing to stay keeps the user on the settings page with their changes intact
- [ ] After reverting changes (form is no longer dirty), navigation proceeds without warning
- [ ] The "Guardar cambios" button reflects the dirty state: enabled when dirty, disabled when clean
- [ ] This behavior applies to both the "Mi Perfil" tab (profile form) and the "Info del Local" tab (facility info form)

**Note:** The `beforeunload` dialog is a native browser feature. Playwright MCP's `browser_handle_dialog` tool can be used to accept or dismiss this dialog. If the dialog cannot be captured via snapshot, verify the behavior by checking whether navigation was blocked.

---

## Reporting

After running all 9 scenarios, report:

| Test | Status | Notes |
|------|--------|-------|
| H1: Org settings tabs (org_admin) | PASS/FAIL | |
| H2: Edit org profile | PASS/FAIL | |
| H3: Facility settings tabs (org_admin) | PASS/FAIL | |
| H4: Edit facility profile | PASS/FAIL | |
| H5: Account profile tab | PASS/FAIL | |
| H6: Change password (success) | PASS/FAIL | |
| H7: Change password (wrong current) | PASS/FAIL | |
| H8: RBAC tab visibility (staff) | PASS/FAIL | |
| H9: Unsaved changes warning | PASS/FAIL | |

**Result: X/9 passed**
