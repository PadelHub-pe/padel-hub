# Dashboard: Organization Settings screen

Estimate: L (1-2d)
Notes: Org Admin only - manage organization, team, facilities
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | Organization Settings |
| Platform | Web (Desktop) |
| Route | `/org/settings` |
| Access | Org Admin only |
| Priority | P0 - Critical |
| Screen # | 10 of 12 (Dashboard) |
| Version | v1 |

---

## 🎯 Purpose

Central hub for Org Admins to manage organization-wide settings, team members, facilities, and billing (feature flagged). This screen is NOT accessible to Facility Managers.

---

## 📑 Tab Structure

| Tab | Content | Status |
| --- | --- | --- |
| Organization | Org profile, logo, contact info | Active |
| Team & Roles | Member management, invites | Active |
| Facilities | Overview of all facilities | Active |
| Billing | Subscription management | Feature flagged |

---

## 📄 Tab 1: Organization Profile

### Logo Upload

| Property | Value |
| --- | --- |
| Size | 80×80px display |
| Formats | PNG, JPG |
| Max Size | 2MB |
| Fallback | Initials on gray-800 bg |

### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Organization Name | text | Yes | 2-100 chars |
| Description | textarea | No | Max 500 chars |
| Contact Email | email | Yes | Valid format |
| Phone | tel | No | E.164 format |

---

## 📄 Tab 2: Team & Roles

### Role Definitions

| Role | Badge Color | Access |
| --- | --- | --- |
| Org Admin | red-100/red-700 | Full org access, all facilities |
| Facility Manager | blue-100/blue-700 | Assigned facilities only |

### Team Table Columns

| Column | Content |
| --- | --- |
| Member | Avatar + name + email |
| Role | Role badge |
| Facilities | Facility pills (or "All facilities") |
| Status | Active (green) / Pending (amber) |
| Actions | Edit / Resend (for pending) |

### Member States

| State | Style |
| --- | --- |
| Current User | primary-50/30 bg row, "You" label |
| Active Member | Normal row |
| Pending Invite | 60% opacity, email icon avatar |

### Invite Member Modal

| Field | Type | Required |
| --- | --- | --- |
| Email | email | Yes |
| Role | select | Yes |
| Facilities | multi-select | Yes (if Facility Manager) |

---

## 📄 Tab 3: Facilities

### Facility Card Grid

| Element | Content |
| --- | --- |
| Avatar | Gradient bg with initial |
| Status | Active (green dot) / Inactive |
| Name | Facility name |
| Location | District, City |
| Stats | Court count, manager count |

### Card Interactions

| Action | Result |
| --- | --- |
| Click card | Navigate to `/f/[slug]/dashboard` |
| Add Facility | Opens creation flow |

---

## 📄 Tab 4: Billing (Feature Flagged)

### When `billing_enabled: false`

| Element | Style |
| --- | --- |
| Container | gray-50 bg, dashed border |
| Icon | Credit card, gray-400 |
| Title | "Billing & Subscription" |
| Badge | amber "Coming Soon" |
| Message | "You're currently on the free beta..." |
| Button | "Free Beta" (disabled style) |

### When `billing_enabled: true` (Future)

- Current plan card
- Usage metrics
- Payment method
- Invoice history
- Upgrade/downgrade options

---

## 🎨 Component States

### Tab Navigation

| State | Style |
| --- | --- |
| Active | primary-600 text, primary-500 border-b-2 |
| Inactive | gray-500 text, hover:gray-700 |
| Disabled | gray-400 text, cursor-not-allowed |

### Action Buttons

| Button | Style |
| --- | --- |
| Save Changes | primary-500 bg, white text |
| Invite Member | primary-500 bg + plus icon |
| Add Facility | primary-500 bg + plus icon |
| Edit | primary-600 text link |
| Resend | gray-500 text link |

---

## 🔐 Access Control

```tsx
// Middleware check
if (user.role !== 'org_admin') {
  redirect('/f/[defaultFacility]/dashboard');
}
```

| Role | Can Access |
| --- | --- |
| Org Admin | ✅ Full access |
| Facility Manager | ❌ Redirect to facility dashboard |

---

## 💻 Developer Notes

### tRPC Procedures

```tsx
// organization.router.ts
organization.get.query()
// Returns: Current org profile

organization.update.mutate({
  name?: string,
  description?: string,
  contactEmail?: string,
  phone?: string,
})

organization.uploadLogo.mutate({ file: File })
// Returns: New logo URL

// team.router.ts
team.list.query()
// Returns: All org members with roles/facilities

team.invite.mutate({
  email: string,
  role: 'org_admin' | 'facility_manager',
  facilityIds?: string[]
})

team.updateMember.mutate({
  memberId: string,
  role?: string,
  facilityIds?: string[]
})

team.removeMember.mutate({ memberId: string })

team.resendInvite.mutate({ inviteId: string })

// facility.router.ts
facility.listAll.query()
// Returns: All org facilities with stats
```

### Drizzle Schema Reference

```tsx
organizations: {
  id: uuid,
  name: varchar(100),
  description: text,
  logoUrl: text,
  contactEmail: varchar(255),
  phone: varchar(20),
  billingEnabled: boolean, // feature flag
  createdAt: timestamp,
  updatedAt: timestamp
}

organizationMembers: {
  id: uuid,
  organizationId: uuid,
  userId: uuid,
  role: enum('org_admin', 'facility_manager'),
  createdAt: timestamp
}

facilityAssignments: {
  id: uuid,
  memberId: uuid,
  facilityId: uuid
}

organizationInvites: {
  id: uuid,
  organizationId: uuid,
  email: varchar(255),
  role: enum('org_admin', 'facility_manager'),
  facilityIds: json, // array of facility IDs
  token: varchar(64),
  expiresAt: timestamp,
  acceptedAt: timestamp
}
```

### Feature Flag Check

```tsx
const { data: org } = trpc.organization.get.useQuery();
const billingEnabled = org?.billingEnabled ?? false;

// In tabs
<Tab disabled={!billingEnabled}>
  Billing
  {!billingEnabled && <Badge>SOON</Badge>}
</Tab>
```

---

## 🔗 Navigation

| Action | Destination |
| --- | --- |
| Save Changes | API call → Toast → Stay |
| Invite Member | Opens modal |
| Edit Member | Opens edit modal |
| Add Facility | `/org/facilities/new` |
| Click Facility Card | `/f/[slug]/dashboard` |
| Back (sidebar) | Previous facility context |

---

## 🖼️ Wireframe

File: `10-web-org-settings.html`

---

**Last Updated:** February 16, 2026