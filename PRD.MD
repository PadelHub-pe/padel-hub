# PadelHub MVP — “Book & Play”

**Version:** 2.0

**Last Updated:** January 29, 2026

**Author:** Luis

**Status:** Draft

---

## Table of Contents

1. [Executive Summary](https://www.notion.so/PRD-Product-Requirements-2f88722b044f80c79c5ddf1a57769eea?pvs=21)
2. [Problem Statement](about:blank#2-problem-statement)
3. [Goals & Success Metrics](about:blank#3-goals--success-metrics)
4. [Target Users](about:blank#4-target-users)
5. [Product Scope](about:blank#5-product-scope)
6. [Functional Requirements](about:blank#6-functional-requirements)
7. [User Flows](about:blank#7-user-flows)
8. [Data Models](about:blank#8-data-models)
9. [Technical Architecture](about:blank#9-technical-architecture)
10. [Non-Functional Requirements](about:blank#10-non-functional-requirements)
11. [Timeline & Milestones](about:blank#11-timeline--milestones)
12. [Risks & Mitigations](about:blank#12-risks--mitigations)
13. [Future Considerations](about:blank#13-future-considerations)

---

## 1. Executive Summary

**PadelHub** is a two-sided platform connecting padel players with court facilities in Lima, Peru. The MVP focuses on validating two core hypotheses: (1) players want a centralized platform to discover courts and find playing partners, and (2) court owners will adopt third-party booking software.

The MVP delivers a mobile app for players (iOS/Android) and a web dashboard for court owners, enabling court discovery, slot booking, and open match coordination.

**Target Launch:** 6-8 weeks from development start

**Initial Market:** Lima, Peru (5-10 onboarded courts)

**Monetization (Post-MVP):** SaaS subscriptions for court owners, booking fees

---

## 2. Problem Statement

### For Players

- **Fragmented discovery:** No single place to find all available courts; relies on word-of-mouth or individual court websites/social media
- **Coordination friction:** Organizing a match requires manual outreach via WhatsApp groups to find 3 other players
- **No visibility into availability:** Must call or message each court individually to check open slots

### For Court Owners

- **Manual booking management:** Many courts use paper calendars, WhatsApp, or basic spreadsheets
- **No-shows and inefficiency:** Lack of structured booking leads to lost revenue
- **Limited reach:** Depend on existing customer base; hard to attract new players

### Opportunity

A centralized platform creates network effects: more courts attract more players, more players attract more courts. The “open match” feature adds social/discovery value that individual court apps cannot provide.

---

## 3. Goals & Success Metrics

### MVP Goals

| Goal                    | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| Validate player demand  | Prove players will use a centralized platform over direct booking |
| Validate court adoption | Prove court owners will onboard and actively use the dashboard    |
| Test open match feature | Determine if social matchmaking drives engagement                 |
| Establish foundation    | Build scalable architecture for post-MVP features                 |

### Success Metrics (8 weeks post-launch)

| Metric                | Target       | Measurement                       |
| --------------------- | ------------ | --------------------------------- |
| Courts onboarded      | 5-10         | Count of active court profiles    |
| Weekly active players | 200+         | Unique users with app activity    |
| Bookings per week     | 50+          | Completed reservations            |
| Open matches created  | 20+ per week | Matches posted seeking players    |
| Open match fill rate  | >50%         | Matches that reach 4 players      |
| Court owner retention | 80%          | Courts still active after 4 weeks |
| Player retention (D7) | 30%          | Users returning within 7 days     |

---

## 4. Target Users

### Persona 1: The Recreational Player (“Carlos”)

**Demographics:** 25-40 years old, professional, lives in Miraflores/San Isidro

**Padel frequency:** 1-2 times per week

**Current behavior:** Books courts through WhatsApp, plays with same group of friends

**Pain points:**

- Hard to find a court when usual one is full
- Difficult to organize a game when regular partners are unavailable
- No way to discover new courts or players

**Goals:**

- Book courts quickly without phone calls
- Find players when his group can’t make it
- Discover new courts in his area

### Persona 2: The Aspiring Competitor (“María”)

**Demographics:** 22-35 years old, athletic, category 3-4 player

**Padel frequency:** 3-4 times per week

**Current behavior:** Active in multiple WhatsApp groups, attends local tournaments

**Pain points:**

- Wants to play with similarly skilled players
- Spends too much time coordinating matches
- Misses tournament opportunities due to lack of visibility

**Goals:**

- Find competitive matches at her skill level
- Track her match history and progress
- Discover tournaments (future feature)

### Persona 3: The Court Manager (“Roberto”)

**Demographics:** 30-50 years old, owns or manages 2-6 courts

**Current tools:** WhatsApp, Excel, paper calendar

**Pain points:**

- Double bookings and scheduling conflicts
- No-shows with no accountability
- Difficulty filling off-peak hours
- No data on court utilization

**Goals:**

- Reduce administrative overhead
- Fill more time slots, especially off-peak
- Attract new customers
- Understand booking patterns

---

## 5. Product Scope

### 5.1 In Scope (MVP)

**Player App (iOS + Android)**

- User authentication (email, Google, Apple)
- Player profile with skill category
- Court discovery (list and map view)
- Court detail pages
- Slot booking
- Open match creation and browsing
- Booking management (upcoming/past)
- Push notifications

**Court Owner Dashboard (Web)**

- Multi-organization support (owners can manage multiple facilities under one organization)
- Court owner registration and onboarding
- Court profile management
- Court/slot configuration
- Booking calendar view
- Reservation management (view, confirm, reject)
- Basic analytics

### 5.2 Out of Scope (MVP)

| Feature             | Reason                                              | Target Phase |
| ------------------- | --------------------------------------------------- | ------------ |
| Tournaments         | Complex; validate basic booking first               | Phase 2      |
| In-app payments     | Adds friction and compliance; validate demand first | Phase 3      |
| Memberships         | Court-specific complexity                           | Phase 3      |
| In-app chat         | Can use WhatsApp initially                          | Phase 1      |
| Match history/stats | Not critical for booking validation                 | Phase 1      |
| Ratings/reviews     | Need booking volume first                           | Phase 1      |
| Dynamic pricing     | Requires booking data                               | Phase 3      |
| Multi-language      | Lima-focused MVP                                    | Phase 4      |

---

## 6. Functional Requirements

### 6.1 Player App (B2C)

### 6.1.1 Authentication

| ID      | Requirement                               | Priority |
| ------- | ----------------------------------------- | -------- |
| AUTH-01 | User can sign up with email and password  | P0       |
| AUTH-02 | User can sign up/login with Google OAuth  | P0       |
| AUTH-03 | User can sign up/login with Apple Sign-In | P0       |
| AUTH-04 | User can reset password via email         | P0       |
| AUTH-05 | User can log out                          | P0       |
| AUTH-06 | Session persists across app restarts      | P0       |

### 6.1.2 Player Profile

| ID      | Requirement                                                  | Priority |
| ------- | ------------------------------------------------------------ | -------- |
| PROF-01 | User can set display name                                    | P0       |
| PROF-02 | User can upload profile photo                                | P1       |
| PROF-03 | User can select skill category (6-1 scale)                   | P0       |
| PROF-04 | User can add phone number (optional, for match coordination) | P1       |
| PROF-05 | User can set preferred playing times (optional)              | P2       |
| PROF-06 | User can view their own profile                              | P0       |
| PROF-07 | User can edit profile information                            | P0       |

**Skill Categories (Standard Padel Scale):**

- Category 6: Beginner (learning basic rules and strokes)
- Category 5: Beginner-Intermediate (consistent rallies, basic positioning)
- Category 4: Intermediate (volleys, basic tactics, serves)
- Category 3: Intermediate-Advanced (consistent winners, strategic play)
- Category 2: Advanced (tournament-level, all shots mastered)
- Category 1: Professional/Elite (competitive circuit players)

### 6.1.3 Court Discovery

| ID      | Requirement                                        | Priority |
| ------- | -------------------------------------------------- | -------- |
| DISC-01 | User can view list of courts                       | P0       |
| DISC-02 | User can view courts on a map                      | P0       |
| DISC-03 | User can filter courts by district/location        | P0       |
| DISC-04 | User can filter courts by availability (date)      | P1       |
| DISC-05 | User can search courts by name                     | P1       |
| DISC-06 | User can see distance from current location        | P1       |
| DISC-07 | Courts display: name, photo, district, court count | P0       |
| DISC-08 | User can tap court to view details                 | P0       |

### 6.1.4 Court Detail

| ID      | Requirement                                          | Priority |
| ------- | ---------------------------------------------------- | -------- |
| CDET-01 | Display court name and description                   | P0       |
| CDET-02 | Display court photos (gallery)                       | P0       |
| CDET-03 | Display location with map and address                | P0       |
| CDET-04 | Display amenities (parking, showers, pro shop, etc.) | P1       |
| CDET-05 | Display available time slots for selected date       | P0       |
| CDET-06 | Display price per slot (informational)               | P0       |
| CDET-07 | User can navigate to court via external maps app     | P1       |
| CDET-08 | User can call court directly                         | P1       |
| CDET-09 | Display open matches at this court                   | P0       |

### 6.1.5 Booking

| ID      | Requirement                                                | Priority |
| ------- | ---------------------------------------------------------- | -------- |
| BOOK-01 | User can select a date to view availability                | P0       |
| BOOK-02 | User can select an available time slot                     | P0       |
| BOOK-03 | User can see slot duration and price                       | P0       |
| BOOK-04 | User can confirm booking (no payment in MVP)               | P0       |
| BOOK-05 | User receives confirmation screen after booking            | P0       |
| BOOK-06 | User receives push notification on booking confirmation    | P0       |
| BOOK-07 | User can cancel booking (with cancellation policy display) | P1       |
| BOOK-08 | User cannot double-book same time slot                     | P0       |

### 6.1.6 Open Matches

| ID      | Requirement                                                                | Priority |
| ------- | -------------------------------------------------------------------------- | -------- |
| OPEN-01 | User can create an open match attached to their booking                    | P0       |
| OPEN-02 | Open match includes: skill level preference, spots needed (1-3)            | P0       |
| OPEN-03 | Open match can include optional note/description                           | P1       |
| OPEN-04 | User can browse all open matches (list view)                               | P0       |
| OPEN-05 | Open matches display: court, date/time, host, skill level, spots available | P0       |
| OPEN-06 | User can filter open matches by date                                       | P1       |
| OPEN-07 | User can filter open matches by skill level                                | P1       |
| OPEN-08 | User can filter open matches by district                                   | P1       |
| OPEN-09 | User can request to join an open match                                     | P0       |
| OPEN-10 | Match host receives notification of join request                           | P0       |
| OPEN-11 | Match host can accept or decline join request                              | P0       |
| OPEN-12 | Requester receives notification of accept/decline                          | P0       |
| OPEN-13 | Open match shows current confirmed players                                 | P0       |
| OPEN-14 | Match host can cancel open match                                           | P1       |
| OPEN-15 | Players can see contact info of confirmed players (phone if shared)        | P1       |

### 6.1.7 My Bookings

| ID      | Requirement                                         | Priority |
| ------- | --------------------------------------------------- | -------- |
| MYBK-01 | User can view list of upcoming bookings             | P0       |
| MYBK-02 | User can view list of past bookings                 | P1       |
| MYBK-03 | Booking card shows: court, date, time, status       | P0       |
| MYBK-04 | User can tap booking to view details                | P0       |
| MYBK-05 | Booking detail shows associated open match (if any) | P0       |
| MYBK-06 | User can add booking to device calendar             | P2       |

### 6.1.8 Notifications

| ID      | Requirement                                         | Priority |
| ------- | --------------------------------------------------- | -------- |
| NOTF-01 | Push notification: Booking confirmed                | P0       |
| NOTF-02 | Push notification: Booking cancelled (by court)     | P0       |
| NOTF-03 | Push notification: Join request received (for host) | P0       |
| NOTF-04 | Push notification: Join request accepted/declined   | P0       |
| NOTF-05 | Push notification: Reminder 2 hours before match    | P1       |
| NOTF-06 | User can manage notification preferences            | P2       |

---

### 6.2 Court Owner Dashboard (B2B)

### 6.2.1 Authentication & Onboarding

| ID       | Requirement                                                  | Priority |
| -------- | ------------------------------------------------------------ | -------- |
| BAUTH-01 | Court owner can register with email/password                 | P0       |
| BAUTH-02 | Court owner can log in                                       | P0       |
| BAUTH-03 | Court owner can reset password                               | P0       |
| BAUTH-04 | Onboarding wizard collects: business name, contact, location | P0       |

### 6.2.2 Court Profile Management

| ID      | Requirement                                      | Priority |
| ------- | ------------------------------------------------ | -------- |
| BPRF-01 | Owner can set facility name and description      | P0       |
| BPRF-02 | Owner can upload facility photos (up to 10)      | P0       |
| BPRF-03 | Owner can set address with map pin               | P0       |
| BPRF-04 | Owner can set contact information (phone, email) | P0       |
| BPRF-05 | Owner can select amenities from predefined list  | P1       |
| BPRF-06 | Owner can set operating hours                    | P0       |
| BPRF-07 | Profile shows public preview                     | P1       |

### 6.2.3 Court & Slot Management

| ID      | Requirement                                                   | Priority |
| ------- | ------------------------------------------------------------- | -------- |
| BCRT-01 | Owner can add individual courts (name, type: indoor/outdoor)  | P0       |
| BCRT-02 | Owner can set court-specific details (surface type, lighting) | P2       |
| BCRT-03 | Owner can define time slots (duration: 60, 90, 120 min)       | P0       |
| BCRT-04 | Owner can set recurring weekly schedule                       | P0       |
| BCRT-05 | Owner can set price per slot                                  | P0       |
| BCRT-06 | Owner can block specific dates/times (maintenance, events)    | P1       |
| BCRT-07 | Owner can deactivate/reactivate courts                        | P1       |

### 6.2.4 Reservation Management

| ID      | Requirement                                            | Priority |
| ------- | ------------------------------------------------------ | -------- |
| BRES-01 | Owner can view calendar of all reservations            | P0       |
| BRES-02 | Calendar shows: court, time, player name, status       | P0       |
| BRES-03 | Owner can filter calendar by court                     | P0       |
| BRES-04 | Owner can filter calendar by date range                | P0       |
| BRES-05 | Owner can view reservation details                     | P0       |
| BRES-06 | Owner can confirm pending reservations                 | P0       |
| BRES-07 | Owner can reject reservations (with reason)            | P0       |
| BRES-08 | Owner can cancel confirmed reservations                | P1       |
| BRES-09 | Owner can create manual reservations (walk-ins, phone) | P1       |
| BRES-10 | Owner receives notification of new booking             | P0       |

### 6.2.5 Analytics (Basic)

| ID      | Requirement                                      | Priority |
| ------- | ------------------------------------------------ | -------- |
| BANA-01 | Dashboard shows total bookings (this week/month) | P0       |
| BANA-02 | Dashboard shows occupancy rate by court          | P1       |
| BANA-03 | Dashboard shows bookings by day of week          | P2       |
| BANA-04 | Dashboard shows peak hours                       | P2       |

---

## 7. User Flows

### 7.1 Player: First-Time Booking

```
[App Launch]
    │
    ▼
[Onboarding Screens] ──► [Sign Up / Login]
    │
    ▼
[Complete Profile]
    • Name
    • Skill Category (6-1)
    • Photo (optional)
    │
    ▼
[Home: Court Discovery]
    • List/Map toggle
    • Location permission prompt
    │
    ▼
[Browse Courts] ──► [Select Court]
    │
    ▼
[Court Detail]
    • View photos, amenities
    • See available slots
    │
    ▼
[Select Date & Slot]
    │
    ▼
[Booking Confirmation]
    • Review details
    • Confirm booking
    │
    ▼
[Success Screen]
    • Booking reference
    • Option: Create Open Match
    │
    ├──► [Create Open Match] ──► [Set preferences] ──► [Publish]
    │
    ▼
[My Bookings]
```

### 7.2 Player: Join Open Match

```
[Home / Open Matches Tab]
    │
    ▼
[Browse Open Matches]
    • Filter by date/skill/location
    │
    ▼
[View Match Details]
    • Court, time, host profile
    • Skill preference
    • Spots available
    │
    ▼
[Request to Join]
    │
    ▼
[Waiting for Host Response]
    │
    ├──► [Accepted] ──► [Match added to My Bookings]
    │                    • See other players
    │                    • Contact info available
    │
    └──► [Declined] ──► [Browse other matches]
```

### 7.3 Player: Host Open Match

```
[After Booking Confirmation]
    │
    ▼
[Create Open Match]
    • Set skill preference (range or specific)
    • Set spots needed (1-3)
    • Add note (optional)
    │
    ▼
[Match Published]
    │
    ▼
[Receive Join Request] ◄── [Push Notification]
    │
    ▼
[Review Requester Profile]
    • Name, skill level, photo
    │
    ├──► [Accept] ──► [Player added to match]
    │                  • Notification sent
    │                  • Spots updated
    │
    └──► [Decline] ──► [Notification sent]
                       • Continue waiting for requests
```

### 7.4 Court Owner: Initial Setup

```
[Landing Page]
    │
    ▼
[Register Account]
    • Email, password
    • Business details
    │
    ▼
[Onboarding Wizard]
    │
    ├──► Step 1: Facility Info
    │    • Name, description
    │    • Address (map)
    │
    ├──► Step 2: Photos
    │    • Upload facility images
    │
    ├──► Step 3: Add Courts
    │    • Court names
    │    • Indoor/outdoor
    │
    ├──► Step 4: Set Schedule
    │    • Operating hours
    │    • Slot durations
    │    • Prices
    │
    ▼
[Dashboard Ready]
    • Preview public listing
    • Go live
```

### 7.5 Court Owner: Manage Reservations

```
[Dashboard Home]
    │
    ▼
[Calendar View]
    • Weekly/Daily toggle
    • Color-coded by status
    │
    ▼
[New Booking Notification]
    │
    ▼
[View Booking Details]
    • Player info
    • Court, time
    • Any notes
    │
    ├──► [Confirm] ──► [Player notified]
    │                   • Slot locked
    │
    └──► [Reject] ──► [Select reason]
                      • Player notified
                      • Slot released
```

---

## 8. Data Models

### 8.1 Entity Relationship Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Facility  │       │    Court    │
│  (Player)   │       │   (Venue)   │       │  (Physical) │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │                     │ 1:N                 │
       │              ┌──────┴──────┐              │
       │              │             │              │
       │              ▼             │              │
       │        ┌─────────┐        │              │
       │        │  Owner  │        │              │
       │        │ Account │        │              │
       │        └─────────┘        │              │
       │                           │              │
       │ 1:N                       │ 1:N          │ 1:N
       ▼                           ▼              ▼
┌─────────────┐             ┌─────────────┐ ┌─────────────┐
│   Booking   │◄────────────│  TimeSlot   │◄│   Court     │
└──────┬──────┘             │ (Template)  │ │  Schedule   │
       │                    └─────────────┘ └─────────────┘
       │ 1:1 (optional)
       ▼
┌─────────────┐       ┌─────────────┐
│ Open Match  │◄──────│  Join       │
│             │  1:N  │  Request    │
└─────────────┘       └─────────────┘
```

### 8.2 Drizzle Schema

```tsx
// packages/db/src/schema/users.ts
import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const skillCategoryEnum = pgEnum("skill_category", [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
]);
export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "apple",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  skillCategory: skillCategoryEnum("skill_category").notNull().default("6"),
  preferredTimes: jsonb("preferred_times"),
  authProvider: authProviderEnum("auth_provider").notNull().default("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// packages/db/src/schema/facilities.ts
export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => ownerAccounts.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  amenities: jsonb("amenities").$type<string[]>(),
  photos: jsonb("photos").$type<string[]>(),
  operatingHours: jsonb("operating_hours").$type<OperatingHours>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// packages/db/src/schema/courts.ts
export const courtTypeEnum = pgEnum("court_type", ["indoor", "outdoor"]);

export const courts = pgTable("courts", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: courtTypeEnum("type").notNull(),
  surface: varchar("surface", { length: 50 }),
  hasLighting: boolean("has_lighting").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// packages/db/src/schema/time-slots.ts
export const timeSlots = pgTable("time_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, 0 = Sunday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// packages/db/src/schema/bookings.ts
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);
export const cancelledByEnum = pgEnum("cancelled_by", [
  "user",
  "owner",
  "system",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  oderId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id),
  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  cancelledBy: cancelledByEnum("cancelled_by"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// packages/db/src/schema/open-matches.ts
export const openMatchStatusEnum = pgEnum("open_match_status", [
  "open",
  "full",
  "cancelled",
]);

export const openMatches = pgTable("open_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id),
  skillMin: integer("skill_min").notNull(), // 1-6
  skillMax: integer("skill_max").notNull(), // 1-6
  spotsTotal: integer("spots_total").notNull(), // 1-3
  spotsFilled: integer("spots_filled").default(0).notNull(),
  description: text("description"),
  status: openMatchStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// packages/db/src/schema/join-requests.ts
export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "accepted",
  "declined",
]);

export const joinRequests = pgTable("join_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  openMatchId: uuid("open_match_id")
    .notNull()
    .references(() => openMatches.id),
  oderId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  status: joinRequestStatusEnum("status").default("pending").notNull(),
  message: text("message"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// packages/db/src/schema/owner-accounts.ts
export const ownerAccounts = pgTable("owner_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 8.3 Type Definitions

```tsx
// packages/db/src/types.ts
export interface OperatingHours {
  [day: string]: {
    open: string; // "08:00"
    close: string; // "22:00"
    closed?: boolean;
  };
}

export type SkillCategory = "1" | "2" | "3" | "4" | "5" | "6";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type OpenMatchStatus = "open" | "full" | "cancelled";
export type JoinRequestStatus = "pending" | "accepted" | "declined";
```

---

## 9. Technical Architecture

### 9.1 Technology Stack (T3 Turbo)

| Layer                  | Technology                       | Rationale                                 |
| ---------------------- | -------------------------------- | ----------------------------------------- |
| **Monorepo**           | Turborepo + pnpm                 | Pre-configured, fast builds, caching      |
| **Mobile App**         | Expo SDK 54 + React Native 0.81  | Cross-platform, Expo Router navigation    |
| **Web Dashboard**      | Next.js 15 (App Router)          | SSR, React 19, shared packages            |
| **API**                | tRPC v11                         | End-to-end type safety, no codegen        |
| **Database**           | PostgreSQL (Supabase)            | Managed, edge-ready, realtime capable     |
| **ORM**                | Drizzle                          | Lightweight, TypeScript-first, fast       |
| **Auth**               | Better-Auth                      | Modern, OAuth support, session management |
| **Styling (Mobile)**   | NativeWind v5 (Tailwind)         | Same classes across platforms             |
| **Styling (Web)**      | Tailwind CSS v4                  | Consistent with mobile                    |
| **UI Components**      | shadcn/ui                        | Pre-built, customizable                   |
| **File Storage**       | Supabase Storage / Cloudflare R2 | Images, CDN delivery                      |
| **Maps**               | Google Maps Platform             | Court discovery, directions               |
| **Push Notifications** | Expo Push Notifications          | Native integration                        |
| **Hosting**            | Vercel (Next.js)                 | Zero-config, preview deploys              |
| **Monitoring**         | Sentry                           | Error tracking                            |
| **Analytics**          | Mixpanel / PostHog               | Product analytics                         |

### 9.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
├─────────────────────┬─────────────────────┬─────────────────────┤
│   iOS App           │   Android App       │   Web Dashboard     │
│   (Expo + RN)       │   (Expo + RN)       │   (Next.js 15)      │
│   NativeWind        │   NativeWind        │   Tailwind + shadcn │
└─────────┬───────────┴─────────┬───────────┴─────────┬───────────┘
          │                     │                     │
          └──────────┬──────────┴──────────┬──────────┘
                     │     tRPC Client     │
                     ▼                     ▼
          ┌─────────────────────────────────────────┐
          │              tRPC Router                 │
          │           (packages/api)                 │
          │                                          │
          │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
          │  │  auth   │  │ facility│  │ booking │  │
          │  │ router  │  │ router  │  │ router  │  │
          │  └─────────┘  └─────────┘  └─────────┘  │
          │                                          │
          │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
          │  │  court  │  │  match  │  │  user   │  │
          │  │ router  │  │ router  │  │ router  │  │
          │  └─────────┘  └─────────┘  └─────────┘  │
          └───────┬─────────────┬─────────────┬─────┘
                  │             │             │
        ┌─────────▼──┐   ┌──────▼─────┐  ┌────▼─────────┐
        │  Supabase  │   │   Redis    │  │   Supabase   │
        │  Postgres  │   │  (Cache)   │  │   Storage    │
        │  (Drizzle) │   │  Optional  │  │   (Images)   │
        └────────────┘   └────────────┘  └──────────────┘
```

### 9.3 Project Structure (T3 Turbo)

```
padelhub/
├── apps/
│   ├── expo/                      # Mobile app (iOS + Android)
│   │   ├── app/                   # Expo Router screens
│   │   │   ├── (auth)/           # Auth screens (login, signup)
│   │   │   ├── (tabs)/           # Main tab navigation
│   │   │   │   ├── index.tsx     # Home / Court discovery
│   │   │   │   ├── matches.tsx   # Open matches
│   │   │   │   ├── bookings.tsx  # My bookings
│   │   │   │   └── profile.tsx   # User profile
│   │   │   ├── court/[id].tsx    # Court detail
│   │   │   └── match/[id].tsx    # Match detail
│   │   ├── components/           # Mobile components
│   │   ├── utils/                # Helpers, api client
│   │   └── assets/               # Images, fonts
│   │
│   └── nextjs/                    # Web dashboard
│       ├── app/
│       │   ├── (auth)/           # Owner auth pages
│       │   ├── (dashboard)/      # Protected dashboard
│       │   │   ├── page.tsx      # Dashboard home
│       │   │   ├── courts/       # Court management
│       │   │   ├── bookings/     # Reservations
│       │   │   ├── settings/     # Facility settings
│       │   │   └── analytics/    # Basic analytics
│       │   └── api/trpc/         # tRPC HTTP handler
│       └── components/           # Web components (shadcn)
│
├── packages/
│   ├── api/                       # tRPC router definitions
│   │   └── src/
│   │       ├── router/
│   │       │   ├── auth.ts
│   │       │   ├── user.ts
│   │       │   ├── facility.ts
│   │       │   ├── court.ts
│   │       │   ├── booking.ts
│   │       │   └── match.ts
│   │       ├── trpc.ts           # tRPC context, middleware
│   │       └── root.ts           # Root router
│   │
│   ├── auth/                      # Better-Auth configuration
│   │   └── src/
│   │       └── index.ts
│   │
│   ├── db/                        # Drizzle schema + client
│   │   └── src/
│   │       ├── schema/           # Table definitions
│   │       ├── index.ts          # DB client export
│   │       └── drizzle.config.ts
│   │
│   └── ui/                        # Shared UI (shadcn)
│       └── src/
│           └── components/
│
├── tooling/
│   ├── eslint/                    # Shared ESLint config
│   ├── prettier/                  # Shared Prettier config
│   ├── tailwind/                  # Shared Tailwind config
│   └── typescript/                # Shared tsconfig
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 9.4 tRPC Router Structure

```tsx
// packages/api/src/router/booking.ts
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";

import { bookings, courts, facilities, openMatches } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const bookingRouter = createTRPCRouter({
  // Get user's bookings
  getMyBookings: protectedProcedure
    .input(
      z.object({
        status: z.enum(["upcoming", "past"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0];

      return ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.userId, ctx.session.userId),
          input.status === "upcoming" ? gte(bookings.date, today) : undefined,
        ),
        with: {
          court: true,
          facility: true,
          openMatch: true,
        },
        orderBy: (bookings, { desc }) => [desc(bookings.date)],
      });
    }),

  // Create a booking
  create: protectedProcedure
    .input(
      z.object({
        courtId: z.string().uuid(),
        date: z.string(), // YYYY-MM-DD
        startTime: z.string(), // HH:MM
        endTime: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check for conflicts
      const existing = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.courtId, input.courtId),
          eq(bookings.date, input.date),
          eq(bookings.startTime, input.startTime),
          eq(bookings.status, "confirmed"),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slot is already booked",
        });
      }

      // Get price from time slot template
      const court = await ctx.db.query.courts.findFirst({
        where: eq(courts.id, input.courtId),
        with: { facility: true },
      });

      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          userId: ctx.session.userId,
          courtId: input.courtId,
          facilityId: court!.facilityId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          priceInCents: 5000, //TODO: Get from slot config
          status: "pending",
        })
        .returning();

      //TODO: Send push notification to court owner

      return booking;
    }),

  // Cancel a booking
  cancel: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      });

      if (!booking || booking.userId !== ctx.session.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledBy: "user",
          cancellationReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId))
        .returning();

      return updated;
    }),
});

// packages/api/src/router/match.ts
export const matchRouter = createTRPCRouter({
  // Browse open matches
  list: protectedProcedure
    .input(
      z.object({
        date: z.string().optional(),
        skillMin: z.number().min(1).max(6).optional(),
        skillMax: z.number().min(1).max(6).optional(),
        district: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.openMatches.findMany({
        where: eq(openMatches.status, "open"),
        with: {
          booking: {
            with: {
              court: true,
              facility: true,
            },
          },
          host: true,
          joinRequests: {
            where: eq(joinRequests.status, "accepted"),
            with: { user: true },
          },
        },
      });
    }),

  // Create open match
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        skillMin: z.number().min(1).max(6),
        skillMax: z.number().min(1).max(6),
        spotsTotal: z.number().min(1).max(3),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify booking belongs to user
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      });

      if (!booking || booking.userId !== ctx.session.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [match] = await ctx.db
        .insert(openMatches)
        .values({
          bookingId: input.bookingId,
          hostId: ctx.session.userId,
          skillMin: input.skillMin,
          skillMax: input.skillMax,
          spotsTotal: input.spotsTotal,
          description: input.description,
        })
        .returning();

      return match;
    }),

  // Request to join
  requestJoin: protectedProcedure
    .input(
      z.object({
        matchId: z.string().uuid(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.query.openMatches.findFirst({
        where: eq(openMatches.id, input.matchId),
      });

      if (!match || match.status !== "open") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [request] = await ctx.db
        .insert(joinRequests)
        .values({
          openMatchId: input.matchId,
          userId: ctx.session.userId,
          message: input.message,
        })
        .returning();

      //TODO: Send push notification to host

      return request;
    }),

  // Respond to join request (host only)
  respondToRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        accept: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.joinRequests.findFirst({
        where: eq(joinRequests.id, input.requestId),
        with: { openMatch: true },
      });

      if (!request || request.openMatch.hostId !== ctx.session.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(joinRequests)
        .set({
          status: input.accept ? "accepted" : "declined",
          respondedAt: new Date(),
        })
        .where(eq(joinRequests.id, input.requestId))
        .returning();

      if (input.accept) {
        // Update spots filled
        await ctx.db
          .update(openMatches)
          .set({
            spotsFilled: request.openMatch.spotsFilled + 1,
            status:
              request.openMatch.spotsFilled + 1 >= request.openMatch.spotsTotal
                ? "full"
                : "open",
          })
          .where(eq(openMatches.id, request.openMatchId));
      }

      //TODO: Send push notification to requester

      return updated;
    }),
});
```

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Requirement             | Target  | Measurement            |
| ----------------------- | ------- | ---------------------- |
| API response time (p95) | < 300ms | tRPC server monitoring |
| App cold start          | < 3s    | Device testing         |
| Time to interactive     | < 2s    | Lighthouse             |
| Image load time         | < 1s    | Optimized + CDN        |

### 10.2 Scalability

| Requirement          | MVP Target | Notes                       |
| -------------------- | ---------- | --------------------------- |
| Concurrent users     | 500        | Initial Lima launch         |
| Database connections | 100        | Supabase connection pooling |
| API requests/minute  | 1,000      | Vercel auto-scale           |

### 10.3 Availability

| Requirement                | Target             |
| -------------------------- | ------------------ |
| Uptime                     | 99.5%              |
| Planned maintenance window | Sundays 3-5 AM PET |

### 10.4 Security

| Requirement        | Implementation                                 |
| ------------------ | ---------------------------------------------- |
| Authentication     | Better-Auth with JWT                           |
| Session management | HTTP-only cookies + secure tokens              |
| API security       | tRPC middleware, rate limiting                 |
| Data encryption    | TLS 1.3 in transit, AES-256 at rest (Supabase) |
| Input validation   | Zod schemas on all inputs                      |

### 10.5 Localization

| Requirement | MVP Scope           |
| ----------- | ------------------- |
| Language    | Spanish (Peru) only |
| Currency    | PEN (Peruvian Sol)  |
| Timezone    | America/Lima (PET)  |
| Date format | DD/MM/YYYY          |

---

## 11. Timeline & Milestones

### Phase Overview

| Phase   | Duration | Focus                      |
| ------- | -------- | -------------------------- |
| Phase 0 | 1 week   | Setup & Planning           |
| Phase 1 | 2 weeks  | Core Infrastructure + Auth |
| Phase 2 | 2 weeks  | Court Discovery + Booking  |
| Phase 3 | 2 weeks  | Open Matches + Dashboard   |
| Phase 4 | 1 week   | Testing + Polish           |

### Detailed Timeline

### Week 1: Setup & Planning

- [ ] Clone T3 Turbo template, rename @acme to @padelhub
- [ ] Configure Supabase project (database, storage)
- [ ] Generate Better-Auth schema, run db:push
- [ ] Configure environment variables
- [ ] Set up Vercel project for Next.js
- [ ] Configure EAS for Expo builds
- [ ] Design system setup (extend shadcn theme)

### Weeks 2-3: Core Infrastructure + Auth

- [ ] Extend Drizzle schema (users, facilities, courts, etc.)
- [ ] Configure Better-Auth providers (email, Google, Apple)
- [ ] Create auth tRPC router
- [ ] Mobile: Auth screens (login, signup, forgot password)
- [ ] Mobile: Profile setup flow with skill category picker
- [ ] Dashboard: Owner login and registration
- [ ] Push notification setup (Expo Push)

### Weeks 4-5: Court Discovery + Booking

- [ ] Facility and Court tRPC routers
- [ ] TimeSlot configuration logic
- [ ] Booking router with conflict detection
- [ ] Mobile: Court list view with search
- [ ] Mobile: Map view with court pins
- [ ] Mobile: Court detail screen
- [ ] Mobile: Booking flow (date picker → slot selection → confirm)
- [ ] Mobile: My Bookings screen
- [ ] Dashboard: Facility setup wizard
- [ ] Dashboard: Court CRUD
- [ ] Dashboard: Schedule/slot configuration

### Weeks 6-7: Open Matches + Dashboard Completion

- [ ] OpenMatch and JoinRequest tRPC routers
- [ ] Match creation flow
- [ ] Join request/response logic
- [ ] Push notifications for match events
- [ ] Mobile: Create open match flow
- [ ] Mobile: Browse open matches (filters)
- [ ] Mobile: Match detail + join request
- [ ] Mobile: Host view (manage requests)
- [ ] Dashboard: Booking calendar (week/day views)
- [ ] Dashboard: Reservation management (confirm/reject)
- [ ] Dashboard: Basic analytics cards

### Week 8: Testing + Polish

- [ ] End-to-end testing (happy paths)
- [ ] Performance optimization
- [ ] Bug fixes from internal testing
- [ ] App store assets (screenshots, descriptions)
- [ ] Soft launch with 2-3 test courts
- [ ] Sentry error monitoring setup
- [ ] Documentation

### Milestones

| Milestone         | Date          | Criteria                                             |
| ----------------- | ------------- | ---------------------------------------------------- |
| M1: Foundation    | End of Week 1 | Repo configured, Supabase running, auth schema ready |
| M2: Auth Complete | End of Week 3 | Users can sign up/login on mobile + web              |
| M3: Booking Live  | End of Week 5 | End-to-end booking flow working                      |
| M4: MVP Complete  | End of Week 7 | All MVP features implemented                         |
| M5: Soft Launch   | End of Week 8 | Live with test courts in Lima                        |

---

## 12. Risks & Mitigations

| Risk                             | Probability | Impact | Mitigation                                                                                |
| -------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------- |
| **Court owners don’t adopt**     | Medium      | High   | Start with personal network; offer free onboarding; demonstrate value with player traffic |
| **Players prefer WhatsApp**      | Medium      | High   | Make booking faster than WhatsApp; add value with open matches; social proof              |
| **Technical delays**             | Low         | Medium | T3 Turbo reduces setup time; familiar stack; buffer in timeline                           |
| **Low initial supply (courts)**  | High        | High   | Manual onboarding before launch; geo-fence to districts with onboarded courts             |
| **Low initial demand (players)** | Medium      | High   | Seed with padel community contacts; target WhatsApp group admins                          |
| **Expo/RN compatibility issues** | Low         | Medium | T3 Turbo is tested; use stable Expo SDK                                                   |
| **Better-Auth learning curve**   | Low         | Low    | Good docs; fallback to Supabase Auth if needed                                            |

---

## 13. Future Considerations

### Post-MVP Roadmap Preview

### Phase 1: Stickiness (Weeks 9-14)

- In-app messaging (or deep link to WhatsApp)
- Enhanced push notifications (reminders, weekly digest)
- Match history on profiles
- Player ratings (post-match feedback)
- Court reviews and ratings

### Phase 2: Tournaments (Weeks 15-22)

- Tournament creation (Americano, Rey de la Cancha, custom)
- Bracket generation and management
- Player registration with skill validation
- Live scoring and results
- Tournament discovery feed

### Phase 3: Monetization (Weeks 23-30)

- Payment integration (Stripe, Yape, Plin for Peru)
- Court owner subscription tiers
- Booking fees (percentage or flat)
- Premium player features (priority booking, stats)
- Membership management for court owners

### Phase 4: Growth (Weeks 31+)

- ELO-based skill tracking (calculated from match results)
- Leaderboards (by court, district, city)
- Social features (follow players, activity feed)
- Expansion to other Peruvian cities (Arequipa, Trujillo)
- Multi-language support (English for tourists)

---

## Appendix A: Glossary

| Term                 | Definition                                                      |
| -------------------- | --------------------------------------------------------------- |
| **Court**            | A single padel playing surface (20m x 10m enclosed area)        |
| **Facility**         | A venue with one or more courts (also called “club” or “venue”) |
| **Open Match**       | A match where the host is seeking additional players            |
| **Skill Category**   | 6-1 scale rating player ability (6=beginner, 1=professional)    |
| **Slot**             | A bookable time period on a court (typically 60-120 minutes)    |
| **Americano**        | Tournament format where partners rotate each round              |
| **Rey de la Cancha** | “King of the Court” - elimination-style tournament format       |

---

## Appendix B: Amenities List

Standard amenities for facility profiles:

- Parking
- Showers
- Locker rooms
- Pro shop
- Equipment rental
- Cafe/Restaurant
- Air conditioning (indoor)
- Lighting (night play)
- Wheelchair accessible
- Wi-Fi
- Seating/viewing area

---

## Appendix C: Skill Category Reference

| Category | Level                 | Description                                                             |
| -------- | --------------------- | ----------------------------------------------------------------------- |
| 6        | Beginner              | Learning basic rules, grip, and strokes. Inconsistent contact.          |
| 5        | Beginner-Intermediate | Consistent rallies, basic positioning, learning the lob.                |
| 4        | Intermediate          | Reliable volleys, understands basic tactics, consistent serve.          |
| 3        | Intermediate-Advanced | Hits winners, strategic point construction, good court coverage.        |
| 2        | Advanced              | Tournament-level play, all shots mastered, strong mental game.          |
| 1        | Professional/Elite    | Competitive circuit players, exceptional skills, professional training. |

---

## Appendix D: T3 Turbo Quick Commands

```bash
# Install dependencies
pnpm i

# Start all apps in development
pnpm dev

# Start specific app
pnpm dev --filter=expo
pnpm dev --filter=nextjs

# Database operations
pnpm db:push      # Push schema to Supabase
pnpm db:studio    # Open Drizzle Studio

# Generate Better-Auth schema
pnpm --filter @padelhub/auth generate

# Add shadcn/ui component
pnpm ui-add

# Add new package to monorepo
pnpm turbo gen init

# Build for production
pnpm build

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

---

## Document History

| Version | Date       | Author | Changes                                                                                                |
| ------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-01-29 | Luis   | Initial PRD                                                                                            |
| 2.0     | 2026-01-29 | Luis   | Updated to T3 Turbo stack (tRPC, Drizzle, Better-Auth); Corrected skill categories (6=beginner, 1=pro) |

---

**End of Document**
