# Flow 3: Team & Roles (RBAC) - Technical Plan

## 1. Context: What Already Exists

Significant infrastructure is already built. The gap is smaller than the spec suggests.

### Backend (Mostly Complete)

| Component | Status | Location |
|-----------|--------|----------|
| RBAC permission matrix (3 roles, 12 permissions) | Done | `packages/api/src/lib/access-control.ts` |
| `verifyFacilityAccess()` + helpers | Done (48 tests) | `packages/api/src/lib/access-control.ts` |
| DB schema (`organization_members`, `organization_invites`) | Done | `packages/db/src/schema.ts` |
| `org.getTeamMembers` | Done | `packages/api/src/router/org.ts:592` |
| `org.inviteMember` | Done | `packages/api/src/router/org.ts:664` |
| `org.updateMember` | Done | `packages/api/src/router/org.ts:747` |
| `org.removeMember` | Done | `packages/api/src/router/org.ts:792` |
| `org.cancelInvite` / `org.resendInvite` | Done | `packages/api/src/router/org.ts:839,880` |
| `invite.validate` / `invite.accept` | Done (31 tests) | `packages/api/src/router/invite.ts` |
| `sendOrganizationInvite()` email | Done | `packages/email/` |

### Frontend (Partially Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Settings page with tabs (Org, Team, Facilities, Billing) | Done | `settings/_components/settings-view.tsx` |
| TeamTab with DataTable | Done | `settings/_components/team-tab.tsx` |
| team-columns (member/invite rows, role badges, actions) | Done | `settings/_components/team-columns.tsx` |
| InviteMemberDialog (email, role, facility checkboxes) | Done | `settings/_components/invite-member-dialog.tsx` |
| EditMemberDialog (role + facility change) | Done | `settings/_components/edit-member-dialog.tsx` |
| RemoveMemberDialog (member + invite cancel) | Done | `settings/_components/remove-member-dialog.tsx` |
| OrgSidebar with org switcher | Done | `org/_components/org-sidebar.tsx` |
| FacilitySidebar with facility switcher | Done | `facilities/[facilityId]/_components/facility-sidebar.tsx` |
| Org settings page access guard (org_admin only) | Done | `settings/page.tsx:27` |
| FacilitySidebar receives `userRole` prop | Done | `facilities/[facilityId]/layout.tsx:62` |
| `getFacilities` filters by `facilityIds` for scoped users | Done | `packages/api/src/router/org.ts:170-177` |

### What Does NOT Exist Yet (The Actual Gaps)

| Gap | Sub-flow | Impact |
|-----|----------|--------|
| **Last admin protection** | 3.6 | API allows demoting/removing sole admin (dangerous) |
| **`usePermission()` hook** | 3.7 | No centralized client-side permission checks |
| **Role-based sidebar filtering** | 3.7 | Both sidebars show all nav items regardless of role |
| **Route-level guards for facility views** | 3.7, 3.8 | Staff can navigate to config routes (courts, schedule, settings) |
| **Facility_manager invite scoping** | 3.2 | Managers can't invite staff (hardcoded org_admin-only) |
| **Demotion confirmation dialogs** | 3.3 | Admin->Manager, Admin->Staff, Manager->Staff have no confirmation |
| **Staff badge color** | 3.1 | Uses gray instead of green per spec |
| **Team table polish** | 3.1 | Missing member count, empty state, current user highlight, sorting |
| **Expired invite status** | 3.5 | No "Expirada" status display |

## 2. Architecture Decisions

### Role Context via `getMyOrganizations`

The role is already loaded in layouts via `getMyOrganizations()` which returns `{ id, name, slug, logoUrl, role }` per org. The `role` field is available:
- In `[orgSlug]/layout.tsx` (finds `currentOrg` with role)
- In `(org-view)/layout.tsx` (passes `organizations` to OrgSidebar)
- In `(facility-view)/layout.tsx` (passes `userRole={currentOrg.role}` to FacilitySidebar)

**Decision:** Pass `userRole` through to sidebar nav components. No new context provider needed since layouts already have the data and pass it as props.

### `usePermission()` hook

**Decision:** Create a simple hook that takes a role and returns boolean flags. No context needed - components already receive role via props or can read it from existing data. The hook is a pure function that maps role -> capabilities.

```typescript
// apps/nextjs/src/hooks/use-permission.ts
export function usePermission(role: OrgRole) {
  return {
    canManageOrg: role === "org_admin",
    canConfigureFacility: role === "org_admin" || role === "facility_manager",
    canInviteStaff: role === "org_admin" || role === "facility_manager",
    canManageBookings: true,
    // ...
  };
}
```

### Sidebar Filtering

**Decision:** Pass `userRole` to nav components, filter `getNavSections()` based on role.

- `OrgSidebarNav`: Already receives `organizations` which has `role`. Need to pass current org's role.
- `FacilitySidebarNav`: Already receives nothing but can receive `userRole` from parent `FacilitySidebar` which already has it.

### Route Guards

**Decision:** Add guards in existing server-component layouts and pages. No middleware needed.

- `(facility-view)/layout.tsx`: Already checks facility access. Add redirect if staff accesses config routes.
- Alternative: Guard in individual page.tsx files (simpler, more explicit).

### Last Admin Protection

**Decision:** Add `validateNotLastAdmin()` helper in `org.ts` router. Called before `updateMember` (when demoting from admin) and `removeMember` (when target is admin). Pure DB check.

### Facility Manager Invite Capability

**Decision:** Modify `inviteMember` procedure to allow `facility_manager` to invite `staff` for their own facilities. Currently hardcoded to `org_admin` only. Need to:
1. Allow `facility_manager` callers
2. Restrict their role options to `staff` only
3. Validate facilityIds are subset of manager's own facilityIds

## 3. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Last admin removal (currently possible!) | HIGH | Task 1 - add API validation immediately |
| Staff accessing config routes via URL | MEDIUM | Route guards redirect gracefully |
| Manager inviting outside their scope | LOW | API validation (new) + UI scoping |
| Breaking existing team management UI | LOW | Changes are additive (new props, new conditions) |
| Hydration mismatch from role-based rendering | LOW | Role loaded server-side, passed as prop |

No schema migrations needed. No new tables. No breaking API changes.

## 4. Task Breakdown

See `docs/TASKS.md` for ordered implementation tasks.
