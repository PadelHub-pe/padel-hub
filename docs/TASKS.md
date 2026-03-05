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

---

## Current: Flow 3 - Team & Roles (RBAC)

See `docs/TECHNICAL_PLAN.md` for full context. Most backend + team UI already exists. Tasks focus on the gaps: last admin protection, role-based UI enforcement, facility scoping, and polish.

### ~~TASK-3.1: Last Admin Protection (API)~~ ✅
- **Type:** feature
- **Priority:** P0 (safety-critical)
- **Depends on:** nothing
- **Files:**
  - `packages/api/src/router/org.ts` - Add `validateNotLastAdmin()` helper, call in `updateMember` (when demoting from org_admin) and `removeMember` (when target is org_admin)
- **Acceptance criteria:**
  - Cannot remove the last `org_admin` from an organization (returns `FORBIDDEN` / `LAST_ADMIN`)
  - Cannot demote the last `org_admin` to `facility_manager` or `staff`
  - Count only active members (not pending invites)
  - Add tests for: sole admin removal blocked, sole admin demotion blocked, removal OK when 2+ admins, demotion OK when 2+ admins
- **Estimate:** Small

### TASK-3.2: Facility Manager Invite Scoping (API) ✅
- **Type:** feature
- **Priority:** P0
- **Depends on:** nothing
- **Files:**
  - `packages/api/src/router/org.ts` - Modify `inviteMember` and `getTeamMembers` procedures
- **Acceptance criteria:**
  - `facility_manager` can call `inviteMember` with `role: "staff"` only
  - `facility_manager` cannot invite `org_admin` or `facility_manager` (returns FORBIDDEN)
  - `facilityIds` must be a subset of the manager's own `facilityIds`
  - `getTeamMembers`: when called by `facility_manager`, return only members/invites scoped to their facilities (not org-wide team)
  - Add tests for manager invite scoping
- **Estimate:** Small

### ~~TASK-3.3: usePermission Hook + Role-Based Sidebar Filtering~~ ✅
- **Type:** feature
- **Priority:** P0
- **Depends on:** nothing
- **Files:**
  - `apps/nextjs/src/hooks/use-permission.ts` (new)
  - `apps/nextjs/src/app/org/_components/org-sidebar.tsx` - Pass `userRole` to nav
  - `apps/nextjs/src/app/org/_components/org-sidebar-nav.tsx` - Filter nav items by role
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/layout.tsx` - Pass current org role to sidebar
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/_components/facility-sidebar-nav.tsx` - Filter nav items by role
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/_components/facility-sidebar.tsx` - Pass `userRole` to nav
- **Acceptance criteria:**
  - `usePermission(role)` returns object with `canManageOrg`, `canConfigureFacility`, `canInviteStaff`, `canManageBookings`, etc.
  - **OrgSidebar:** `facility_manager` and `staff` do NOT see "Ajustes" link; `staff` does NOT see "Reportes"
  - **FacilitySidebar:** `staff` does NOT see "Canchas", "Horarios", "Precios", "Ajustes" (CONFIGURACION section hidden entirely); sees only Dashboard, Lista (bookings), Calendario
  - `facility_manager` sees full FacilitySidebar (all items)
- **Estimate:** Medium

### TASK-3.4: Route-Level Access Guards
- **Type:** feature
- **Priority:** P0
- **Depends on:** TASK-3.3
- **Files:**
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/settings/page.tsx` - Already guards (verify it covers manager redirect)
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/courts/page.tsx` - Staff redirect
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/schedule/page.tsx` - Staff redirect
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/page.tsx` - Staff redirect
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/pricing/page.tsx` - Staff redirect (if exists)
  - `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/layout.tsx` - Facility scoping: redirect if user can't access this facility
- **Acceptance criteria:**
  - `staff` navigating to `/courts`, `/schedule`, `/pricing`, `/settings` -> redirect to facility root (bookings or dashboard)
  - `facility_manager` navigating to `/org/[slug]/settings` -> redirect to `/org/[slug]/facilities` (already done, verify)
  - Scoped user navigating to unassigned facility -> redirect to first assigned facility with toast
  - Redirects are server-side (in page.tsx server components)
- **Estimate:** Medium

### TASK-3.5: Team Table Polish ✅
- **Type:** feature
- **Priority:** P1
- **Depends on:** nothing
- **Files:**
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/settings/_components/team-tab.tsx`
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/settings/_components/team-columns.tsx`
- **Acceptance criteria:**
  - Staff badge color: green (`bg-green-100 text-green-700`) instead of gray
  - Member count header: "5 miembros / 2 invitaciones pendientes"
  - Empty state when only current user: "Eres el unico miembro. Invita a tu equipo para gestionar tus locales juntos." with invite CTA
  - Current user row: subtle highlight with `bg-blue-50` background
  - Sorting: current user first, then active members alphabetically, then pending invites by date
  - Pending invite rows: show invited date as subtitle text
  - Expired invites: show "Expirada" status (amber-red) with resend as only action
- **Estimate:** Small

### ~~TASK-3.6: Invite Dialog Enhancements~~ ✅
- **Type:** feature
- **Priority:** P1
- **Depends on:** TASK-3.2
- **Files:**
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/settings/_components/invite-member-dialog.tsx`
- **Acceptance criteria:**
  - Role descriptions under each option:
    - "Administrador - Acceso total a la organizacion"
    - "Manager de Local - Gestiona y configura locales asignados"
    - "Staff - Opera reservas y calendario en locales asignados"
  - When `facility_manager` invites: only show "Staff" role option
  - When `facility_manager` invites: facility list scoped to their assigned facilities
  - At least 1 facility required for manager/staff role (submit disabled until selected)
  - Pass `userRole` and `userFacilityIds` props to dialog
- **Estimate:** Small

### TASK-3.7: Edit Member Dialog Enhancements ✅
- **Type:** feature
- **Priority:** P1
- **Depends on:** TASK-3.1
- **Files:**
  - `apps/nextjs/src/app/org/[orgSlug]/(org-view)/settings/_components/edit-member-dialog.tsx`
- **Acceptance criteria:**
  - Demotion confirmations (Admin->Manager, Admin->Staff, Manager->Staff): show confirmation with consequence description
  - Promotions (Staff->Manager, Staff->Admin, Manager->Admin): no confirmation needed
  - Last admin protection: if sole admin, role select can't change to Manager/Staff (disabled with tooltip)
  - At least 1 facility required for manager/staff
  - Pass admin count to dialog for last-admin UI hints
- **Estimate:** Small

### TASK-3.8: Tests for Flow 3 ✅
- **Type:** feature
- **Priority:** P1
- **Depends on:** TASK-3.1, TASK-3.2
- **Files:**
  - `packages/api/src/__tests__/team.test.ts` (new) - Tests for org router team procedures
- **Acceptance criteria:**
  - Last admin protection: block removal/demotion of sole admin, allow when 2+ admins
  - Facility manager invite scoping: can invite staff only, facilityIds must be subset
  - Self-edit/self-remove prevention
  - Duplicate invite prevention
  - Duplicate member prevention
- **Estimate:** Medium

### Parallel Execution Groups

**Group A (independent, can run in parallel):**
- TASK-3.1 (Last admin protection - API)
- TASK-3.2 (Facility manager invite scoping - API)
- TASK-3.3 (usePermission + sidebar filtering)
- TASK-3.5 (Team table polish)

**Group B (depends on Group A):**
- TASK-3.4 (Route guards) - depends on TASK-3.3
- TASK-3.6 (Invite dialog enhancements) - depends on TASK-3.2
- TASK-3.7 (Edit member dialog enhancements) - depends on TASK-3.1
- TASK-3.8 (Tests) - depends on TASK-3.1, TASK-3.2
