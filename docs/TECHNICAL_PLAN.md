# E2E Testing Plan — PadelHub Web Dashboard

## 1. Context

### Current State

- **512 unit/integration tests** in Vitest across 20 test suites (packages/api, packages/images, packages/validators, apps/nextjs)
- **Zero E2E tests** — no Playwright infrastructure exists
- **Playwright MCP server** available — provides browser automation tools (navigate, click, snapshot, fill forms, etc.) that Claude can drive interactively
- **Seed data** ready: 3 roles × 3 facilities × 9 courts × 18 bookings via `pnpm db:seed`

### Test Accounts (password: `password123`)

| Email | Role | Access |
|-------|------|--------|
| `owner@padelhub.pe` | `org_admin` | All facilities + admin panel |
| `manager@padelhub.pe` | `facility_manager` | Facilities 1 & 2 |
| `staff@padelhub.pe` | `staff` | Facility 1 only |

### Architecture Decision: Playwright MCP

We'll use **Playwright MCP** as the primary E2E testing mechanism. This means:
- Claude drives the browser via MCP tools (`browser_navigate`, `browser_click`, `browser_snapshot`, `browser_fill_form`, etc.)
- Test scenarios are defined as structured markdown checklists in `docs/e2e/`
- Each test scenario includes: preconditions, steps, expected results, and verification screenshots
- Tests are executed interactively by Claude, with visual verification via `browser_take_screenshot`/`browser_snapshot`

**Why MCP over traditional Playwright test files:**
- No test file maintenance burden — scenarios are human-readable markdown
- Visual verification — Claude can interpret screenshots and DOM snapshots
- Adaptive — handles dynamic content (dates, IDs, counts) naturally
- Faster iteration — modify scenario descriptions, not code
- Single source of truth — the scenario docs ARE the tests

**Trade-off:** No automated CI execution. These are interactive verification suites meant to be run during development/before releases via Claude. Unit tests in Vitest remain the CI safety net.

---

## 2. Test Suite Architecture

### Three Levels

```
Level 1: Smoke Tests (~3 min)
├── Auth smoke (login, session, redirect)
├── Navigation smoke (sidebar, breadcrumbs, page loads)
└── Data smoke (facilities list, bookings list, dashboard)

Level 2: Flow Tests (~10-15 min per flow)
├── Suite A: Auth & Access
├── Suite B: Organization & Facilities
├── Suite C: Team & RBAC
├── Suite D: Facility Onboarding
├── Suite E: Schedule & Pricing
├── Suite F: Booking Management
├── Suite G: Calendar
├── Suite H: Settings & Profile
└── Suite I: Navigation & Context

Level 3: Cross-Cutting Tests (~15 min)
├── RBAC Matrix (all 3 roles × key routes)
├── Mobile Responsive (sidebar sheet, layouts)
├── Error States (404, unauthorized, expired tokens)
└── Edge Cases (empty states, boundary values)
```

### File Structure

```
docs/e2e/
├── README.md                      # How to run E2E tests with Playwright MCP
├── smoke.md                       # Level 1: Smoke tests
├── flows/
│   ├── auth.md                    # Suite A: Authentication & Access
│   ├── org-management.md          # Suite B: Organization & Facilities
│   ├── team-rbac.md               # Suite C: Team & RBAC
│   ├── facility-onboarding.md     # Suite D: Facility Onboarding
│   ├── schedule-pricing.md        # Suite E: Schedule & Pricing
│   ├── booking-management.md      # Suite F: Booking Management
│   ├── calendar.md                # Suite G: Calendar
│   ├── settings.md                # Suite H: Settings & Profile
│   └── navigation.md              # Suite I: Navigation & Context
└── cross-cutting/
    ├── rbac-matrix.md             # Role-based access verification
    ├── mobile-responsive.md       # Mobile layout tests
    └── error-states.md            # Error handling & edge cases
```

---

## 3. Scenario Format

Each test file follows this structure:

```markdown
# Suite Name

## Prerequisites
- [ ] Local Supabase running (`pnpm supabase:start`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Next.js dev server running (`pnpm dev:next`)

## Scenario: [Descriptive Name]

**Role:** org_admin | facility_manager | staff
**Start URL:** /login (or specific page if already authenticated)

### Steps
1. Navigate to [URL]
2. Verify [element/text] is visible
3. Click [element]
4. Fill [form field] with [value]
5. Assert [expected result]

### Expected Results
- [ ] [Specific verifiable outcome]
- [ ] [Screenshot checkpoint]

### Cleanup (if needed)
- [Steps to restore state for next scenario]
```

---

## 4. Detailed Test Suites

### Level 1: Smoke Tests

**Purpose:** Quick sanity check that the app is running and core paths work.

| # | Test | Steps | Pass Criteria |
|---|------|-------|---------------|
| S1 | Login renders | Navigate to `/login` | Login form visible, PadelHub branding |
| S2 | Valid login | Login as `owner@padelhub.pe` | Redirects to `/org/padel-group-lima/facilities` |
| S3 | Dashboard loads | Navigate to facility dashboard | Stats cards visible, today's schedule table |
| S4 | Sidebar navigation | Click each sidebar link | Pages load without errors |
| S5 | Breadcrumbs show | Navigate to bookings | Breadcrumb trail: Home > Org > Facility > Reservas |
| S6 | Logout works | Click sign out → confirm | Redirects to `/login` |

---

### Level 2: Flow Suites

#### Suite A: Auth & Access

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| A1 | Login with valid credentials | — | Redirects based on role |
| A2 | Login with invalid password | — | Error message in Spanish |
| A3 | Login rate limiting | — | After 5 attempts: "bloqueada por 15 minutos" |
| A4 | Forgot password flow | — | Shows "Revisa tu correo" success |
| A5 | Register via invite token | — | Prefills name from access request, creates account |
| A6 | Invalid/expired invite token | — | Shows error, no registration form |
| A7 | Post-login pending invite banner | — | Banner appears for user with pending invites |
| A8 | Session persistence | — | Refresh page → still authenticated |
| A9 | Role-based landing | All 3 | org_admin→facilities, manager→facility, staff→bookings |

#### Suite B: Organization & Facilities

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| B1 | View facilities list | org_admin | 3 facility cards, status badges, stats |
| B2 | Filter by status | org_admin | Active filter shows 2, inactive shows 1 |
| B3 | Search by name | org_admin | Typing "San Isidro" filters to 1 result |
| B4 | Filter by district | org_admin | District dropdown works, results filter |
| B5 | Sort facilities | org_admin | Name/bookings/revenue sorting works |
| B6 | URL-persisted filters | org_admin | Refresh preserves filter state |
| B7 | Quick create facility | org_admin | Form → submit → redirects to setup wizard |
| B8 | Empty state | org_admin | Remove filters to show "no results" |
| B9 | Org switcher | org_admin | Dropdown shows user's organizations |
| B10 | Inactive facility badge | org_admin | La Molina shows "Pendiente" badge |

#### Suite C: Team & RBAC

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| C1 | View team members | org_admin | Table shows 3 members with roles |
| C2 | Invite new member | org_admin | Dialog → send → pending invite appears |
| C3 | Edit member role | org_admin | Change role → success toast |
| C4 | Edit facility scope | org_admin | Assign/remove facility access |
| C5 | Remove member | org_admin | Confirmation → member removed |
| C6 | Last admin protection | org_admin | Cannot remove self (only admin) |
| C7 | Cancel pending invite | org_admin | Invite disappears from list |
| C8 | Resend invite | org_admin | Success toast, new token generated |
| C9 | Staff sidebar filtering | staff | Only sees assigned facility, no settings |
| C10 | Route guards | staff | Direct URL to `/courts` → redirected |

#### Suite D: Facility Onboarding

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| D1 | Setup wizard loads | org_admin | Step indicator shows 3 steps |
| D2 | Step 1: Add court | org_admin | Court form → save → court appears in list |
| D3 | Step 1: Edit court | org_admin | Modify name/type/price → persists |
| D4 | Step 1: Delete court | org_admin | Court removed from list |
| D5 | Step 1: Court pricing | org_admin | Set custom price per court |
| D6 | Step 2: Set hours | org_admin | Pick open/close time for each day |
| D7 | Step 2: Apply to all | org_admin | "Aplicar a todos" copies to all days |
| D8 | Step 2: Close a day | org_admin | Mark Sunday as closed |
| D9 | Step 3: Photos | org_admin | Upload photo (if Cloudflare configured) |
| D10 | Step 3: Amenities | org_admin | Select amenity chips |
| D11 | Complete setup | org_admin | Activation → facility becomes active |
| D12 | Resume from step 2 | org_admin | If courts done, wizard opens on step 2 |
| D13 | Setup banner | org_admin | Dashboard shows progress banner |

#### Suite E: Schedule & Pricing

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| E1 | View operating hours | org_admin | 7-day schedule visible |
| E2 | Edit operating hours | org_admin | Change Monday hours → save → updated |
| E3 | Apply hours to all | org_admin | "Aplicar a todos" → all days match |
| E4 | Create peak period | org_admin | Dialog → set days/times/markup → saved |
| E5 | Edit peak period | org_admin | Modify markup → save → updated |
| E6 | Delete peak period | org_admin | Confirmation → removed |
| E7 | Overlap detection | org_admin | Create overlapping peak → error |
| E8 | Max 5 peak periods | org_admin | 6th peak → error message |
| E9 | Default pricing | org_admin | Set facility default price → save |
| E10 | Court custom pricing | org_admin | Override court price → save |
| E11 | Reset court to default | org_admin | Reset → court uses facility default |
| E12 | Revenue calculator | org_admin | Slider → revenue estimate updates |
| E13 | Block time slot | org_admin | Block dialog → slot marked as blocked |

#### Suite F: Booking Management

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| F1 | View bookings list | org_admin | Table with seeded bookings |
| F2 | Filter by status | org_admin | Filter confirmed → shows matching |
| F3 | Filter by date range | org_admin | Today/tomorrow/custom range |
| F4 | Search by code | org_admin | Search booking code → found |
| F5 | Create manual booking | org_admin | Dialog → select court/time → created |
| F6 | View booking detail | org_admin | Click row → detail page with players |
| F7 | Confirm booking | org_admin | Pending → confirmed (button click) |
| F8 | Cancel booking | org_admin | Cancel dialog → reason → cancelled |
| F9 | Add player | org_admin | Add player dialog → player added |
| F10 | Remove player | org_admin | Remove → player removed |
| F11 | Status auto-resolve | org_admin | Past booking shows as completed |
| F12 | Staff booking access | staff | Can view list, limited actions |
| F13 | Pagination | org_admin | Navigate between pages |

#### Suite G: Calendar

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| G1 | Day view loads | org_admin | Time grid with court columns |
| G2 | Week view loads | org_admin | 7-day grid, court dots |
| G3 | Switch day/week | org_admin | Toggle changes view |
| G4 | Navigate dates | org_admin | Arrow keys/buttons change date |
| G5 | Zone backgrounds | org_admin | Peak=orange, blocked=red visible |
| G6 | Booking blocks | org_admin | Bookings appear as colored blocks |
| G7 | Click booking | org_admin | Opens booking detail/popover |
| G8 | Quick booking | org_admin | Click empty slot → booking dialog |
| G9 | URL sync | org_admin | Date/view persisted in URL |
| G10 | Mini calendar | org_admin | Dots on dates with bookings |
| G11 | Stats bar | org_admin | Revenue + occupancy shown |
| G12 | Legend | org_admin | Zone colors + role display |

#### Suite H: Settings & Profile

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| H1 | Org profile tab | org_admin | View/edit org name, email |
| H2 | Facility profile tab | org_admin | View/edit facility details |
| H3 | Account profile | org_admin | Edit name, phone, avatar |
| H4 | Change password | org_admin | Current + new password → success |
| H5 | Wrong current password | org_admin | Error message |
| H6 | RBAC tab visibility | staff | Only sees security + account tabs |
| H7 | Facility team tab | org_admin | View facility-scoped members |
| H8 | Unsaved changes warning | org_admin | Edit + navigate → warning dialog |

#### Suite I: Navigation & Context

| # | Scenario | Role | Key Assertions |
|---|----------|------|----------------|
| I1 | Org sidebar structure | org_admin | Logo, org selector, nav items |
| I2 | Facility sidebar | org_admin | Facility switcher, nav sections |
| I3 | Breadcrumb trail | org_admin | Shows full path: Org > Facility > Page |
| I4 | Facility switcher | org_admin | Switch facility → loads new dashboard |
| I5 | Back to org link | org_admin | "← Organización" returns to facilities |
| I6 | Mobile sidebar | org_admin | Hamburger → sheet opens |
| I7 | Sign-out confirmation | org_admin | Confirm dialog → logout |
| I8 | 404 page | — | Invalid URL → 404 with home link |
| I9 | Staff restricted nav | staff | No settings/courts/schedule links |

---

### Level 3: Cross-Cutting Tests

#### RBAC Matrix

Test every key route with all 3 roles:

| Route | org_admin | facility_manager | staff |
|-------|-----------|-------------------|-------|
| `/facilities` | ✅ List all | ✅ List scoped | ✅ List scoped |
| `/facilities/new` | ✅ Create form | ❌ Redirect | ❌ Redirect |
| `/facilities/[id]` (dashboard) | ✅ Full stats | ✅ Full stats | ❌ Redirect to bookings |
| `/facilities/[id]/courts` | ✅ CRUD | ✅ CRUD (scoped) | ❌ Redirect |
| `/facilities/[id]/bookings` | ✅ Full access | ✅ Full access (scoped) | ✅ Read + limited manage |
| `/facilities/[id]/schedule` | ✅ Full CRUD | ✅ Full CRUD (scoped) | ❌ Redirect |
| `/facilities/[id]/pricing` | ✅ Full CRUD | ✅ Full CRUD (scoped) | ❌ Redirect |
| `/facilities/[id]/settings` | ✅ All tabs | ✅ Profile + team | ✅ Account + security only |
| `/settings` (org) | ✅ Team + profile | ❌ Redirect | ❌ Redirect |

**Test:** For each ❌, verify redirect or restricted content via direct URL navigation.

#### Mobile Responsive

| # | Test | Viewport | Assertions |
|---|------|----------|------------|
| M1 | Sidebar collapses | 375×667 | Hamburger button visible, sidebar hidden |
| M2 | Sheet navigation | 375×667 | Tap hamburger → sidebar sheet opens |
| M3 | Table scrolls | 375×667 | Bookings table horizontally scrollable |
| M4 | Dialogs fit | 375×667 | Modals don't overflow viewport |
| M5 | Calendar adapts | 375×667 | Day view usable on mobile |

#### Error States

| # | Test | Assertions |
|---|------|------------|
| E1 | Invalid org slug | 404 page with navigation |
| E2 | Invalid facility ID | 404 page with navigation |
| E3 | Expired session | Redirect to login |
| E4 | Unauthorized facility | Redirect to appropriate page |
| E5 | No organizations | `/no-organization` page |

---

## 5. Execution Protocol

### Before Running Tests

```bash
# 1. Start local Supabase (Docker required)
pnpm supabase:start

# 2. Seed database with test data
pnpm db:seed

# 3. Start Next.js dev server
pnpm dev:next
```

### Running with Playwright MCP

Each suite runs as a conversation with Claude using the Playwright MCP tools:

1. **`browser_navigate`** — Navigate to URLs
2. **`browser_snapshot`** — Get accessible DOM snapshot (primary verification)
3. **`browser_click`** — Click elements by ref or text
4. **`browser_fill_form`** — Fill form inputs
5. **`browser_take_screenshot`** — Visual verification checkpoints
6. **`browser_press_key`** — Keyboard interactions
7. **`browser_wait_for`** — Wait for network/elements
8. **`browser_select_option`** — Dropdown selections

### Execution Commands

To run a specific suite, tell Claude:
- "Run E2E smoke tests" → executes `docs/e2e/smoke.md`
- "Run E2E Suite F (bookings)" → executes `docs/e2e/flows/booking-management.md`
- "Run RBAC matrix tests" → executes `docs/e2e/cross-cutting/rbac-matrix.md`
- "Run all E2E tests" → executes all suites in order

### Handling Auth State

For suites requiring authentication:
1. Navigate to `/login`
2. Fill email + password via `browser_fill_form`
3. Submit login form
4. Verify redirect to expected landing page
5. Continue with test scenarios

For role switching within a suite:
1. Sign out (click sign out → confirm)
2. Log in as new role
3. Continue scenarios

### Handling Dynamic Data

- **Facility IDs** — Discover via DOM snapshot after loading facilities list
- **Booking codes** — Read from table after creation
- **Dates** — Use "today" relative dates; seed data creates bookings for current date
- **Counts** — Read actual values from DOM, don't hardcode

---

## 6. Risk Assessment

### What Could Break
- **Seed data drift** — If seed script changes, test scenarios may reference stale data
- **Dynamic content** — Dates, IDs, and counts change per seed run
- **Cloudflare Images** — Photo upload tests require valid API keys (skip in dev)
- **Email delivery** — Cannot verify actual email content (logs to console in dev)
- **Rate limiting** — Rate limit tests may affect subsequent scenarios in same session

### Mitigations
- Always `pnpm db:seed` before running suites
- Use DOM snapshots to discover dynamic values, don't hardcode
- Mark Cloudflare-dependent tests as optional
- Verify email scenarios via console log inspection
- Run rate limiting tests last within auth suite

### Not Covered by E2E (kept in unit tests)
- Zone calculation edge cases (48 unit tests)
- Booking status state machine (19 unit tests)
- Price calculation precision (13 unit tests)
- Access control permission matrix (104 unit tests)
- These are pure-function logic better verified at unit level

---

## 7. Task Breakdown

### Phase 1: Infrastructure (2 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-E2E.01 | Create `docs/e2e/` directory structure + README with execution protocol | config | — |
| TASK-E2E.02 | Write smoke test suite (`docs/e2e/smoke.md`) + verify Playwright MCP connectivity | feature | TASK-E2E.01 |

### Phase 2: Core Flow Suites (5 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-E2E.03 | Write Suite A (Auth & Access) + Suite I (Navigation) — foundational flows | feature | TASK-E2E.02 |
| TASK-E2E.04 | Write Suite B (Org Management) + Suite C (Team & RBAC) | feature | TASK-E2E.02 |
| TASK-E2E.05 | Write Suite D (Facility Onboarding) + Suite H (Settings) | feature | TASK-E2E.02 |
| TASK-E2E.06 | Write Suite E (Schedule & Pricing) + Suite F (Booking Management) | feature | TASK-E2E.02 |
| TASK-E2E.07 | Write Suite G (Calendar) | feature | TASK-E2E.02 |

### Phase 3: Cross-Cutting Suites (2 tasks)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-E2E.08 | Write RBAC matrix + error states suites | feature | TASK-E2E.03, TASK-E2E.04 |
| TASK-E2E.09 | Write mobile responsive suite | feature | TASK-E2E.02 |

### Phase 4: Validation (1 task)

| Task | Description | Type | Depends On |
|------|-------------|------|------------|
| TASK-E2E.10 | Run full E2E suite end-to-end, fix scenario gaps, update docs | feature | TASK-E2E.03–09 |

### Parallelization

Tasks E2E.03–07 can all run in parallel (independent flow suites). Tasks E2E.08–09 can run in parallel after their dependencies.

```
E2E.01 → E2E.02 → ┬─ E2E.03 ─┬─ E2E.08 ─┐
                   ├─ E2E.04 ─┤          ├─ E2E.10
                   ├─ E2E.05  ├─ E2E.09 ─┘
                   ├─ E2E.06  │
                   └─ E2E.07 ─┘
```

---

## 8. Success Criteria

- [ ] All smoke tests pass (Level 1)
- [ ] All 9 flow suites documented and executable (Level 2)
- [ ] RBAC matrix verified for all 3 roles (Level 3)
- [ ] Mobile responsive verified at 375×667 (Level 3)
- [ ] Error states verified (404, unauthorized, expired) (Level 3)
- [ ] Full suite runnable in < 60 minutes
- [ ] README with clear execution instructions
