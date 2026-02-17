# Component: Facility Switcher

Estimate: M (4-8h)
Notes: Sidebar component for switching between facilities
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 🧩 Component Overview

| Property | Value |
| --- | --- |
| Component Name | Facility Switcher |
| Location | Sidebar header |
| Type | Dropdown / Popover |
| Priority | P0 - Critical |

---

## 🎯 Purpose

Allows users to switch between facilities they have access to. Displays current facility context and provides quick access to organization or facility settings based on user role.

---

## 📐 Anatomy

### Switcher Button (Collapsed)

| Element | Description |
| --- | --- |
| Facility Avatar | 32×32px gradient square with initial |
| Facility Name | Truncated if long |
| Location | District, City |
| Chevron | Up/down icon indicating expandable |

### Dropdown (Expanded)

| Section | Content |
| --- | --- |
| Org Header | Org logo + name + beta badge |
| Facility List | "Your Facilities" label + facility buttons |
| Actions | Role-based links (Org Settings, Add Facility, etc.) |

---

## 👥 Role-Based Visibility

| Element | Org Admin | Facility Manager |
| --- | --- | --- |
| All org facilities | ✅ | ❌ |
| Assigned facilities only | ✅ | ✅ |
| Organization Settings | ✅ | ❌ |
| Add Facility | ✅ | ❌ |
| Facility Settings | ✅ | ✅ |

---

## 🎨 States

### Collapsed (Default)

| State | Style |
| --- | --- |
| Default | gray-200 border, white bg |
| Hover | gray-50 bg |
| Active | primary-300 border, primary-100 ring |

### Facility List Item

| State | Style |
| --- | --- |
| Default | hover:bg-gray-50 |
| Current | primary-50 bg, primary-200 border, checkmark |

---

## 🔗 URL Structure

```
/org/settings          → Organization Settings
/f/[slug]/dashboard    → Facility Dashboard
/f/[slug]/bookings     → Facility Bookings
/f/[slug]/settings     → Facility Settings
```

---

## 💻 Developer Notes

### Component Props

```tsx
interface FacilitySwitcherProps {
  currentFacility: Facility;
  organization: Organization;
  userRole: 'org_admin' | 'facility_manager';
  assignedFacilities: Facility[];
  onFacilityChange: (facilityId: string) => void;
}
```

### tRPC Procedures

```tsx
facility.listUserFacilities.query()
// Returns facilities based on user role:
// - Org Admin: All org facilities
// - Facility Manager: Only assigned facilities

organization.getCurrent.query()
// Returns current org with logo, name, beta status
```

### State Management

```tsx
// Store current facility in URL param or context
const { facilitySlug } = useParams();
const { data: facility } = trpc.facility.getBySlug.useQuery({ slug: facilitySlug });

// On facility change, navigate to new facility context
const handleFacilityChange = (slug: string) => {
  router.push(`/f/${slug}/dashboard`);
};
```

---

## 🖼️ Wireframe

See: `components/facility-switcher.html`

---

**Last Updated:** February 16, 2026