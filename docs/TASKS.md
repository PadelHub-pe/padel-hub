# Tasks

## Completed Flows

### Email Notification System ✅

Fully implemented `packages/email` (React Email + Resend):

- Resend client with dev-mode console fallback (no API key required locally)
- Shared components: Layout, Header, Footer, Button
- 4 templates: OrganizationInvite, PasswordReset, AccessRequestApproval, AccessRequestConfirmation
- High-level senders exported from `@wifo/email`
- Integrated into org router, admin router, auth hooks, and landing page API
- Vercel-aware base URL resolution, `.env.example` updated

### Flow 1: Authentication & Access ✅

All 8 tasks completed. Full auth system implemented:

- Login (email/password + Google OAuth), invite acceptance, password reset
- Rate limiting on web dashboard and admin panel
- Post-login pending invite prompt
- Brand logomark on login page
- Auth error states hardened to match spec
- Vitest infrastructure + invite router tests + RBAC unit tests (129 tests passing)

---

## Flow 2: Organization Management

Most of Flow 2 is already built. These tasks cover the **gaps** between the current implementation and the spec.

See `docs/TECHNICAL_PLAN.md` for full gap analysis.

### TASK-2.1: Add facility card actions menu + inactive styling [feature] [P0] ✅

**What**: Add "⋯" dropdown menu to each facility card with actions: "Ver Dashboard", "Editar", "Desactivar"/"Reactivar". Make inactive cards render at 75% opacity with gray gradient header. Make card body clickable (navigate to dashboard).

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facility-card.tsx` — Add `DropdownMenu` with actions, inactive styling, clickable card body
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-view.tsx` — Pass `userRole` prop down for conditional menu visibility

**Acceptance criteria**:
- "⋯" button in card header opens dropdown with 3 options
- Only `org_admin` sees "Desactivar"/"Reactivar" option
- Inactive cards show 75% opacity + gray gradient photo overlay
- Click card body → navigate to facility dashboard
- "Editar" → navigate to facility settings (or setup if incomplete)

**Depends on**: None

---

### TASK-2.2: Add deactivation confirmation dialog + toast [feature] [P0] ✅

**What**: When user clicks "Desactivar" from card menu, show confirmation dialog with facility name and pending bookings warning. On confirm, call `org.updateFacilityStatus` with optimistic UI. Show toast on success. Reactivation needs no dialog — just API call + toast.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facility-card.tsx` — Dialog trigger state
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/deactivate-dialog.tsx` — New: confirmation dialog
- `packages/api/src/router/org.ts` — May need to add pending bookings count to response

**Acceptance criteria**:
- Deactivate confirmation shows: "¿Desactivar [name]?" with explanation text
- If facility has pending bookings, show warning count
- Confirm → API call → card updates to inactive styling
- Reactivate → no dialog → API call → card returns to active
- Toast: "[Name] desactivado" / "[Name] reactivado"

**Depends on**: TASK-2.1 (card menu exists)

---

### TASK-2.3: First-time empty state for zero facilities [feature] [P0] ✅

**What**: When org has zero facilities, show a proper onboarding empty state instead of the filter-based "no results" state. KPIs show "0" with no trends. Centered illustration with "Aún no tienes locales" heading and CTA button.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-view.tsx` — Conditional rendering when `stats.totalFacilities === 0`
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facility-empty-state.tsx` — New: empty state component
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-stats.tsx` — Suppress trends when zero

**Acceptance criteria**:
- Zero facilities → hide filters, show empty state with icon + heading + description + CTA
- CTA "Agregar mi primer local" → `/org/[slug]/facilities/new`
- KPI cards show "0" without trend indicators
- After creating first facility + returning, empty state is replaced by card

**Depends on**: None

---

### TASK-2.4: URL-persisted filters + result count [feature] [P0] ✅

**What**: Sync filter state with URL query params so filtered views are shareable. Add result count display ("Mostrando X de Y locales").

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-view.tsx` — Replace `useState` with `useSearchParams`-backed state
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-filters.tsx` — Add result count display

**Acceptance criteria**:
- Filters persist in URL: `?status=active&district=surco&sort=revenue&q=trigal`
- Copy URL → paste in new tab → same filters applied
- Result count shown: "Mostrando 3 de 5 locales" (when filters active)
- Browser back/forward navigates filter history

**Depends on**: None

---

### TASK-2.5: Org switcher single-org behavior [feature] [P1]

**What**: When user belongs to only 1 org, hide the chevron icon and disable the dropdown trigger. Add checkmark indicator for current org in multi-org dropdown.

**Files**:
- `apps/nextjs/src/app/org/_components/org-selector.tsx` — Conditional chevron + checkmark

**Acceptance criteria**:
- Single org: displays name, no chevron, click does nothing
- Multi org: dropdown with checkmark on current org
- Each item shows role badge ("Admin" / "Manager" / "Staff")

**Depends on**: None

---

### TASK-2.6: Add "Agregar Local" button to facilities page header [feature] [P0] ✅

**What**: Add a primary CTA button in the page header row next to the title, navigating to `/org/[slug]/facilities/new`.

**Files**:
- `apps/nextjs/src/app/org/[orgSlug]/(org-view)/facilities/_components/facilities-view.tsx` — Add button to header

**Acceptance criteria**:
- "Agregar Local" button visible in page header (right-aligned)
- Only shown for `org_admin` role
- Navigates to `/org/[slug]/facilities/new`

**Depends on**: None

---

### Implementation Order

| Order | Task | Rationale | Estimate |
|-------|------|-----------|----------|
| 1 | TASK-2.3 | Empty state — quick win, fixes onboarding UX | 30min |
| 2 | TASK-2.6 | Header button — tiny, independent | 15min |
| 3 | TASK-2.1 | Card actions menu — core UX enhancement | 1-2h |
| 4 | TASK-2.2 | Deactivation dialog — builds on card menu | 1h |
| 5 | TASK-2.4 | URL filters — independent enhancement | 1-2h |
| 6 | TASK-2.5 | Org switcher polish — P1, small | 30min |

**Total estimate**: ~4-6 hours (vs original spec estimate of 19-25h — most was already built)
