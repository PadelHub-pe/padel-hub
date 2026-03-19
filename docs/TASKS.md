# Tasks

## Completed

### Email Notification System

Fully implemented `packages/email` (React Email + Resend): 4 templates, high-level senders, integrated across all apps.

### Flow 1: Authentication & Access (8 tasks)

Login (email/password + Google OAuth), invite acceptance, password reset, rate limiting, post-login pending invite prompt, brand assets, auth error hardening, 129 tests.

### Flow 2: Organization Management (6 tasks)

Facility card actions, deactivation dialog, empty state, URL-persisted filters, org switcher, "Agregar Local" button.

### Image System (10 tasks)

`@wifo/images` package, Cloudflare Images integration (Direct Creator Upload), URL builder, tRPC images router, ImageUpload/Preview/Gallery components, integrated into facility photos, court photos, and org logo. 21 tests.

### Flow 3: Team & Roles - RBAC (8 tasks)

Last admin protection, facility manager invite scoping, `usePermission` hook, role-based sidebar filtering, route-level access guards, team table polish, invite/edit dialog enhancements, 35 tests.

### Flow 4: Facility Onboarding (11 tasks)

Schema migration (slug + geocoding), setup progress API, default operating hours, district autocomplete + geocoding, courts wizard redesign (individual CRUD + pricing), schedule wizard enhancement ("Aplicar a todos"), photos & amenities step, completion screen + activation gate, setup banner with progress, resume from correct step, slug auto-generation. 52 tests (setup: 37, slugify: 15).

### Flow 6: Schedule & Pricing (9 tasks)

Zone calculation utility, facility default pricing schema, enhanced operating hours editor (30-min increments, "Aplicar a todos", validation), peak period full CRUD (create/edit/delete with overlap detection, day shortcuts, max 5 limit), editable rate cards with facility defaults, court default/custom pricing system, revenue calculator (slider + monthly toggle), block time slots UI. 120 tests (schedule-utils: 48, schedule: 30, pricing: 42).

### Flow 7: Booking Management (7 tasks)

On-access status resolver, server-side price calculation, enhanced list API (multi-status, date range, sorting), cancel validations + state machine, comprehensive booking router tests (453 total), UI spec alignment, real dashboard stats. 143 tests (booking: 143).

### Flow 8: Calendar (7 tasks)

Calendar router fixes + tests, day view grid enhancements (zone backgrounds, blocked slots, court headers), booking block + popover polish, URL sync + keyboard shortcuts, legend/stats bar rework with zone colors + role-based display, week view enhancements (court dots, weekend bg, stripes, time indicator, quick booking), quick booking fixes + mini calendar dots. 474 total tests.

### Flow 9: Settings (7 tasks)

Phone column + account API extensions, profile tab (phone + avatar upload), password change modal, RBAC scoped settings tabs, facility team tab, unsaved changes warning + sidebar sync.

### Flow 10: Navigation & Context Switching (8 tasks)

Sidebar alignment, breadcrumbs, mobile nav, role-based landing, route guards, sign-out confirmation, facility switcher enhancements, 404 page.

---

## Current

### E2E Testing — Playwright MCP (10 tasks)

See `docs/TECHNICAL_PLAN.md` for full architecture and rationale.

#### Phase 1: Infrastructure

- [x] TASK-E2E.01 — Create `docs/e2e/` directory structure + README with execution protocol
- [x] TASK-E2E.02 — Write smoke test suite (`docs/e2e/smoke.md`) + verify Playwright MCP connectivity

#### Phase 2: Core Flow Suites

- [x] TASK-E2E.03 — Suite A (Auth & Access) + Suite I (Navigation)
- [x] TASK-E2E.04 — Suite B (Org Management) + Suite C (Team & RBAC)
- [x] TASK-E2E.05 — Suite D (Facility Onboarding) + Suite H (Settings)
- [x] TASK-E2E.06 — Suite E (Schedule & Pricing) + Suite F (Booking Management)
- [x] TASK-E2E.07 — Suite G (Calendar)

#### Phase 3: Cross-Cutting Suites

- [x] TASK-E2E.08 — RBAC matrix + error states
- [x] TASK-E2E.09 — Mobile responsive

#### Phase 4: Validation

- [x] TASK-E2E.10 — Full suite run, fix gaps, update docs
