# Dashboard: Pricing screen

Estimate: M (4-8h)
Platform: Web
Priority: P0 - Critical
Sprint: Week 4-5 - Booking
Status: Backlog
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | Pricing Management |
| Platform | Web (Desktop) |
| Route | `/pricing` |
| Priority | P0 - Critical |
| Screen # | 9 of 12 (Dashboard) |
| Version | v2 - Visual Rates |

---

## 🎯 Purpose

Central pricing configuration for the facility. Set default hourly rates, define peak pricing periods, visualize when rates apply throughout the week, and optionally override rates for individual courts. Includes revenue estimation based on current configuration.

---

## 📐 Layout (Updated)

| Section | Description |
| --- | --- |
| Header | Title + Preview Schedule + Save Changes |
| Rate Cards | Side-by-side Regular vs Peak comparison |
| Weekly Schedule | Visual timeline showing rate zones |
| Court Pricing | Table with default/custom rate indicators |
| Revenue Calculator | Estimated weekly earnings |
| Peak Periods | Configurable peak time definitions |

---

## 💵 Rate Cards (NEW)

Side-by-side visual comparison of the two rate tiers:

### Regular Rate Card

| Element | Style |
| --- | --- |
| Container | White bg, secondary-200 border, rounded-2xl |
| Icon | ☀️ in secondary-100 circle |
| Label | "Regular Hours" / "Standard pricing" |
| Input | Large editable number (S/ prefix) |
| Features | Checkmarks listing when rate applies |
| Progress | Bar showing % of weekly hours (~65%) |

### Peak Rate Card

| Element | Style |
| --- | --- |
| Container | Amber gradient bg, amber-300 border |
| Badge | "PEAK" pill in top-right corner |
| Icon | ⚡ in amber-200 circle |
| Label | "Peak Hours" / "High-demand pricing" |
| Markup | Calculated badge showing "+X% markup" |
| Input | Large editable number (S/ prefix) |
| Features | Checkmarks listing peak time windows |
| Progress | Bar showing % of weekly hours (~35%) |

---

## 📅 Weekly Rate Schedule (NEW)

Visual horizontal timeline showing when each rate applies:

### Grid Structure

- **Rows**: Days of week (Mon-Sun)
- **Columns**: Hours (6 AM - 12 AM)
- **Colors**: Gray (closed), Green (regular), Amber (peak)
- **Labels**: Rate shown inside each zone block

### Day Row Example

```
Mon: [Gray 6-7] [Green 7AM-7PM "S/80/hr"] [Amber 7-10PM "⚡S/100"] [Green 10-11] [Gray 11-12]
```

### Weekend Highlight

- Saturday/Sunday labels in primary color
- Larger amber peak zone (10 AM - 8 PM)

### Legend

| Color | Meaning |
| --- | --- |
| Gray | Closed |
| Green (secondary-200) | Regular Rate |
| Amber (amber-300) | Peak Rate |

---

## 🏟️ Court-Specific Pricing

Table showing per-court rate configuration:

| Column | Content |
| --- | --- |
| Court | Color dot + name + premium badge if applicable |
| Type | Indoor/Outdoor badge |
| Regular Rate | "Default" or custom S/ amount |
| Peak Rate | "Default" or custom S/ amount |
| Status | "Using Default" or "Custom" badge |
| Action | Override/Edit button |

### Row States

| State | Style |
| --- | --- |
| Default rates | Normal row |
| Custom rates | Light primary-50 background, "Custom" badge |
| Premium court | "PREMIUM" mini-badge next to name |

---

## 💰 Revenue Calculator (NEW)

Gradient banner showing estimated weekly revenue:

| Element | Description |
| --- | --- |
| Container | primary-500 to primary-600 gradient |
| Headline | "Estimated Weekly Revenue" |
| Subtext | "Based on current rates & X% avg occupancy" |
| Total | Large S/ amount (e.g., S/ 8,960) |
| Breakdown | 3-column grid showing Regular/Peak/Markup bonus |

### Calculation Formula

```
Weekly Revenue = (Regular Hours × Regular Rate × Courts × Occupancy)
               + (Peak Hours × Peak Rate × Courts × Occupancy)
```

---

## ⚡ Peak Period Cards

Visual cards for each configured peak period:

| Element | Description |
| --- | --- |
| Container | amber-50 bg, amber-200 border, rounded-xl |
| Icon | Emoji (🌙 evening, ☀️ weekend) in amber circle |
| Title | Period name (e.g., "Evening Rush") |
| Subtitle | Description (e.g., "After-work demand") |
| Markup Badge | "+25%" in amber-200 |
| Day Pills | Selected days as small badges |
| Time Range | Bold time display (e.g., "7:00 PM – 10:00 PM") |
| Actions | Edit / Delete links |

---

## ➕ Add Peak Period Modal

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Name | text | Yes | 2-50 chars |
| Days | checkbox group | Yes | At least 1 |
| Start Time | time select | Yes | 15-min increments |
| End Time | time select | Yes | After start |
| Markup % | number | Yes | 1-100 |

### Quick Select Options

- Weekdays (Mon-Fri)
- Weekends (Sat-Sun)
- All Days

---

## 💻 Developer Notes

### tRPC Procedures

```tsx
// pricing.router.ts
pricing.getFacilityPricing.query({ facilityId })
// Returns: { defaultRates, courtOverrides, peakPeriods, revenueEstimate }

pricing.updateDefaultRates.mutate({
  facilityId: string,
  standardRate: number,
  peakRate: number
})

pricing.updateCourtPricing.mutate({
  courtId: string,
  standardRate?: number, // null = use default
  peakRate?: number
})

pricing.createPeakPeriod.mutate({
  facilityId: string,
  name: string,
  days: number[], // 0-6
  startTime: string,
  endTime: string,
  markupPercent: number
})

pricing.updatePeakPeriod.mutate({
  periodId: string,
  name?: string,
  days?: number[],
  startTime?: string,
  endTime?: string,
  markupPercent?: number
})

pricing.deletePeakPeriod.mutate({ periodId: string })

pricing.calculateWeeklyRevenue.query({
  facilityId: string,
  occupancyPercent: number // default 70
})
// Returns: { total, regularRevenue, peakRevenue, peakBonus }
```

### Revenue Calculation Service

```tsx
function calculateWeeklyRevenue(
  facilityId: string,
  occupancyPercent: number = 0.70
): RevenueEstimate {
  const { courts, operatingHours, peakPeriods, defaultRates } = getFacilityConfig(facilityId);
  
  let regularHours = 0;
  let peakHours = 0;
  
  // Calculate hours per week in each zone
  for (const day of [0,1,2,3,4,5,6]) {
    const dayHours = operatingHours[day];
    for (let hour = dayHours.open; hour < dayHours.close; hour++) {
      if (isPeakHour(hour, day, peakPeriods)) {
        peakHours++;
      } else {
        regularHours++;
      }
    }
  }
  
  const regularRevenue = regularHours * defaultRates.standard * courts.length * occupancyPercent;
  const peakRevenue = peakHours * defaultRates.peak * courts.length * occupancyPercent;
  const peakBonus = peakHours * (defaultRates.peak - defaultRates.standard) * courts.length * occupancyPercent;
  
  return {
    total: regularRevenue + peakRevenue,
    regularRevenue,
    peakRevenue,
    peakBonus,
    regularHoursPercent: regularHours / (regularHours + peakHours),
    peakHoursPercent: peakHours / (regularHours + peakHours)
  };
}
```

### Drizzle Schema Reference

```tsx
facilities: {
  // ... other fields
  defaultStandardRate: decimal(10,2),
  defaultPeakRate: decimal(10,2)
}

courts: {
  // ... other fields
  standardRate: decimal(10,2), // null = use facility default
  peakRate: decimal(10,2),
  isPremium: boolean
}

peakPeriods: {
  id: uuid,
  facilityId: uuid,
  name: varchar(50),
  days: int[],
  startTime: time,
  endTime: time,
  markupPercent: decimal(5,2)
}
```

---

## 🖼️ Wireframe

See: `09-web-pricing.html`

---

**Last Updated:** February 16, 2026

**Version:** 2.0 (Visual Rates)