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

---

## Flow 6: Schedule & Pricing (9 tasks)

> **Technical plan:** `docs/TECHNICAL_PLAN.md`
> **Spec:** `what-needs-to-be-build/⏰ Flow 6 Schedule & Pricing — Engineering Task...md`
>
> Most infrastructure exists (DB schema, tRPC routers, basic UI pages). These tasks close the gaps between current MVP and full spec.

### Phase 0: Infrastructure

- [x] **TASK-6.01** — Shared zone calculation utility `[feature]`
  Create `packages/api/src/utils/schedule.ts` with `getTimeZone()` and `getRateForSlot()` functions.
  Write tests in `packages/api/src/__tests__/schedule-utils.test.ts`.
  Pure logic, no DB dependencies. Consumed by Flows 6, 7, and 8.

- [x] **TASK-6.02** — Schema migration: facility default pricing `[config]`
  Add `defaultPriceInCents` and `defaultPeakPriceInCents` (nullable int) to `facilities` table.
  Update schema exports. Run `pnpm db:push`.

### Phase 1: Schedule Page Enhancements (Sub-flows 6.1, 6.2, 6.3)

- [x] **TASK-6.03** — Enhance operating hours editor `[feature]`
  30-min time increments, "Aplicar a todos" button, dirty state tracking (save disabled until changes),
  close > open validation, at least 1 day open validation.
  File: `.../schedule/_components/operating-hours-section.tsx`

- [x] **TASK-6.04** — Add `schedule.updatePeakPeriod` mutation `[feature]`
  New mutation with same validation as create. Input: periodId + partial fields.
  Write tests. File: `packages/api/src/router/schedule.ts`

- [ ] **TASK-6.05** — Enhance peak period CRUD (edit, validation, UX) `[feature]` — depends on TASK-6.04
  Convert dialog to create/edit dual-mode. Add edit button to cards. Delete confirmation.
  Quick day shortcuts (Lun-Vie, Sáb-Dom, Todos). Overlap detection. Max 5 limit. Markup S/ preview.
  Apply to both schedule and pricing page peak period components.

### Phase 2: Pricing Page Enhancements (Sub-flows 6.4, 6.5)

- [ ] **TASK-6.06** — Editable rate cards with facility default pricing `[feature]` — depends on TASK-6.02
  Add `pricing.updateDefaultRates` mutation. Make rate card prices editable with save.
  Use facility defaults instead of median in `getOverview`. Fix permission to `pricing:write`.

- [ ] **TASK-6.07** — Court pricing: default/custom system `[feature]` — depends on TASK-6.06
  "Por defecto (S/ X)" vs custom badge. Edit dialog with both regular + peak prices.
  "Restablecer" resets to default. Null court prices fall back to facility defaults.

### Phase 3: P1 Features (Sub-flows 6.6, 6.7)

- [ ] **TASK-6.08** — Revenue calculator enhancements `[feature]` — depends on TASK-6.02
  Slider input alongside presets. Monthly projection toggle (×4.33).
  Update calculation to use facility defaults for courts without custom pricing.

- [ ] **TASK-6.09** — Block time slots UI `[feature]`
  "Bloquear Horario" button + modal (court multi-select, date, time, reason, notes).
  Conflict check with booking warning. Blocked slots list. Delete/unblock.
  New files: `block-time-dialog.tsx`, `blocked-slots-section.tsx`
