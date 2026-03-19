# E2E Testing — Playwright MCP

End-to-end test suites for the PadelHub web dashboard, executed interactively via Claude + Playwright MCP.

## How It Works

Test scenarios are defined as structured markdown files. Claude drives the browser via Playwright MCP tools (`browser_navigate`, `browser_click`, `browser_snapshot`, `browser_fill_form`, etc.) and verifies outcomes by inspecting DOM snapshots and screenshots.

**No traditional test files.** The markdown scenarios ARE the tests — human-readable, maintainable, and adaptive to dynamic content.

## Prerequisites

```bash
# 1. Start local Supabase (Docker required)
pnpm supabase:start

# 2. Seed database with test data
pnpm db:seed

# 3. Start Next.js dev server
pnpm dev:next
# App should be running at http://localhost:3000
```

### Test Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `owner@padelhub.pe` | `password123` | `org_admin` | All facilities |
| `manager@padelhub.pe` | `password123` | `facility_manager` | Facilities 1 & 2 |
| `staff@padelhub.pe` | `password123` | `staff` | Facility 1 only |

### Test Organization

- **Padel Group Lima** (slug: `padel-group-lima`)
  - Padel Club San Isidro (active, 4 courts)
  - Padel Club Miraflores (active, 3 courts)
  - Padel Club La Molina (inactive, 2 courts, setup incomplete)

## Running Tests

Ask Claude to run a specific suite:

| Command | Suite |
|---------|-------|
| "Run E2E smoke tests" | `docs/e2e/smoke.md` |
| "Run E2E Suite A (auth)" | `docs/e2e/flows/auth.md` |
| "Run E2E Suite B (org management)" | `docs/e2e/flows/org-management.md` |
| "Run E2E Suite C (team & RBAC)" | `docs/e2e/flows/team-rbac.md` |
| "Run E2E Suite D (onboarding)" | `docs/e2e/flows/facility-onboarding.md` |
| "Run E2E Suite E (schedule & pricing)" | `docs/e2e/flows/schedule-pricing.md` |
| "Run E2E Suite F (bookings)" | `docs/e2e/flows/booking-management.md` |
| "Run E2E Suite G (calendar)" | `docs/e2e/flows/calendar.md` |
| "Run E2E Suite H (settings)" | `docs/e2e/flows/settings.md` |
| "Run E2E Suite I (navigation)" | `docs/e2e/flows/navigation.md` |
| "Run RBAC matrix tests" | `docs/e2e/cross-cutting/rbac-matrix.md` |
| "Run mobile responsive tests" | `docs/e2e/cross-cutting/mobile-responsive.md` |
| "Run error state tests" | `docs/e2e/cross-cutting/error-states.md` |
| "Run all E2E tests" | All suites in dependency order |

## Test Levels

### Level 1: Smoke (~3 min)
Quick sanity check — login, navigation, data loads.

### Level 2: Flow Suites (~10-15 min each)
Feature-specific scenarios covering happy paths and key edge cases.

### Level 3: Cross-Cutting (~15 min)
RBAC verification across all roles, mobile responsive, error states.

## Playwright MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Go to a URL |
| `browser_snapshot` | Get accessible DOM tree (primary verification) |
| `browser_click` | Click an element |
| `browser_fill_form` | Fill form inputs |
| `browser_take_screenshot` | Visual checkpoint |
| `browser_press_key` | Keyboard input |
| `browser_wait_for` | Wait for network/elements |
| `browser_select_option` | Dropdown selection |
| `browser_hover` | Hover over elements |
| `browser_resize` | Change viewport size (mobile tests) |

## Conventions

### Auth State Management

- Each suite starts by logging in as the required role
- Role switches within a suite: sign out → log in as new role
- Use `browser_snapshot` after login to verify redirect destination

### Dynamic Data

- **Never hardcode** facility IDs, booking codes, or counts
- Discover values from DOM snapshots after loading pages
- Use relative date references ("today's bookings" not "March 16 bookings")

### Verification

- **Primary:** `browser_snapshot` to inspect DOM structure and text content
- **Visual:** `browser_take_screenshot` for layout/design verification
- **Navigation:** Verify URL after actions via `browser_snapshot`

### Reporting

After each suite, Claude reports:
- Total scenarios: X passed, Y failed, Z skipped
- Failed scenarios with details
- Screenshots of failures

## Recommended Run Order

When running all suites, follow this order (dependencies flow top-down):

1. **Smoke** (`smoke.md`) — Quick sanity check (~3 min)
2. **Suite A** (`auth.md`) — Auth flows must work before anything else
3. **Suite B** (`org-management.md`) + **Suite I** (`navigation.md`) — Core navigation
4. **Suite C** (`team-rbac.md`) — Team management and role verification
5. **Suite D** (`facility-onboarding.md`) — Onboarding wizard
6. **Suite E** (`schedule-pricing.md`) — Schedule & pricing configuration
7. **Suite F** (`booking-management.md`) — Booking CRUD
8. **Suite G** (`calendar.md`) — Calendar views
9. **Suite H** (`settings.md`) — Settings & profile
10. **RBAC Matrix** (`rbac-matrix.md`) — Cross-role verification (needs all roles working)
11. **Mobile Responsive** (`mobile-responsive.md`) — Viewport tests (resize back to 1280x720 after)
12. **Error States** (`error-states.md`) — Edge cases and error handling

## Important Notes

- **Always seed before running:** `pnpm db:seed` ensures clean, predictable test data
- **Snapshot-first verification:** Use `browser_snapshot` (DOM tree) as the primary verification method — it's more reliable than screenshots for checking text content and element structure
- **Sign-out confirmation:** The sign-out button shows a confirmation popover ("¿Cerrar sesión?") — always click "Confirmar" to complete logout
- **Page load timing:** Some pages may briefly show a loading/rendering state after navigation. Use `browser_wait_for` with expected text to wait for content to appear
- **Breadcrumb labels:** Some pages use different labels in breadcrumbs vs. sidebar (e.g., sidebar says "Precios" but breadcrumb shows "Tarifas") — this is by design

## File Structure

```
docs/e2e/
├── README.md                         # This file
├── smoke.md                          # Level 1: Smoke tests (6 scenarios)
├── flows/
│   ├── auth.md                       # Suite A: Authentication & Access (17 scenarios)
│   ├── org-management.md             # Suite B: Organization & Facilities (8 scenarios)
│   ├── team-rbac.md                  # Suite C: Team & RBAC
│   ├── facility-onboarding.md        # Suite D: Facility Onboarding
│   ├── schedule-pricing.md           # Suite E: Schedule & Pricing
│   ├── booking-management.md         # Suite F: Booking Management
│   ├── calendar.md                   # Suite G: Calendar
│   ├── settings.md                   # Suite H: Settings & Profile
│   └── navigation.md                 # Suite I: Navigation & Context
└── cross-cutting/
    ├── rbac-matrix.md                # Role-based access verification
    ├── mobile-responsive.md          # Mobile layout tests (10 scenarios)
    └── error-states.md               # Error handling & edge cases
```

## Last Validated

**Date:** 2026-03-19
**Status:** All suites pass against seeded data on `localhost:3000`
**Environment:** Local Supabase + Next.js dev server
