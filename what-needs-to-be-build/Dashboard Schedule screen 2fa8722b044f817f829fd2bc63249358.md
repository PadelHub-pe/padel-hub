# Dashboard: Schedule screen

Estimate: L (1-2d)
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | Schedule & Availability |
| Platform | Web (Desktop) |
| Route | `/schedule` |
| Priority | P0 - Critical |
| Screen # | 6 of 10 (Dashboard) |

---

## 🎯 Purpose

Central hub for managing facility operating hours, defining peak pricing periods, and visualizing daily court availability. Owners can block time slots for maintenance or private events.

---

## 📐 Layout

| Section | Description |
| --- | --- |
| Header | Title + Block Time button + Save |
| Operating Hours | Day-by-day schedule config |
| Peak Hours | Time period definitions |
| Daily Overview | Visual grid of all courts |

---

## 📄 Form Sections

### 1. Operating Hours

| Field | Type | Description |
| --- | --- | --- |
| Day | label | Mon-Sun |
| Open Time | time select | 15-min increments |
| Close Time | time select | 15-min increments |
| Is Open | checkbox | Toggle day on/off |

### 2. Peak Hours

| Field | Type | Required |
| --- | --- | --- |
| Name | text | Yes |
| Days | multi-select | Yes |
| Start Time | time | Yes |
| End Time | time | Yes |
| Markup % | number | Yes (default 25%) |

---

## 📅 Daily Grid

### Time Slot States

| State | Color | Description |
| --- | --- | --- |
| Available | green-200 | Open for booking |
| Booked | blue-200 | Has reservation |
| Blocked | red-200 | Manually blocked |
| Peak | amber border | Peak pricing applies |

### Grid Structure

- Rows: Courts (Court 1, Court 2, etc.)
- Columns: Hours (operating hours only)
- Cell size: 1 hour increments
- Peak indicator: Amber border on cell

---

## 🚫 Block Time Modal

| Field | Type | Required |
| --- | --- | --- |
| Court(s) | multi-select | Yes |
| Date | date picker | Yes |
| Start Time | time | Yes |
| End Time | time | Yes |
| Reason | select | No |
| Notes | textarea | No |

### Block Reasons

- Maintenance
- Private Event
- Tournament
- Staff Training
- Other

---

## 🎨 Component States

### Day Row

| State | Style |
| --- | --- |
| Open | Normal, inputs enabled |
| Closed | Muted, inputs disabled |

### Peak Period Card

| Element | Style |
| --- | --- |
| Container | amber-50 bg, amber-200 border |
| Icon | ⚡ emoji in amber-100 circle |
| Markup badge | amber-100 bg, amber-700 text |

---

## 🔗 Navigation

| Action | Destination |
| --- | --- |
| Block Time | Opens modal |
| Save Changes | API call → Toast |
| Grid cell click | Block time modal (pre-filled) |
| Edit peak period | Inline edit or modal |

---

## 💻 Developer Notes

### tRPC Procedures

```tsx
// schedule.router.ts
schedule.getOperatingHours.query({ facilityId })
// Returns: Array of day configs

schedule.updateOperatingHours.mutate({
  facilityId: string,
  hours: Array<{
    dayOfWeek: 0-6,
    openTime: string, // "07:00"
    closeTime: string, // "22:00"
    isOpen: boolean
  }>
})

schedule.getPeakPeriods.query({ facilityId })

schedule.createPeakPeriod.mutate({
  facilityId: string,
  name: string,
  days: number[], // [1,2,3,4,5] for Mon-Fri
  startTime: string,
  endTime: string,
  markupPercent: number
})

schedule.deletePeakPeriod.mutate({ periodId })

schedule.blockTimeSlot.mutate({
  facilityId: string,
  courtIds: string[],
  date: string,
  startTime: string,
  endTime: string,
  reason?: string,
  notes?: string
})

schedule.getDayOverview.query({
  facilityId: string,
  date: string
})
// Returns: Grid data with bookings + blocks
```

### Drizzle Schema Reference

```tsx
operatingHours: {
  id: uuid,
  facilityId: uuid,
  dayOfWeek: int, // 0=Sun, 6=Sat
  openTime: time,
  closeTime: time,
  isOpen: boolean
}

peakPeriods: {
  id: uuid,
  facilityId: uuid,
  name: varchar(100),
  days: int[], // array of day numbers
  startTime: time,
  endTime: time,
  markupPercent: decimal(5,2)
}

blockedSlots: {
  id: uuid,
  facilityId: uuid,
  courtId: uuid,
  date: date,
  startTime: time,
  endTime: time,
  reason: varchar(50),
  notes: text
}
```

---

## 🖼️ Wireframe

`06-web-schedule.html`

---

**Last Updated:** February 1, 2026