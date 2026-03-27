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

### Public Booking Page (14 tasks)

Player-facing booking page at `bookings.padelhub.pe/[facilitySlug]`. See `docs/TECHNICAL_PLAN.md` for full architecture.

#### Phase 0: Schema & Infrastructure

- [x] TASK-PB.01 — Add `allowedDurationMinutes` jsonb column to facilities table (default `[60, 90]`) + unique constraint on `slug`. Update Drizzle schema, push migration.
- [x] TASK-PB.02 — Create `packages/whatsapp` package: Kapso SDK client (`@kapso/whatsapp-cloud-api`), OTP send/verify helpers, env validation. Follow `@wifo/email` pattern.
- [x] TASK-PB.03 — Add "Duraciones permitidas" setting to facility settings page in dashboard (multi-select: 60, 90, 120 min). Depends on TASK-PB.01.

#### Phase 1: Public API

- [ ] TASK-PB.04 — Write `getAvailableSlots()` pure function in `packages/api/src/utils/slots.ts`. Compose existing schedule utils (`getTimeZoneWithMarkup`, `getRateForSlot`). Write tests. Depends on TASK-PB.01.
- [ ] TASK-PB.05 — Create `publicBooking` tRPC router with read procedures: `getFacility`, `getAvailableSlots`, `calculatePrice`. All use `publicProcedure`. Write tests. Depends on TASK-PB.04.
- [ ] TASK-PB.06 — Add OTP procedures to `publicBooking` router: `sendOtp`, `verifyOtp`. Integrate `@wifo/whatsapp`. Rate-limit with Upstash Redis. Write tests. Depends on TASK-PB.02, TASK-PB.05.
- [ ] TASK-PB.07 — Add booking mutation procedures: `createBooking` (with OTP token validation + conflict detection + Turnstile), `getMyBookings`, `cancelBooking`. Reuse existing price calculation. Write tests. Depends on TASK-PB.06.

#### Phase 2: Booking App Shell

- [ ] TASK-PB.08 — Scaffold `apps/bookings` Next.js app: package.json, tsconfig, env, tRPC client setup, Tailwind, Cloudflare Turnstile. Follow `apps/admin` boilerplate. Add `dev:bookings` script to root. Port 3002. Depends on TASK-PB.05.
- [ ] TASK-PB.09 — Build facility landing page (`/[facilitySlug]`): facility info header, photo carousel, date picker, CTA button. Dynamic OG meta tags for WhatsApp previews. Mobile-first layout. Depends on TASK-PB.08.
- [ ] TASK-PB.10 — Build booking flow: `/[facilitySlug]/book` (court & time slot grid), `/[facilitySlug]/confirm` (name + phone + OTP verification), `/[facilitySlug]/success` (confirmation with booking code + "add to calendar"). Depends on TASK-PB.07, TASK-PB.09.

#### Phase 3: Player Features

- [ ] TASK-PB.11 — Build "Mis Reservas" page (`/[facilitySlug]/mis-reservas`): booking history for verified phone, cancel upcoming bookings, empty state. Depends on TASK-PB.10.
- [ ] TASK-PB.12 — Send WhatsApp booking confirmation message via Kapso after successful booking: booking details, facility name, date/time, court, booking code. Depends on TASK-PB.02, TASK-PB.10.

#### Phase 4: Dashboard Integration

- [ ] TASK-PB.13 — Add "Enlace de reservas" section to facility settings in dashboard: shareable URL display, QR code generator, copy-to-clipboard button. Depends on TASK-PB.08.
- [x] TASK-PB.14 — Differentiate online vs manual bookings in dashboard booking list: add "Online" / "Manual" badge column, filter by booking source. Depends on TASK-PB.10.

---

## Completed

### Web Dashboard Brand Assets (5 tasks)

Replace placeholder "P" boxes and missing metadata with actual PadelHub brand assets from `/assets/`.

- [x] TASK-BRAND.01 — Copy brand assets to `apps/nextjs/public/` (favicons, horizontal logo SVGs, OG image; follow landing page naming convention). Delete `t3-icon.svg`.
- [x] TASK-BRAND.02 — Add favicon & icon metadata to `apps/nextjs/src/app/layout.tsx` (favicon-16, favicon-32, apple-touch-icon-180, OG image)
- [x] TASK-BRAND.03 — Replace "P" box in OrgSidebar and FacilitySidebar with horizontal logo (reversed variant for dark sidebar)
- [x] TASK-BRAND.04 — Replace "P" box in mobile header (`responsive-sidebar.tsx`) with logomark
- [x] TASK-BRAND.05 — Replace "P" box on 404 page with logomark

### E2E Testing — Playwright MCP (10 tasks)

See `docs/TECHNICAL_PLAN.md` for full architecture and rationale.

- [x] TASK-E2E.01 — Create `docs/e2e/` directory structure + README with execution protocol
- [x] TASK-E2E.02 — Write smoke test suite (`docs/e2e/smoke.md`) + verify Playwright MCP connectivity
- [x] TASK-E2E.03 — Suite A (Auth & Access) + Suite I (Navigation)
- [x] TASK-E2E.04 — Suite B (Org Management) + Suite C (Team & RBAC)
- [x] TASK-E2E.05 — Suite D (Facility Onboarding) + Suite H (Settings)
- [x] TASK-E2E.06 — Suite E (Schedule & Pricing) + Suite F (Booking Management)
- [x] TASK-E2E.07 — Suite G (Calendar)
- [x] TASK-E2E.08 — RBAC matrix + error states
- [x] TASK-E2E.09 — Mobile responsive
- [x] TASK-E2E.10 — Full suite run, fix gaps, update docs

### BUG-005: Hydration mismatch on bookings page (4 subtasks)

Fix Radix UI auto-generated ID mismatches in `bookings-filters.tsx` — same class as BUG-002.

- [x] TASK-BUG5.01 — Defer mount of `Select` (court filter) in `BookingsFilters` with `useState(false)` + `useEffect` + `requestAnimationFrame` pattern. Show static placeholder button matching dimensions while unmounted.
- [x] TASK-BUG5.02 — Defer mount of `Popover` (date range picker) in `DateRangePicker` with the same pattern.
- [x] TASK-BUG5.03 — Verify fix: dev overlay shows 0 Issues on bookings page, no hydration console errors.
- [x] TASK-BUG5.04 — Update BUG-005 status to Fixed in `docs/BUGS.md` with actual fix description and lesson learned.
