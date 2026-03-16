# Tasks

## Completed

### Email Notification System

Fully implemented `packages/email` (React Email + Resend): 4 templates, high-level senders, integrated across all apps.

### Flow 1: Authentication & Access (8 tasks)

Login (email/password + Google OAuth), invite acceptance, password reset, rate limiting, post-login pending invite prompt, brand assets, auth error hardening, 129 tests.

### Flow 2: Organization Management (6 tasks)

Facility card actions, deactivation dialog, empty state, URL-persisted filters, org switcher, "Agregar Local" button.

### Image System (10 tasks)

`@wifo/images` package, Cloudflare Images integration (Direct Creator Upload), URL builder, tRPC images router, ImageUpload/Preview/Gallery components, integrated into facility photos, court photos, and org logo. 21 tests.

### Flow 3: Team & Roles - RBAC (8 tasks)

Last admin protection, facility manager invite scoping, `usePermission` hook, role-based sidebar filtering, route-level access guards, team table polish, invite/edit dialog enhancements, 35 tests.

### Flow 4: Facility Onboarding (11 tasks)

Schema migration (slug + geocoding), setup progress API, default operating hours, district autocomplete + geocoding, courts wizard redesign (individual CRUD + pricing), schedule wizard enhancement ("Aplicar a todos"), photos & amenities step, completion screen + activation gate, setup banner with progress, resume from correct step, slug auto-generation. 52 tests (setup: 37, slugify: 15).

### Flow 6: Schedule & Pricing (9 tasks)

Zone calculation utility, facility default pricing schema, enhanced operating hours editor (30-min increments, "Aplicar a todos", validation), peak period full CRUD (create/edit/delete with overlap detection, day shortcuts, max 5 limit), editable rate cards with facility defaults, court default/custom pricing system, revenue calculator (slider + monthly toggle), block time slots UI. 120 tests (schedule-utils: 48, schedule: 30, pricing: 42).

### Flow 7: Booking Management (7 tasks)

On-access status resolver, server-side price calculation, enhanced list API (multi-status, date range, sorting), cancel validations + state machine, comprehensive booking router tests (453 total), UI spec alignment, real dashboard stats. 143 tests (booking: 143).

### Flow 8: Calendar (7 tasks)

Calendar router fixes + tests, day view grid enhancements (zone backgrounds, blocked slots, court headers), booking block + popover polish, URL sync + keyboard shortcuts, legend/stats bar rework with zone colors + role-based display, week view enhancements (court dots, weekend bg, stripes, time indicator, quick booking), quick booking fixes + mini calendar dots. 474 total tests.

---

## Current

### Flow 9: Settings (7 tasks)

**Context**: Facility settings page already exists with tabs (Mi Perfil, Info del Local, Fotos, Notificaciones, Seguridad). Most sub-flows are partially or fully implemented. This flow fills the remaining gaps.

---

#### TASK-9.01 — Schema: add phone column to user table

**Type**: config
**Priority**: P0
**Depends on**: —

Add `phone` text column (nullable) to the `user` table in `packages/db/src/auth-schema.ts`. Run `pnpm db:push` to apply. Update seed data to include phone numbers for test accounts.

**Files**:
- `packages/db/src/auth-schema.ts` — add `phone: text("phone")` to user table
- `packages/db/src/seed.ts` — add phone to seed users (optional)

**Acceptance**:
- [x] `phone` column exists on `user` table (nullable text)
- [x] `pnpm db:push` succeeds
- [x] Existing data unaffected (column is nullable)
- [x] Comment in auth-schema.ts warning not to blindly re-run `auth:generate`

---

#### TASK-9.02 — API: extend account router (phone + auth provider)

**Type**: feature
**Priority**: P0
**Depends on**: TASK-9.01

Extend `account.getMyProfile` to return `phone` and `authProvider` (credential/google, derived from `account` table's `providerId`). Extend `account.updateMyProfile` to accept optional `phone` field with Peruvian format validation.

**Files**:
- `packages/api/src/router/account.ts` — extend both procedures
- `packages/api/src/__tests__/account.test.ts` — new test file

**Acceptance**:
- [ ] `getMyProfile` returns `phone` (string | null) and `authProvider` ("credential" | "google" | null)
- [ ] `updateMyProfile` accepts `{ name, phone? }` — phone validated as optional, format hint only
- [ ] Tests: getMyProfile returns phone + authProvider, updateMyProfile updates phone
- [ ] `pnpm test` passes

---

#### TASK-9.03 — UI: enhance profile tab (phone + avatar)

**Type**: feature
**Priority**: P0
**Depends on**: TASK-9.02

Add phone field to profile form. Add avatar upload using existing `ImageUpload` component with `entityType="user"`, `mode="single"`, `variant="avatar"`. Show Google avatar for OAuth users with option to override.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/profile-tab.tsx`

**Acceptance**:
- [ ] Phone field in form (optional, with format hint "+51 999 888 777")
- [ ] Avatar upload with circular preview using ImageUpload component
- [ ] Initials fallback when no avatar
- [ ] Google OAuth user: shows Google avatar by default, can override
- [ ] Email shown read-only with note "Para cambiar tu email, contacta a soporte"
- [ ] Save updates name + phone, toast "Perfil actualizado"
- [ ] "Guardar cambios" disabled until form is dirty

---

#### TASK-9.04 — UI: enable password change in security tab ✅

**Type**: feature
**Priority**: P0
**Depends on**: —

Wire up the password change button in the security tab. Use Better Auth's client-side `changePassword` method (no tRPC router needed). Create a modal with current password, new password (strength indicator), and confirm password fields.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/security-tab.tsx` — enable password card, add modal trigger
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/change-password-modal.tsx` — new file
- `packages/auth/src/client.ts` — export `changePassword` from authClient

**Acceptance**:
- [x] "Cambiar Contraseña" button enabled (not disabled)
- [x] Remove "Próximamente" badge from Security tab header (keep it on 2FA/sessions only)
- [x] Modal: current password (required), new password (min 8, strength indicator), confirm password (must match)
- [x] Wrong current password → "Contraseña actual incorrecta"
- [x] Success → toast "Contraseña actualizada", modal closes, other sessions revoked
- [x] Google OAuth users: show "Tu cuenta usa Google para iniciar sesión. No tienes contraseña configurada." with option to set one
- [x] 2FA and sessions cards remain as disabled stubs with "Próximamente" badges

---

#### TASK-9.05 — RBAC: allow staff to access settings (scoped tabs) ✅

**Type**: feature
**Priority**: P0
**Depends on**: —

Currently staff is fully redirected away from settings. The spec says staff should see 3 tabs: Mi Perfil, Notificaciones, Seguridad. Fix the page-level redirect and add role-based tab visibility.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/page.tsx` — remove staff redirect, pass role to view
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/facility-settings-view.tsx` — conditionally render tabs based on role
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/_components/facility-sidebar-nav.tsx` — show "Ajustes" link for all roles (remove `canConfigureFacility` permission gate)

**Acceptance**:
- [x] Staff can navigate to `/settings` from sidebar
- [x] Staff sees 3 tabs: Mi Perfil, Notificaciones, Seguridad
- [x] Staff does NOT see: Info del Local, Fotos, Equipo
- [x] Admin/Manager still see all tabs
- [x] Staff navigating to hidden tab via URL defaults to Mi Perfil tab

---

#### TASK-9.06 — API + UI: facility team tab

**Type**: feature
**Priority**: P1
**Depends on**: TASK-9.05

Add "Equipo" tab to facility settings showing team members scoped to this facility. Reuse team columns and dialogs from org settings. Add `facilityId` filter to `org.getTeamMembers` or create a new query.

**Files**:
- `packages/api/src/router/org.ts` — add optional `facilityId` filter to `getTeamMembers`
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/facility-team-tab.tsx` — new file
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/facility-settings-view.tsx` — add Equipo tab
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/page.tsx` — prefetch team data

**Acceptance**:
- [x] "Equipo" tab visible for admin + manager, hidden for staff
- [x] Shows team members who have access to this facility
- [x] Org admins always listed (access all facilities)
- [x] Managers/staff filtered to those assigned to this facility
- [x] Admin: "Invitar Miembro" button (opens Flow 3 invite dialog)
- [x] Manager: "Invitar Staff" button (scoped to this facility, staff role only)
- [x] Edit/remove use same modals from org settings (Flow 3)
- [x] Pending invites for this facility shown
- [x] Empty state: "No hay equipo asignado a este local"

---

#### TASK-9.07 — Polish: unsaved changes warning + sidebar sync

**Type**: feature
**Priority**: P1
**Depends on**: TASK-9.03

Add unsaved changes warning when navigating away from dirty forms (profile, facility info). Ensure updated name/avatar reflects immediately in the sidebar user section.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/profile-tab.tsx` — add beforeunload handler
- `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/facility-info-tab.tsx` — add beforeunload handler
- Sidebar component — ensure it reads from the same query that profile tab invalidates

**Acceptance**:
- [ ] Browser warns when navigating away from dirty profile form
- [ ] Browser warns when navigating away from dirty facility info form
- [ ] Updated name reflected immediately in sidebar after save
- [ ] Updated avatar reflected immediately in sidebar after save
