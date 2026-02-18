# Dashboard: Facility Settings screen

Estimate: L (1-2d)
Notes: Personal profile + facility config for current facility
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | Facility Settings |
| Platform | Web (Desktop) |
| Route | `/f/[slug]/settings` |
| Access | Facility Manager + Org Admin |
| Priority | P0 - Critical |
| Screen # | 11 of 12 (Dashboard) |
| Version | v1 |

---

## 🎯 Purpose

Combined screen for managing personal profile and current facility configuration. Available to both Facility Managers (for their assigned facilities) and Org Admins (for any facility).

---

## 📑 Tab Structure

| Tab | Content | Editable |
| --- | --- | --- |
| My Profile | Personal info, avatar | ✅ |
| Facility Info | Current facility details | ✅ |
| Notifications | Email/push preferences | ✅ |
| Security | Password, 2FA, sessions | ✅ |

---

## 📄 Tab 1: My Profile

### Avatar Upload

| Property | Value |
| --- | --- |
| Size | 96×96px display |
| Shape | Circle |
| Formats | PNG, JPG |
| Max Size | 2MB |
| Fallback | Initials on primary-500 bg |

### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| First Name | text | Yes | 1-50 chars |
| Last Name | text | Yes | 1-50 chars |
| Email | email | Yes | Valid format |
| Phone | tel | No | E.164 format |

### Read-Only Access Section

Displays user's role and assignments (not editable here):

| Field | Display |
| --- | --- |
| Organization | Org logo + name |
| Role | Role badge (Org Admin / Facility Manager) |
| Assigned Facilities | Facility pills |
| Help Text | "Contact your Org Admin to change..." |

---

## 📄 Tab 2: Facility Info

### Header

| Element | Content |
| --- | --- |
| Avatar | Facility gradient avatar |
| Name | Facility name |
| Label | "Current facility" |
| Badge | "Editing" (primary-100/700) |

### Editable Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Facility Name | text | Yes | 2-100 chars |
| Contact Phone | tel | No | E.164 format |
| Address | text | Yes | 10-200 chars |
| Description | textarea | No | Max 500 chars |

### Read-Only Fields

| Field | Display | Edit Location |
| --- | --- | --- |
| Courts | "4 courts" | Courts screen |
| Type | "Indoor" / "Outdoor" | Courts screen |
| Status | Active/Inactive badge | Org Settings |

### Quick Links

| Link | Destination |
| --- | --- |
| Operating Hours → | `/f/[slug]/schedule` |
| Pricing → | `/f/[slug]/pricing` |
| Courts → | `/f/[slug]/courts` |

---

## 📄 Tab 3: Notifications

### Preference Toggles

| Setting | Channels | Default |
| --- | --- | --- |
| New Bookings | Email ✅, Push ✅ | Both ON |
| Cancellations | Email ✅, Push ☐ | Email ON |
| Daily Summary | Email ✅, Push ☐ | Email ON |
| Low Occupancy Alerts | Email ☐, Push ☐ | Both OFF |

### Toggle Row Layout

```
[Setting Name]                    [Email ☐] [Push ☐]
[Description text in gray-500]
─────────────────────────────────────────────────────
```

---

## 📄 Tab 4: Security

### Security Cards

| Card | Content | Action |
| --- | --- | --- |
| Password | "Last changed X days ago" | Change Password button |
| Two-Factor Auth | "Add extra layer of security" | Enable 2FA button |
| Active Sessions | "X devices currently logged in" | Manage Sessions button |

### Card Layout

| Element | Style |
| --- | --- |
| Container | p-4, bg-gray-50, rounded-lg |
| Title | font-medium, gray-900 |
| Description | text-sm, gray-500 |
| Primary Action | primary-500 bg button |
| Secondary Action | white bg, gray-200 border |

---

## 🎨 Component States

### Tab Navigation

| State | Style |
| --- | --- |
| Active | primary-600 text, primary-500 border-b-2 |
| Inactive | gray-500 text, hover:gray-700 |

### Checkbox Toggles

| State | Style |
| --- | --- |
| Unchecked | gray-300 border, white bg |
| Checked | primary-500 bg, white checkmark |
| Focus | primary-500 ring |

### Form Inputs

| State | Style |
| --- | --- |
| Default | gray-200 border |
| Focus | primary-500 border, primary-100 ring |
| Disabled | gray-50 bg, gray-200 border |
| Error | red-500 border, red-100 ring |

---

## 🔐 Access Control

```tsx
// Both roles can access, but with different facility visibility
const userFacilities = user.role === 'org_admin' 
  ? allOrgFacilities 
  : user.assignedFacilities;

// Check if user can access current facility
if (!userFacilities.includes(currentFacilityId)) {
  redirect('/f/[defaultFacility]/dashboard');
}
```

| Role | Access |
| --- | --- |
| Org Admin | Any facility in org |
| Facility Manager | Only assigned facilities |

---

## 💻 Developer Notes

### tRPC Procedures

```tsx
// account.router.ts
account.getProfile.query()
account.updateProfile.mutate({
  firstName?: string,
  lastName?: string,
  email?: string,
  phone?: string
})
account.uploadAvatar.mutate({ file: File })

account.getAccess.query()
// Returns: { organization, role, assignedFacilities }

// facility.router.ts
facility.get.query({ id: string })
facility.update.mutate({
  id: string,
  name?: string,
  phone?: string,
  address?: string,
  description?: string
})

// notifications.router.ts
notifications.getPreferences.query()
notifications.updatePreferences.mutate({
  newBookings?: { email: boolean, push: boolean },
  cancellations?: { email: boolean, push: boolean },
  dailySummary?: { email: boolean, push: boolean },
  lowOccupancy?: { email: boolean, push: boolean }
})

// security.router.ts
security.changePassword.mutate({
  currentPassword: string,
  newPassword: string
})
security.enable2FA.mutate()
security.getSessions.query()
security.revokeSession.mutate({ sessionId: string })
```

### Drizzle Schema Reference

```tsx
users: {
  id: uuid,
  firstName: varchar(50),
  lastName: varchar(50),
  email: varchar(255),
  phone: varchar(20),
  avatarUrl: text,
  createdAt: timestamp,
  updatedAt: timestamp
}

notificationPreferences: {
  id: uuid,
  userId: uuid,
  facilityId: uuid, // per-facility preferences
  newBookingsEmail: boolean,
  newBookingsPush: boolean,
  cancellationsEmail: boolean,
  cancellationsPush: boolean,
  dailySummaryEmail: boolean,
  dailySummaryPush: boolean,
  lowOccupancyEmail: boolean,
  lowOccupancyPush: boolean
}

facilities: {
  id: uuid,
  organizationId: uuid,
  name: varchar(100),
  slug: varchar(100),
  phone: varchar(20),
  address: text,
  description: text,
  type: enum('indoor', 'outdoor', 'mixed'),
  status: enum('active', 'inactive'),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔗 Navigation

| Action | Destination |
| --- | --- |
| Save Changes | API call → Toast → Stay |
| Change Password | Opens modal |
| Enable 2FA | Opens setup modal |
| Manage Sessions | Opens sessions modal |
| Quick Links | Navigate to respective screen |

---

## 🖼️ Wireframe

File: `11-web-facility-settings.html`

---

**Last Updated:** February 16, 2026