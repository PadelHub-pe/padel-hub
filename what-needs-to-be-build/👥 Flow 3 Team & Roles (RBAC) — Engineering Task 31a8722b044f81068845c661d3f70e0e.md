# 👥 Flow 3: Team & Roles (RBAC) — Engineering Task

Build the team management experience and enforce role-based access control across the entire dashboard. Org admins invite team members, assign roles, scope access to specific facilities, and manage the team lifecycle. RBAC rules then govern what every user can see and do.

---

## Context & Scope

**What Flow 3 owns:** The "Equipo" tab in org settings, invite sending, member editing/removal, invite lifecycle (cancel/resend), and the **enforcement** of RBAC rules across all dashboard views.

**What Flow 3 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 1 (Auth) | Invite **acceptance** — account creation via invite link (1.3, 1.4, 1.10) | That's the recipient's auth flow, not the admin's team management flow |
| 📧 Email System | Sending the invite email (OrganizationInvite template) | Flow 3 triggers the send; the email package handles rendering and delivery |
| Flow 2 (Org) | The settings page tab structure and org profile tab | Flow 3 only owns the "Equipo" tab content |

**The RBAC chain:**

```
Flow 3 (sends invite)
  → 📧 Email System (delivers invite email)
  → Flow 1.3 (recipient accepts, creates account, joins org)
  → Flow 3 RBAC rules (control what the new member can see/do)
```

---

## Prerequisites

- Flow 1 (Auth) — at minimum 1.7 (org membership validation) and 1.8 (redirect unauthorized)
- 📧 Email System — `sendOrganizationInvite()` working
- `organization_members` table ✅
- `organization_invites` table (defined in Flow 1 task, may need migration)
- Flow 2 — org settings page with tab structure exists

---

## Role Architecture — Three Roles

The three roles map to real organizational hierarchy in Lima's padel facilities. Each has a clear functional boundary.

### Role Definitions

| Role | Badge | Persona | Boundary |
| --- | --- | --- | --- |
| `org_admin` | Red — `red-100/red-700` | **The Owner(s).** Sees everything, controls everything. Creates facilities, manages the org, invites managers. Thinks: "my business across all locations." | Org ↔ Facility line |
| `facility_manager` | Blue — `blue-100/blue-700` | **The Location Leader.** Strategic control over assigned facility(ies). Views stats, manages staff roster, sets pricing, configures schedule, creates/edits courts. Thinks: "my location's performance and team." | Config ↔ Operations line |
| `staff` | Green — `green-100/green-700` | **The Operator.** The person on the ground running the facility. Creates bookings for walk-ins, confirms/cancels reservations, manages the calendar, interacts with players. Could be the receptionist, counter staff, or a coach. Thinks: "today's bookings and the players in front of me." | Operations only |

**Key insight:** `staff` is NOT view-only — they're the ones **doing the work**. They just can't change the facility's configuration, pricing, or team. The boundary is clean: **Config vs Operations** separates `facility_manager` from `staff`; **Org vs Facility** separates `org_admin` from `facility_manager`.

### Who Invites Whom

| Inviter | Can invite | Where |
| --- | --- | --- |
| `org_admin` | `org_admin`, `facility_manager`, `staff` | Org Settings → Equipo tab |
| `facility_manager` | `staff` (for their assigned facilities only) | Facility Settings → Equipo tab |
| `staff` | Nobody | — |

---

## RBAC Permission Matrix

This is the **source of truth** for what each role can do. Every sub-flow and every other flow in the tracker should reference this.

### Organization Level

| Action | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| View all facilities in org | ✅ | ❌ Assigned only | ❌ Assigned only |
| Create facility | ✅ | ❌ | ❌ |
| Activate/deactivate facility | ✅ | ❌ | ❌ |
| Org settings (profile, billing) | ✅ | ❌ | ❌ |
| Invite admins & managers | ✅ | ❌ | ❌ |

### Facility Configuration (requires `facility_manager` or above)

| Action | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| Edit facility info (name, address, photos) | ✅ All | ✅ Assigned | ❌ |
| Create/edit/delete courts | ✅ All | ✅ Assigned | ❌ |
| Manage schedule & pricing | ✅ All | ✅ Assigned | ❌ |
| Create events / promotions | ✅ All | ✅ Assigned | ❌ |
| View facility stats & analytics | ✅ All | ✅ Assigned | ❌ |
| Invite/manage staff | ✅ | ✅ Assigned facility only | ❌ |
| View team members of facility | ✅ | ✅ Assigned | ❌ |

### Daily Operations (all facility-scoped roles)

| Action | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| View bookings list | ✅ | ✅ | ✅ Assigned |
| View calendar | ✅ | ✅ | ✅ Assigned |
| Create booking (walk-in) | ✅ | ✅ | ✅ Assigned |
| Confirm/cancel bookings | ✅ | ✅ | ✅ Assigned |
| Add/remove players from booking | ✅ | ✅ | ✅ Assigned |
| View today's summary | ✅ | ✅ | ✅ Assigned (simplified) |

### Personal

| Action | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| Edit own profile | ✅ | ✅ | ✅ |

### Permission Check Helpers

The RBAC checks remain clean because we ask two questions, not three-way branches:

```tsx
// Question 1: Can this user CONFIGURE this facility?
function canConfigureFacility(role: OrgRole): boolean {
  return role === 'org_admin' || role === 'facility_manager';
}

// Question 2: Can this user OPERATE in this facility?
function canOperateInFacility(role: OrgRole): boolean {
  return role === 'org_admin' || role === 'facility_manager' || role === 'staff';
  // Essentially: is the user a member at all? Yes → they can operate.
}

// Question 3: Can this user manage ORG-LEVEL things?
function canManageOrg(role: OrgRole): boolean {
  return role === 'org_admin';
}
```

---

## Refined Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 3.1 | View team members + pending invites | `/org/[slug]/settings` → Equipo tab | P0 |
| 3.2 | Invite member (email, role, facility scope) | "Invitar Miembro" modal | P0 |
| 3.3 | Edit member role + facility scope | Edit member modal | P0 |
| 3.4 | Remove member | Remove confirmation dialog | P0 |
| 3.5 | Cancel / resend invite | Invite row actions | P0 |
| 3.6 | Last admin protection | API validation | P0 |
| 3.7 | Role-based UI enforcement (3 roles × dashboard views) | All dashboard views | P0 |
| 3.8 | Facility scoping enforcement (managers + staff see only assigned) | Sidebar + all facility pages | P0 |

**Changes from original:**

- **Three roles now shipped in MVP:** `org_admin`, `facility_manager`, `staff`
- **Staff is operational, not view-only:** They create/manage bookings, handle walk-ins, manage the calendar
- **Facility managers can invite staff** for their assigned facilities (not just org admins)
- **Added 3.6 — Last admin protection.** Critical safety rail
- **Split 3.7 / 3.8** — role-based UI vs facility scoping are different engineering concerns

---

## Sub-flow Specifications

---

### 3.1 View Team Members + Pending Invites

**Route:** `/org/[slug]/settings` → "Equipo" tab

**Priority:** P0

**Reference:** [Org Settings screen — Tab 2](https://www.notion.so/Dashboard-Organization-Settings-screen-30a8722b044f819e8d43d9f54d54aa82?pvs=21)

#### Behavior

The team tab displays a unified table of active members and pending invites. Active members show their profile info; pending invites show the invited email with a "Pendiente" status.

#### Table Columns

| Column | Active Member | Pending Invite |
| --- | --- | --- |
| Member | Avatar + display name + email | Email icon avatar + email address (60% opacity) |
| Rol | Role badge (red "Administrador" / blue "Manager" / green "Staff") | Role badge (same, but faded) |
| Locales | Facility pills or "Todos los locales" | Facility pills or "Todos los locales" |
| Estado | Green dot + "Activo" | Amber dot + "Pendiente" |
| Acciones | Edit ✎ / Remove 🗑 | Resend ↻ / Cancel × |

#### Row States

- **Current user row:** Highlighted with `primary-50` background, "Tú" label next to name. Edit and remove actions hidden (can't edit/remove yourself here — that's profile settings)
- **Active member:** Standard row
- **Pending invite:** 60% opacity, email icon as avatar placeholder, shows invite creation date as subtitle

#### Acceptance Criteria

- [ ]  Team tab loads with table showing all active members + pending invites
- [ ]  Active members show: avatar (or initials fallback), display name, email, role badge, facility pills, "Activo" status
- [ ]  Pending invites show: email icon avatar, email address, role badge, facility pills, "Pendiente" status, invited date
- [ ]  Current user row highlighted with "Tú" label
- [ ]  Current user row has no edit/remove actions
- [ ]  Table sorted: current user first, then active members alphabetically, then pending invites by date
- [ ]  "Invitar Miembro" button in tab header
- [ ]  Empty state (only you in org): "Eres el único miembro. Invita a tu equipo para gestionar tus locales juntos." with invite CTA
- [ ]  Loading state: skeleton rows
- [ ]  Member count shown: "5 miembros · 2 invitaciones pendientes"

#### API

```tsx
team.list.query({ orgSlug: string })
// Returns: {
//   members: TeamMember[],   // Active users with org membership
//   invites: PendingInvite[], // Pending organization_invites
// }

type TeamMember = {
  id: string;            // membership ID
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: 'org_admin' | 'facility_manager' | 'staff';
  facilityIds: string[] | null;  // null = all facilities (org_admin only)
  facilities: { id: string; name: string }[]; // resolved names
  isCurrentUser: boolean;
  joinedAt: string;
};

type PendingInvite = {
  id: string;            // invite ID
  email: string;
  role: 'org_admin' | 'facility_manager' | 'staff';
  facilityIds: string[] | null;
  facilities: { id: string; name: string }[];
  invitedBy: string;     // inviter's display name
  createdAt: string;
  expiresAt: string;
};
```

---

### 3.2 Invite Member

**Component:** "Invitar Miembro" modal

**Priority:** P0 — This is how new users enter the platform

#### Behavior

1. Org admin clicks "Invitar Miembro" → modal opens
2. Fills in email, selects role
3. If role is `facility_manager` → facility multi-select appears
4. Clicks "Enviar Invitación"
5. Backend: creates `organization_invites` row → sends invite email via `@padelhub/email`
6. Modal closes → toast "Invitación enviada a [email]" → table refreshes with new pending row

#### Modal Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Email | Email input | Yes | Valid email format |
| Rol | Select | Yes | Options depend on inviter's role (see below) |
| Locales | Multi-select checkboxes | Yes (if Manager or Staff) | At least 1 facility selected |

#### Role Selection Behavior

**When `org_admin` invites:** Shows all three options:

- "Administrador — Acceso total a la organización"
- "Manager de Local — Gestiona y configura locales asignados"
- "Staff — Opera reservas y calendario en locales asignados"

**When `facility_manager` invites:** Shows only:

- "Staff — Opera reservas y calendario en locales asignados"
- Facility multi-select is **pre-scoped** to the manager's assigned facilities only (they can't assign staff to facilities they don't manage)

**Role → facility selector logic:**

- **Administrador** selected → facility multi-select hidden (admins access all)
- **Manager de Local** selected → facility multi-select shows all org facilities
- **Staff** selected → facility multi-select shows all org facilities (if org_admin) or only inviter's assigned facilities (if facility_manager)

#### Acceptance Criteria

- [ ]  Modal opens with email, role, and conditional facility fields
- [ ]  `org_admin` sees all 3 role options; `facility_manager` sees only "Staff"
- [ ]  Selecting "Administrador" hides facility selector
- [ ]  Selecting "Manager de Local" or "Staff" reveals facility multi-select
- [ ]  When `facility_manager` invites, facility list is scoped to their assigned facilities only
- [ ]  Facility multi-select lists facilities with checkboxes, showing name + district
- [ ]  At least 1 facility required for manager/staff → submit disabled until selected
- [ ]  Email validation: reject invalid format
- [ ]  Duplicate check: if email already has an active membership → "Este email ya es miembro de tu organización."
- [ ]  Duplicate check: if email has a pending invite → "Ya existe una invitación pendiente para este email. ¿Deseas reenviarla?"
- [ ]  Submit → creates invite in DB + sends email via `sendOrganizationInvite()`
- [ ]  Token generated: 32+ char secure random string, expires in 7 days
- [ ]  Toast on success: "Invitación enviada a [email]"
- [ ]  Toast on email failure: "Invitación creada pero no se pudo enviar el email. Puedes reenviarla." (invite still saved)
- [ ]  Table refreshes optimistically with new pending invite row
- [ ]  Loading state on submit button while processing

#### API

```tsx
team.invite.mutate({
  orgSlug: string,
  email: string,
  role: 'org_admin' | 'facility_manager' | 'staff',
  facilityIds?: string[],  // Required if facility_manager or staff
})
// Validates: user is org_admin OR (facility_manager inviting staff for own facilities)
// Validates: email not already a member
// Validates: email not already pending
// Validates: facilityIds provided if role is facility_manager or staff
// Validates: if inviter is facility_manager, facilityIds must be subset of their own facilities
// Creates: organization_invites row with token + 7-day expiry
// Sends: invite email via @padelhub/email
// Returns: { success: true, invite: PendingInvite }
```

---

### 3.3 Edit Member Role + Facility Scope

**Component:** Edit member modal

**Priority:** P0

#### Behavior

1. Org admin clicks edit icon ✎ on a member row
2. Modal opens pre-filled with current role and facility assignments
3. Admin changes role and/or facility scope
4. Clicks "Guardar Cambios"
5. Backend updates `organization_members` row
6. Modal closes → toast → table refreshes

#### Role Change Consequences

| Change | Effect |
| --- | --- |
| Admin → Manager | Loses org settings access, must assign facilities. Confirm: "¿Cambiar a Manager? Perderá acceso a configuración de organización y solo verá los locales asignados." |
| Admin → Staff | Loses org settings AND facility config access. Confirm: "¿Cambiar a Staff? Solo podrá gestionar reservas y calendario en los locales asignados." |
| Manager → Admin | Gains full access to all facilities and org settings. No destructive action → no confirmation needed |
| Manager → Staff | Loses facility configuration access (courts, pricing, schedule, staff management). Confirm: "¿Cambiar a Staff? Solo podrá gestionar reservas y calendario." |
| Staff → Manager | Gains facility configuration access. No destructive action → no confirmation needed |
| Staff → Admin | Gains full access. No destructive action → no confirmation needed |
| Change facility scope | Manager/staff gains/loses access to specific facilities immediately |

**Rule:** Confirmations only for demotions (losing access). Promotions (gaining access) don't need confirmation.

#### Acceptance Criteria

- [ ]  Edit modal opens with current role and facility assignments pre-filled
- [ ]  Can change role between Admin ↔ Manager ↔ Staff
- [ ]  Demotions (Admin→Manager, Admin→Staff, Manager→Staff) trigger confirmation dialog
- [ ]  Promotions (Staff→Manager, Staff→Admin, Manager→Admin) proceed without confirmation
- [ ]  Promoting to Admin hides facility selector (admins access all)
- [ ]  Can change facility assignments for managers and staff
- [ ]  At least 1 facility required for managers
- [ ]  Cannot edit your own role (edit icon hidden on current user row)
- [ ]  Respects last admin protection (3.6) — cannot demote if sole admin
- [ ]  Save → API call → toast: "Rol actualizado" → table refreshes
- [ ]  Changes take effect immediately (member's next page load reflects new permissions)

#### API

```tsx
team.updateMember.mutate({
  orgSlug: string,
  memberId: string,         // organization_members.id
  role?: 'org_admin' | 'facility_manager' | 'staff',
  facilityIds?: string[],   // Required if changing to/staying facility_manager or staff
})
// Validates: user is org_admin
// Validates: not editing self
// Validates: last admin protection
// Validates: facilityIds provided if role is facility_manager
// Returns: { success: true, member: TeamMember }
```

---

### 3.4 Remove Member

**Component:** Confirmation dialog

**Priority:** P0

#### Behavior

1. Org admin clicks remove icon 🗑 on a member row
2. Confirmation dialog: "¿Eliminar a [Name] de [Org Name]? Perderá acceso al dashboard inmediatamente."
3. Confirm → deletes `organization_members` row
4. Dialog closes → toast → table refreshes

#### Acceptance Criteria

- [ ]  Confirmation dialog shows member name and consequence
- [ ]  Confirm → membership deleted → member loses access on next page load/API call
- [ ]  Cannot remove yourself (remove icon hidden on current user row)
- [ ]  Respects last admin protection (3.6)
- [ ]  Toast on success: "[Name] ha sido eliminado de [Org Name]"
- [ ]  If removed member is currently logged in, their next API call returns 401 → redirected to dead-end page (Flow 1.8)
- [ ]  Removed member's user account still exists (they can be re-invited later)
- [ ]  Any active sessions for the removed member should be invalidated (or handled gracefully at next auth check)

#### API

```tsx
team.removeMember.mutate({
  orgSlug: string,
  memberId: string,
})
// Validates: user is org_admin
// Validates: not removing self
// Validates: last admin protection
// Deletes: organization_members row
// Returns: { success: true }
```

---

### 3.5 Cancel / Resend Invite

**Component:** Invite row action buttons

**Priority:** P0

#### Resend Behavior

1. Click resend icon ↻ on pending invite row
2. Backend: reset `expiresAt` to 7 days from now → re-send invite email with same token
3. Toast: "Invitación reenviada a [email]"

#### Cancel Behavior

1. Click cancel icon × on pending invite row
2. Confirmation: "¿Cancelar invitación a [email]?"
3. Backend: set invite `status` to `cancelled`
4. Toast: "Invitación cancelada" → row removed from table

#### Acceptance Criteria

- [ ]  Resend: resets expiry to 7 days → sends new email → toast confirmation
- [ ]  Resend: uses the same token (recipient's link still works if they had the old email)
- [ ]  Cancel: confirmation dialog → invite status set to `cancelled`
- [ ]  Cancel: if recipient tries to use the link after cancellation → "Esta invitación fue cancelada" (handled in Flow 1.4)
- [ ]  Expired invites show "Expirada" status in amber-red with resend as only action (cancel not needed)
- [ ]  Can resend an expired invite (resets expiry + re-sends email)
- [ ]  Resend disabled during email sending (loading state on button)

#### API

```tsx
team.resendInvite.mutate({ orgSlug: string, inviteId: string })
// Validates: invite exists, belongs to this org, status is 'pending' or 'expired'
// Updates: expiresAt = now + 7 days
// Sends: invite email
// Returns: { success: true }

team.cancelInvite.mutate({ orgSlug: string, inviteId: string })
// Validates: invite exists, belongs to this org, status is 'pending'
// Updates: status = 'cancelled'
// Returns: { success: true }
```

---

### 3.6 Last Admin Protection

**Priority:** P0 — Prevents orphaning an organization

#### Rules

1. **Cannot remove the last `org_admin`** from an organization
2. **Cannot demote the last `org_admin`** to `facility_manager`
3. **Cannot leave the org** if you're the sole admin (future self-removal feature)

#### Acceptance Criteria

- [ ]  API validates admin count before any role change or removal
- [ ]  If action would leave 0 admins → API returns error: `LAST_ADMIN`
- [ ]  UI: if member is the sole admin, remove icon is hidden/disabled with tooltip: "Último administrador. Agrega otro administrador antes de eliminar."
- [ ]  UI: if member is the sole admin, role select in edit modal can't change to Manager with tooltip: "Debes tener al menos un administrador."
- [ ]  The check counts only **active members** with `org_admin` role (pending invites for admin role don't count)

#### Implementation

```tsx
async function validateNotLastAdmin(orgId: string, memberId: string) {
  const adminCount = await db
    .select({ count: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.role, 'org_admin'),
        ne(organizationMembers.id, memberId) // Exclude the member being modified
      )
    );
  
  if (adminCount[0].count === 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'LAST_ADMIN',
    });
  }
}
```

---

### 3.7 Role-Based UI Enforcement

**Priority:** P0 — Cross-cutting across entire dashboard

#### What Each Role Sees

**Org Admin — Full Dashboard:**

- Sidebar: Org-level navigation (Facilities Overview, Settings, Analytics)
- Settings: All tabs (Organization, Team, Billing)
- Facilities: Sees all facilities in grid
- Can create facilities, invite all roles, toggle facility status

**Facility Manager — Facility Config + Operations:**

- Sidebar: Facility-level navigation (Dashboard with stats, Courts, Bookings, Calendar, Schedule/Pricing, Facility Settings)
- Can see team tab in facility settings (manage staff for their facility)
- No org-level settings link in sidebar
- No "Agregar Local" button
- Can invite staff for their assigned facilities
- If they navigate to `/org/[slug]/settings` directly → redirect to first assigned facility

**Staff — Operations Only:**

- Sidebar: Operational navigation only (Bookings, Calendar, Today's Summary)
- No courts, schedule/pricing, facility settings, stats/analytics
- No team management
- No facility configuration of any kind
- Clean, focused UI for daily operations
- If they navigate to configuration routes → redirect to bookings/calendar

#### Staff's Simplified View

Staff sees a streamlined interface focused on today's operations:

- **Today's summary card:** Today's booking count, next upcoming booking, facility name
- **Bookings list:** Full CRUD for bookings (create walk-in, confirm, cancel, manage players)
- **Calendar:** Day/week view for their assigned facility
- No stats dashboards, no revenue numbers, no analytics
- No court management, no schedule editing, no pricing

#### Acceptance Criteria

- [ ]  `org_admin` sees full sidebar with org-level nav items
- [ ]  `facility_manager` sees facility-level nav with config items (Courts, Schedule, Facility Settings)
- [ ]  `staff` sees only operational nav items (Bookings, Calendar)
- [ ]  `staff` cannot see Courts, Schedule/Pricing, Facility Settings, Stats/Analytics in sidebar
- [ ]  `facility_manager` cannot see org-level settings or "Agregar Local" button
- [ ]  `staff` navigating to config routes (`/courts`, `/schedule`, `/settings`) → redirect to `/bookings`
- [ ]  `facility_manager` navigating to `/org/[slug]/settings` → redirect to first assigned facility
- [ ]  `facility_manager` can see "Equipo" in their facility settings (to manage staff)
- [ ]  `staff` cannot see "Equipo" anywhere
- [ ]  Role and permissions loaded in React context at layout level (from Flow 1.7 OrgContext)
- [ ]  Components use a `usePermission()` hook to conditionally render UI
- [ ]  Server-side: every tRPC mutation validates the user's role before executing

#### Implementation Pattern

```tsx
function usePermission() {
  const { membership } = useOrgContext();
  const role = membership.role;
  
  return {
    // Role checks
    isOrgAdmin: role === 'org_admin',
    isFacilityManager: role === 'facility_manager',
    isStaff: role === 'staff',
    
    // Org-level actions
    canManageOrg: role === 'org_admin',
    canCreateFacility: role === 'org_admin',
    canToggleFacilityStatus: role === 'org_admin',
    
    // Facility config actions (admin + manager)
    canConfigureFacility: role === 'org_admin' || role === 'facility_manager',
    canManageCourts: role === 'org_admin' || role === 'facility_manager',
    canManageSchedule: role === 'org_admin' || role === 'facility_manager',
    canViewStats: role === 'org_admin' || role === 'facility_manager',
    
    // Team management
    canManageOrgTeam: role === 'org_admin',
    canInviteStaff: role === 'org_admin' || role === 'facility_manager',
    
    // Operations (everyone)
    canManageBookings: true,  // All roles can manage bookings
    canViewCalendar: true,    // All roles can view calendar
    
    // Facility access
    canAccessFacility: (facilityId: string) =>
      role === 'org_admin' ||
      membership.facilityIds?.includes(facilityId) ?? false,
  };
}
```

---

### 3.8 Facility Scoping Enforcement

**Priority:** P0 — Cross-cutting for facility managers AND staff

#### Behavior

Both `facility_manager` and `staff` only see and interact with their assigned facilities. This must be enforced at every layer: sidebar navigation, facility list, data queries, and direct URL access. The scoping logic is identical for both roles — the difference is what they can DO within those facilities (handled by 3.7).

#### Enforcement Layers

| Layer | How |
| --- | --- |
| Sidebar | Facility switcher dropdown only shows assigned facilities |
| Facilities page | `org.getFacilities` filters by `facilityIds` for managers and staff |
| Facility routes | Layout-level check: if facility not in `facilityIds` → redirect |
| tRPC queries | All facility-scoped queries filter by membership's `facilityIds` |
| tRPC mutations | All facility-scoped mutations validate facility access before executing |

#### Acceptance Criteria

- [ ]  `facility_manager` and `staff` sidebar only shows assigned facilities in switcher
- [ ]  Scoped user's facilities overview page only shows assigned facilities (with adjusted KPIs)
- [ ]  Scoped user navigating to `/org/[slug]/f/[unassignedFacility]/*` → redirect to first assigned facility with toast: "No tienes acceso a este local"
- [ ]  tRPC queries for bookings, courts, schedule only return data for accessible facilities
- [ ]  tRPC mutations validate facility access before executing
- [ ]  If assignments change (edited by admin/manager), next page load reflects new scope
- [ ]  User with 1 assigned facility: sidebar shows that facility directly (no switcher dropdown)
- [ ]  User with multiple assigned facilities: sidebar shows switcher dropdown with only their facilities
- [ ]  Staff scoping is identical to manager scoping — same `facilityIds` check, different UI/permissions

#### Scoping Logic

```tsx
function canAccessFacility(membership: OrgMember, facilityId: string): boolean {
  if (membership.role === 'org_admin') return true;
  
  // Both facility_manager and staff are scoped the same way
  return membership.facilityIds?.includes(facilityId) ?? false;
}

function getAccessibleFacilities(
  membership: OrgMember, 
  allFacilities: Facility[]
): Facility[] {
  if (membership.role === 'org_admin') return allFacilities;
  
  return allFacilities.filter(f => 
    membership.facilityIds?.includes(f.id)
  );
}

// Reusable tRPC middleware
const facilityAccessProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const facilityId = ctx.input.facilityId;
  const membership = ctx.membership;
  
  if (!canAccessFacility(membership, facilityId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tienes acceso a este local',
    });
  }
  
  return next({ ctx });
});
```

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 3.7 — Role-based UI enforcement | Foundation. `usePermission()` hook + conditional rendering across all views. Must exist before team management UI | 4-5h |
| 2 | 3.8 — Facility scoping enforcement | Pairs with 3.7. Server-side + client-side filtering for facility managers | 4-5h |
| 3 | 3.1 — View team members + invites | Read-only table. Validates data model before mutation work | 3-4h |
| 4 | 3.6 — Last admin protection | API validation. Must exist before invite/edit/remove to prevent bad states | 1h |
| 5 | 3.2 — Invite member | Core action. Depends on email system and invite table | 4-5h |
| 6 | 3.3 — Edit member | Role change + facility scope change | 3-4h |
| 7 | 3.4 — Remove member | Simplest mutation, but needs session invalidation consideration | 2h |
| 8 | 3.5 — Cancel / resend invite | Invite lifecycle management | 2h |

**Total estimate:** ~26-34 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/
│   ├── settings/
│   │   └── page.tsx                       # Team tab lives here (Flow 2 owns tab structure)
│   ├── layout.tsx                         # OrgContext with role + facilityIds (Flow 1.7)
│   └── f/[facilitySlug]/
│       └── layout.tsx                     # Facility access check (3.8)
├── components/
│   ├── team/
│   │   ├── TeamTable.tsx                  # 3.1 — Members + invites table
│   │   ├── TeamMemberRow.tsx              # 3.1 — Individual member row
│   │   ├── PendingInviteRow.tsx           # 3.1 — Pending invite row
│   │   ├── InviteMemberModal.tsx          # 3.2 — Invite form modal
│   │   ├── EditMemberModal.tsx            # 3.3 — Edit role/scope modal
│   │   ├── RemoveMemberDialog.tsx         # 3.4 — Confirmation dialog
│   │   ├── RoleBadge.tsx                  # Shared role badge component
│   │   └── FacilityPills.tsx              # Shared facility assignment pills
│   └── hooks/
│       └── usePermission.ts               # 3.7 — RBAC hook for all components

packages/api/src/router/
├── team.ts                                # team.list, invite, updateMember, removeMember, etc.
└── middleware/
    └── facilityAccess.ts                  # 3.8 — Reusable facility scope middleware
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 1.7 — Org membership in layout (OrgContext) | 🔲 In progress | 3.7 and 3.8 need role/facilityIds in context |
| 📧 Email System — `sendOrganizationInvite()` | 🔲 Not started | 3.2 (invite sending). Can stub with console.log for testing |
| `organization_invites` table | 🔲 Needs migration | 3.1, 3.2, 3.5 |
| `organization_members` table | ✅ Exists | — |
| Flow 2.5 — Org settings page with tabs | 🔲 Not started | 3.1 needs the tab structure to exist. Can build tab content independently |

---

## Edge Cases & Safety Rails

| Scenario | Expected Behavior |
| --- | --- |
| Invite email that already has a user account | Invite created. When they use the invite link, they're prompted to login instead of register. After login, invite auto-accepted |
| Invite same email twice | Second invite blocked: "Ya existe una invitación pendiente para este email" |
| Demote sole admin | Blocked by last admin protection (3.6) |
| Remove sole admin | Blocked by last admin protection (3.6) |
| Admin removes themselves | Not allowed in team management. Self-removal via profile settings (future) |
| Remove manager/staff who is currently logged in | Their next API call returns 403 → org layout redirects to dead-end page |
| Change manager/staff facilities while they're viewing a now-removed facility | Their next navigation or API call to that facility returns 403 → redirect to first assigned facility |
| Manager/staff with 0 assigned facilities | Should not be possible (validation requires ≥1). If somehow happens, show dead-end: "No tienes locales asignados. Contacta al administrador." |
| Invite to org that has 0 facilities | Allowed for admins. For managers/staff, facility multi-select shows empty with message: "No hay locales aún. Crea uno primero." |
| Manager invites staff to facility they don't manage | API validates: facilityIds must be a subset of inviter's own facilityIds. Blocked if not. |
| Manager tries to invite another manager | Role selector only shows "Staff". API validates: facility_manager can only invite staff. |
| Staff tries to access team management | No team UI visible. Direct URL to team routes → redirect to bookings. |

---

## Testing Checklist

### Team Management

- [ ]  **View table:** See yourself (highlighted) + other members + pending invites with correct role badges
- [ ]  **Invite admin:** Org admin sends invite → email received → pending row appears
- [ ]  **Invite manager:** Org admin sends invite with 2 facilities → email shows facility names → pending row shows facility pills
- [ ]  **Invite staff (by org admin):** Org admin sends staff invite with facility → pending row shows green "Staff" badge
- [ ]  **Invite staff (by manager):** Manager sends staff invite → facility selector scoped to manager's own facilities only
- [ ]  **Manager can't invite admin/manager:** Role selector only shows "Staff"
- [ ]  **Duplicate invite:** Try to invite same email → blocked with message
- [ ]  **Resend invite:** Resend to pending → new email sent → expiry reset
- [ ]  **Cancel invite:** Cancel pending → row removed → invite link no longer works
- [ ]  **Edit role (Admin → Manager):** Confirm dialog → role changes → member loses org settings access
- [ ]  **Edit role (Admin → Staff):** Confirm dialog → member loses config + org access
- [ ]  **Edit role (Manager → Staff):** Confirm dialog → member loses config access, keeps operations
- [ ]  **Edit role (Staff → Manager):** No confirm → member gains config access
- [ ]  **Change facility scope:** Edit manager/staff's facilities → save → member sees different facilities on next load
- [ ]  **Remove member:** Confirm → member removed → their next page load redirects to dead-end
- [ ]  **Last admin protection:** Try to remove or demote sole admin → blocked

### RBAC Enforcement — Three Roles

- [ ]  **Admin sidebar:** Sees org-level nav (Facilities, Settings, Analytics)
- [ ]  **Manager sidebar:** Sees facility config nav (Dashboard, Courts, Bookings, Calendar, Schedule, Settings)
- [ ]  **Staff sidebar:** Sees only operational nav (Bookings, Calendar, Today's Summary)
- [ ]  **Admin facilities page:** Sees all org facilities
- [ ]  **Manager facilities page:** Sees only assigned facilities, adjusted KPIs
- [ ]  **Staff:** No analytics/stats dashboard access
- [ ]  **Staff navigates to /courts:** Redirected to bookings
- [ ]  **Staff navigates to /schedule:** Redirected to bookings
- [ ]  **Staff navigates to facility settings:** Redirected to bookings
- [ ]  **Manager navigates to org settings:** Redirected to assigned facility
- [ ]  **Admin creates facility:** Works
- [ ]  **Manager creates facility:** Button hidden, API returns 403
- [ ]  **Staff creates facility:** Button hidden, API returns 403
- [ ]  **Manager edits court:** Works for assigned facility
- [ ]  **Staff edits court:** Button hidden, API returns 403
- [ ]  **Staff creates booking (walk-in):** Works ✅
- [ ]  **Staff confirms/cancels booking:** Works ✅
- [ ]  **Manager invites staff:** Works for own facilities
- [ ]  **Staff invites anyone:** No invite UI visible

### Facility Scoping

- [ ]  **Manager with 1 facility:** Sidebar shows facility directly, no switcher
- [ ]  **Staff with 1 facility:** Same behavior as manager
- [ ]  **Manager with 3 facilities:** Sidebar shows switcher with 3 options
- [ ]  **Staff with 2 facilities:** Sidebar shows switcher with 2 options
- [ ]  **Scoped user's bookings query:** Returns only bookings from assigned facilities
- [ ]  **Scoped user's courts query:** Returns only courts from assigned facilities
- [ ]  **After scope change:** User's view updates on next page load

---

## Definition of Done

- [ ]  Team table shows active members and pending invites with correct role badges (3 roles)
- [ ]  Invite flow works end-to-end for all 3 roles: modal → API → email sent → pending row
- [ ]  `facility_manager` can invite `staff` for their own facilities
- [ ]  Edit member role and facility scope works with appropriate confirmations (confirm demotions only)
- [ ]  Remove member works with last admin protection
- [ ]  Cancel and resend invite work correctly
- [ ]  `usePermission()` hook used across all dashboard components
- [ ]  `org_admin` sees full dashboard; `facility_manager` sees config + operations; `staff` sees operations only
- [ ]  Staff has clean, focused UI: bookings + calendar + today's summary
- [ ]  Facility scoping enforced identically for managers and staff
- [ ]  Direct URL access to unauthorized resources handled gracefully (redirect, not error)
- [ ]  Edge cases covered (duplicate invite, last admin, removed member session, manager inviting outside scope, etc.)
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows