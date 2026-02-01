---
name: padelhub-design-system
description: Applies PadelHub's design system when building UI components. Use when creating React Native (NativeWind), Next.js (shadcn/ui), or Tailwind code for PadelHub. Includes color tokens, typography, component patterns, status badges, and skill level badges.
---

# PadelHub Design System

## Brand Colors

**Primary (Blue)** — Trust, reliability, modern tech
- Main: `primary-500` (#3B82F6)
- Use for: headers, navigation, links, form focus, secondary buttons, tab active states

**Secondary (Emerald)** — Action, "go" psychology
- Main: `secondary-500` (#10B981)
- Use for: primary CTAs (Book Now, Join Match), availability indicators, prices, venue badges

## Quick Reference

### Color Classes

```
Primary:    bg-primary-500  text-primary-500  border-primary-500
Secondary:  bg-secondary-500  text-secondary-500  border-secondary-500
Success:    bg-success  text-success-dark
Warning:    bg-warning  text-warning-dark
Error:      bg-error  text-error-dark
Info:       bg-info  text-info-dark
```

### Typography (Inter font)

| Style       | Class                              |
|-------------|-----------------------------------|
| Display     | `text-[40px] font-bold leading-tight` |
| H1          | `text-[32px] font-bold`           |
| H2          | `text-2xl font-semibold`          |
| H3          | `text-xl font-semibold`           |
| H4          | `text-lg font-medium`             |
| Body        | `text-base font-normal`           |
| Body Small  | `text-sm font-normal`             |
| Caption     | `text-xs font-medium`             |

### Border Radius

| Token | Value  | Usage             |
|-------|--------|-------------------|
| sm    | 4px    | Small elements    |
| md    | 8px    | Buttons, inputs   |
| lg    | 12px   | Cards             |
| xl    | 16px   | Large cards       |
| 2xl   | 24px   | Feature sections  |
| full  | 9999px | Pills, avatars    |

## Status Badges

```tsx
// Confirmed
<Badge className="bg-success-light text-success-dark">Confirmed</Badge>

// Pending
<Badge className="bg-warning-light text-warning-dark">Pending</Badge>

// Cancelled
<Badge className="bg-error-light text-error-dark">Cancelled</Badge>

// Open Match
<Badge className="bg-secondary-100 text-secondary-700">Open</Badge>

// Completed
<Badge className="bg-gray-100 text-gray-700">Completed</Badge>
```

## Skill Level Badges

| Category          | Background      | Text          |
|-------------------|-----------------|---------------|
| Cat 6 (Beginner)  | `primary-50`    | `primary-600` |
| Cat 5             | `primary-100`   | `primary-700` |
| Cat 4             | `primary-200`   | `primary-800` |
| Cat 3             | `primary-500`   | `white`       |
| Cat 2             | `gray-700`      | `white`       |
| Cat 1 (Pro)       | `gray-900`      | `white`       |

## Component Libraries

- **Mobile:** NativeWind v5 (Tailwind for React Native)
- **Web:** shadcn/ui with extended theme
- **Icons:** Lucide Icons (`lucide-react` / `lucide-react-native`)

## Detailed References

- [COLORS.md](COLORS.md) — Full color palette with hex values
- [COMPONENTS.md](COMPONENTS.md) — Component patterns for mobile & web
- [TAILWIND-CONFIG.md](TAILWIND-CONFIG.md) — Complete Tailwind configuration

## Accessibility Requirements

- Text colors must meet WCAG AA (4.5:1 contrast minimum)
- Use `primary-600` or darker for text links
- Never use colors lighter than `-400` for text
- Status badges must include icons, not just color
- Focus states use `ring-primary-500/50`
