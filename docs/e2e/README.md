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

## File Structure

```
docs/e2e/
├── README.md                         # This file
├── smoke.md                          # Level 1: Smoke tests
├── flows/
│   ├── auth.md                       # Suite A: Authentication & Access
│   ├── org-management.md             # Suite B: Organization & Facilities
│   ├── team-rbac.md                  # Suite C: Team & RBAC
│   ├── facility-onboarding.md        # Suite D: Facility Onboarding
│   ├── schedule-pricing.md           # Suite E: Schedule & Pricing
│   ├── booking-management.md         # Suite F: Booking Management
│   ├── calendar.md                   # Suite G: Calendar
│   ├── settings.md                   # Suite H: Settings & Profile
│   └── navigation.md                 # Suite I: Navigation & Context
└── cross-cutting/
    ├── rbac-matrix.md                # Role-based access verification
    ├── mobile-responsive.md          # Mobile layout tests
    └── error-states.md               # Error handling & edge cases
```
