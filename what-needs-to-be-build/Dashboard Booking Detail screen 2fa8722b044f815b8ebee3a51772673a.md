# Dashboard: Booking Detail screen

Estimate: M (4-8h)
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | Booking Detail |
| Platform | Web (Desktop) |
| Route | `/bookings/:id` |
| Priority | P0 - Critical |
| Screen # | 8 of 12 (Dashboard) |
| Version | v2 - 4 Players Support |

---

## 🎯 Purpose

Detailed view of an individual booking showing all 4 players (1 owner + 3 complementary players) with a visual court diagram, player management, payment details, and activity history. Owners can edit bookings, manage players, or cancel from this screen.

---

## 📐 Layout (Updated)

| Section | Description |
| --- | --- |
| Breadcrumb | Bookings > [Code] |
| Header | Title + Status + Player Count + Actions |
| Top Row | Court Visualization (3/5) + Booking Info (2/5) |
| Players Grid | 2x2 grid of player cards |
| Activity Log | Player join/leave timeline |

---

## 🏐 Court Visualization (NEW)

Visual diagram showing the padel court with all 4 player positions:

```
┌─────────────────────────────┐
│  Team A      │   Team B    │
│              │             │
│  [P1] ★      │    [P3]     │  ← Position 1,3 (Front)
│  Owner       │             │
│              │             │
│  [P2]        │    [P4]     │  ← Position 2,4 (Back)
│              │             │
└─────────────────────────────┘
```

**Player Avatar on Court:**

- Large circular avatar with initials
- White name label below
- Skill level indicator
- Owner has gold star badge (★)

**Court Styling:**

- Blue gradient background (padel court color)
- White court lines and net
- Semi-transparent team labels

---

## 👥 Players Grid (NEW - Replaces Customer Info)

2x2 grid showing all 4 player cards:

### Player Card Structure

| Element | Description |
| --- | --- |
| Avatar | Colored circle with initials |
| Name | Full name |
| Role Badge | "OWNER" badge for booking creator |
| Email | Contact email |
| Phone | Contact phone |
| Skill Level | Level badge (1-6 scale) |
| Remove Button | X icon (not available for owner) |

### Player Roles

| Role | Badge | Background | Can Remove? |
| --- | --- | --- | --- |
| Owner | Gold "OWNER" badge + star | primary-50 border | No |
| Player | None | gray-50 | Yes |

### Empty Slot Card

When fewer than 4 players:

- Dashed border
- "+" icon in center
- "Add Player" text
- Click opens player search modal

---

## 📄 Content Sections

### 1. Reservation Details

| Field | Description |
| --- | --- |
| Confirmation Code | PH-YYYY-XXXX (large, mono, primary) |
| Date | Full date (e.g., "Tue, Feb 11, 2026") |
| Time | Time range + duration |
| Court | Color-coded badge + type (Indoor/Outdoor) |
| Booked On | Timestamp of creation |

### 2. Payment Summary

| Line Item | Description |
| --- | --- |
| Court rental | Base amount (hrs × rate) |
| Service fee | Platform fee (if any) |
| **Total** | Bold, large |
| Payment status | Badge (Paid via App, Cash, etc.) |

### 3. Activity Log (Updated)

Chronological timeline now includes player events:

| Event Type | Icon | Color |
| --- | --- | --- |
| Booking created | Calendar | primary |
| Player joined | User+ | green |
| Player left | User- | red |
| Payment received | Dollar | primary |
| Booking confirmed | Check | green |
| Booking started | Play | amber |
| Booking completed | Flag | green |
| Booking cancelled | X | red |

---

## 🎨 Header Badges

### Status Badge

| Status | Style |
| --- | --- |
| Confirmed | green-100 bg, green-700 text |
| Open Match | amber-100 bg, amber-700 text |
| In Progress | blue-100 bg, blue-700 text |
| Completed | gray-100 bg, gray-600 text |
| Cancelled | red-100 bg, red-700 text |

### Player Count Badge (NEW)

| Count | Style | Label |
| --- | --- | --- |
| 4/4 | secondary-100/700 | Full |
| 3/4 | amber-100/700 | Need 1 |
| 2/4 | amber-100/700 | Need 2 |
| 1/4 | red-100/700 | Need 3 |

---

## ⚙️ Actions

| Action | Button Style | Availability |
| --- | --- | --- |
| Edit | Secondary (border) | Confirmed only |
| Cancel Booking | Danger (red border) | Confirmed, In Progress |
|   • Add Player | Text link | When < 4 players |

---

## 👤 Add Player Flow (NEW)

### Step 1: Search Modal

| Element | Description |
| --- | --- |
| Search Input | Search by name, email, phone |
| Results List | User cards with avatar, name, skill level |
| Position Select | Dropdown to assign court position (1-4) |
| Add Button | Confirm add |

### Step 2: Process

1. Validate user not already in booking
2. Check skill level compatibility (if open match)
3. Add to booking_players table
4. Send notification to new player
5. Update player count
6. Log activity

---

## ❌ Remove Player Flow (NEW)

### Confirmation Modal

| Element | Content |
| --- | --- |
| Title | "Remove Player?" |
| Warning | Player name + booking details |
| Note | "They will be notified" |
| Confirm | Red "Remove" button |

### Process

1. Remove from booking_players table
2. Send notification to removed player
3. Update player count
4. If was full, change status to "Open Match"
5. Log activity

---

## 🔗 Navigation

| Action | Destination |
| --- | --- |
| Breadcrumb "Bookings" | /bookings |
| Edit | Edit modal or inline |
| Cancel | Confirmation modal |
| Add Player | Search modal |
| Player card click | Player profile (future) |

---

## 💻 Developer Notes

### tRPC Procedures (Updated)

```tsx
// booking.router.ts
booking.getDetail.query({ bookingId: string })
// Returns: Booking with players[], court, activity[]

booking.addPlayer.mutate({
  bookingId: string,
  userId: string,
  position: 1 | 2 | 3 | 4
})

booking.removePlayer.mutate({
  bookingId: string,
  playerId: string // booking_players.id
})
// Note: Cannot remove owner

booking.getActivity.query({ bookingId: string })
// Returns: Activity events including player joins/leaves

booking.update.mutate({
  bookingId: string,
  date?: string,
  startTime?: string,
  endTime?: string,
  courtId?: string
})

booking.cancel.mutate({
  bookingId: string,
  reason?: string,
  issueRefund: boolean,
  internalNote?: string
})
```

### Drizzle Schema Reference

```tsx
// booking_players table
bookingPlayers: {
  id: uuid,
  bookingId: uuid,
  userId: uuid,
  role: enum('owner', 'player'),
  position: integer, // 1-4 (court positions)
  joinedAt: timestamp
}
// UNIQUE(bookingId, userId)
// MAX 4 players per booking
// CHECK: position BETWEEN 1 AND 4

// booking_activity table (updated)
bookingActivity: {
  id: uuid,
  bookingId: uuid,
  type: enum('created','payment','confirmed','player_joined','player_left','started','completed','cancelled','modified'),
  description: text,
  metadata: jsonb, // { userId, playerName, position, etc. }
  createdAt: timestamp
}
```

### Player Position Mapping

| Position | Location | Team |
| --- | --- | --- |
| 1 | Front Left | A |
| 2 | Back Left | A |
| 3 | Front Right | B |
| 4 | Back Right | B |

---

## 🖼️ Wireframe

See: `08-web-booking-detail.html`

---

**Last Updated:** February 11, 2026

**Version:** 2.0 (4 Players Support)