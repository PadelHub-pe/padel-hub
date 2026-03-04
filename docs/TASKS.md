# Flow 1: Authentication & Access — Remaining Tasks

> **Status**: ~90% complete. Core auth flows (login, register, invite, password reset, middleware, org validation) are fully implemented. These tasks cover the remaining gaps from the spec.

## Prerequisites

- Better Auth configured with email + Google OAuth ✅
- `organizations`, `organization_members`, `organization_invites` tables ✅
- Invite router (`validate`, `accept`, `acceptExisting`) ✅
- Middleware with public/protected route handling ✅
- Forgot/reset password pages + Resend integration ✅
- No-organization dead-end page ✅

---

## Tasks

### TASK-01: Add `cancelled` status to invite enum and update invite handling
**Type**: feature
**Priority**: P1
**Depends on**: none
**Estimate**: ~30 min

**Context**: The `inviteStatusEnum` currently has `pending | accepted | expired`. The `cancelInvite` mutation in `org.ts` hard-deletes the invite row instead of soft-deleting. The `invite.validate` query doesn't handle `cancelled` status.

**Changes**:
1. `packages/db/src/schema.ts` — Add `"cancelled"` to `inviteStatusEnum`
2. `packages/api/src/router/org.ts` — Change `cancelInvite` from `DELETE` to `UPDATE` setting `status: "cancelled"`
3. `packages/api/src/router/invite.ts` — Add `cancelled` check in `validate` query, return `{ valid: false, error: "cancelled" }`
4. `apps/nextjs/src/app/register/_components/invite-register-form.tsx` — Handle `cancelled` error state with message: "Esta invitación fue cancelada."
5. Run `pnpm db:push` to apply schema change

**Acceptance criteria**:
- Cancelled invite token → shows "Esta invitación fue cancelada." with link to `/login`
- Cancel invite mutation soft-deletes (sets status) instead of hard-deleting
- Existing `accept` and `acceptExisting` mutations still only accept `pending` status (already the case)

---

### ~~TASK-02: Add rate limiting to web dashboard middleware~~ ✅
**Type**: feature
**Priority**: P1
**Depends on**: none
**Estimate**: ~1-2 hours

**Context**: The admin panel (`apps/admin/src/middleware.ts`) already implements in-memory rate limiting for auth and tRPC endpoints. The web dashboard (`apps/nextjs/src/middleware.ts`) has no rate limiting. Spec requires: lock after 5 failed login attempts for 15 minutes.

**Changes**:
1. `apps/nextjs/src/middleware.ts` — Add rate limiting for `/api/auth` routes (reuse pattern from admin middleware)
2. Login page should show "Cuenta bloqueada temporalmente. Intenta en 15 minutos." when rate limited (429 response)
3. `apps/nextjs/src/app/login/page.tsx` — Handle 429 response from Better Auth sign-in

**Acceptance criteria**:
- 5 failed login attempts from same IP → 429 response for 15 minutes
- Login form shows appropriate blocked message
- Rate limit applies to `/api/auth` POST endpoints
- Other routes (tRPC, static) are NOT rate-limited (or have separate higher limits)

**Reference**: Copy rate limiting approach from `apps/admin/src/middleware.ts`

---

### TASK-03: Post-login pending invite prompt
**Type**: feature
**Priority**: P2
**Depends on**: TASK-01
**Estimate**: ~2-3 hours

**Context**: Spec item 1.3 (unchecked): "After login, if user has a pending invite for their email, prompt them to accept it." Currently, users who sign in via Google (creating an account) or who already have accounts won't know they have pending invites unless they use the exact invite link.

**Changes**:
1. `packages/api/src/router/invite.ts` — Add `getPendingForUser` protected query: find pending invites matching the authenticated user's email
2. `apps/nextjs/src/app/org/page.tsx` — After fetching orgs, also check for pending invites. If found, show a prompt/banner before redirecting
3. New component: `apps/nextjs/src/app/org/_components/pending-invite-banner.tsx` — Shows invite details with "Aceptar" / "Rechazar" buttons
4. Wire accept button to `invite.acceptExisting` mutation

**Acceptance criteria**:
- User logs in → if they have pending invites, they see a prompt before being routed to their org
- Accepting adds them to the organization and redirects to that org's facilities
- Dismissing/declining skips the invite (doesn't cancel it — they can still use the link later)
- If user has no pending invites, normal redirect flow continues unchanged

---

### ~~TASK-04: Use brand logomark on login page~~ ✅
**Type**: bug-fix
**Priority**: P2
**Depends on**: none
**Estimate**: ~15 min

**Context**: Login page uses a text placeholder (`P` in a div) instead of the actual PadelHub logomark from `/assets/logomark/`. Brand assets are available and should be used per CLAUDE.md guidelines.

**Changes**:
1. Copy logomark asset to `apps/nextjs/public/images/` (or use existing if already there)
2. `apps/nextjs/src/app/login/page.tsx` — Replace the `<div>P</div>` placeholder with an `<Image>` using the logomark

**Acceptance criteria**:
- Login page shows actual PadelHub logomark (blue+green padel ball icon) instead of "P" placeholder
- Both the left branding panel and any mobile-visible logo use the real asset

---

### TASK-05: Verify and harden all auth error states (QA pass)
**Type**: bug-fix
**Priority**: P2
**Depends on**: TASK-01, TASK-02
**Estimate**: ~1 hour

**Context**: The spec lists specific error messages and behaviors for each sub-flow. This is a verification pass to ensure all error states match the spec.

**Checklist**:
- [ ] Invalid/malformed token → "Invitación no válida." + login link
- [ ] Expired token → "Esta invitación ha expirado." + login link
- [ ] Used token → "Esta invitación ya fue utilizada." + login link
- [ ] Cancelled token → "Esta invitación fue cancelada." + login link (TASK-01)
- [ ] Login wrong credentials → "Email o contraseña incorrectos" (preserves fields)
- [ ] Login rate limited → "Cuenta bloqueada temporalmente..." (TASK-02)
- [ ] Login network error → "Error de conexión..." with retry
- [ ] Forgot password → always shows success (doesn't leak email existence)
- [ ] Reset password invalid token → "Este enlace ha expirado. Solicita uno nuevo."
- [ ] OAuth cancel → returns to login gracefully
- [ ] Session expired → redirect to `/login` (not hard error)
- [ ] Inactive org → appropriate message (currently redirects to first available org)

**No code changes expected** — this is a manual QA pass. File bugs for any mismatches found.

---

## Completed (already implemented)

These items from the spec are confirmed working in the codebase:

- ✅ 1.1 Login (email/password) — form validation, error handling, remember me, loading states
- ✅ 1.2 Login (Google OAuth) — social sign-in with callback to `/org`
- ✅ 1.3 Invite acceptance — token validation, email pre-fill, name suggestion, account creation, auto-login
- ✅ 1.4 Token validation — invalid/used/expired handling (cancelled pending TASK-01)
- ✅ 1.5 Forgot/reset password — both pages, Resend integration, always-success pattern
- ✅ 1.6 Session persistence — 24h default, cookie-based, httpOnly, refresh interval
- ✅ 1.7 Org membership validation — server-side in `[orgSlug]/layout.tsx`
- ✅ 1.8 Redirect unauthorized — middleware + dead-end page + `/org` redirector
- ✅ 1.9 No public signup link — login page links to `padelhub.pe` landing for access requests
- ✅ 1.10 Google OAuth on invite — register page has Google button, callback processes existing users

### ~~TASK-06: Set up Vitest test infrastructure~~ ✅
**Type**: config
**Priority**: P1
**Depends on**: none
**Estimate**: ~1 hour

**Context**: The project has zero test infrastructure — no test framework, no test files, no CI job. Vitest is the best fit: fast, native ESM support, works well with tRPC + Drizzle in monorepos. This task sets up the foundation; TASK-07 and TASK-08 add actual tests.

**Changes**:
1. Add `vitest` + `@vitest/coverage-v8` to the root `package.json` devDependencies (or workspace catalog)
2. Create `vitest.workspace.ts` at repo root for monorepo support
3. Create `packages/api/vitest.config.ts` — configure for testing tRPC routers
4. Create `packages/validators/vitest.config.ts` — configure for testing Zod schemas
5. Add `"test"` script to root `package.json`: `turbo run test`
6. Add `"test"` script to `packages/api/package.json` and `packages/validators/package.json`
7. Add test job to `.github/workflows/ci.yml` (run after typecheck)
8. Run `pnpm install` to install dependencies

**Acceptance criteria**:
- `pnpm test` runs Vitest across configured workspaces
- `pnpm test -- --coverage` generates coverage report
- CI pipeline includes a test step
- Empty test suites pass (no failures on initial setup)

**Notes**:
- Do NOT add `@testing-library/react` or component tests yet — focus on backend logic first (highest ROI)
- Use a test database helper that creates an isolated Drizzle client against a test schema (or mock `ctx.db` for unit tests)

---

### TASK-07: Add invite router tests
**Type**: feature
**Priority**: P1
**Depends on**: TASK-06, TASK-01
**Estimate**: ~2-3 hours

**Context**: The invite router (`packages/api/src/router/invite.ts`) is the most critical auth logic — it handles token validation, account creation, and org membership. Testing this catches regressions in the core onboarding flow.

**File**: `packages/api/src/__tests__/invite.test.ts`

**Test cases for `invite.validate`**:
- Valid pending invite → returns `{ valid: true }` with org name, role, email
- Non-existent token → returns `{ valid: false, error: "invalid" }`
- Already-accepted invite → returns `{ valid: false, error: "used" }`
- Expired invite (past `expiresAt`) → returns `{ valid: false, error: "expired" }`
- Cancelled invite → returns `{ valid: false, error: "cancelled" }` (after TASK-01)
- Email with existing account → returns `{ emailHasAccount: true }`
- Email matching access request → returns `suggestedName` from access request
- Email with no access request → returns `suggestedName: null`

**Test cases for `invite.accept`**:
- Valid token + new user → creates user, creates org member, marks invite accepted
- Valid token + existing email → throws CONFLICT error
- Expired token → throws BAD_REQUEST
- Invalid/used token → throws NOT_FOUND
- Role and facilityIds from invite carry over to org membership
- Returned `organizationSlug` matches the invite's org

**Test cases for `invite.acceptExisting`**:
- Authenticated user matching invite email → creates org member, marks accepted
- Email mismatch → throws FORBIDDEN
- Already a member → still marks invite accepted (idempotent)
- Invalid/expired token → throws appropriate error

**Approach**: Use the tRPC `createCallerFactory` pattern with a mocked or test database context. If mocking is complex, use Drizzle with an in-memory SQLite or a dedicated test Postgres schema.

**Acceptance criteria**:
- All test cases pass with `pnpm test -F @wifo/api`
- Tests cover happy paths and all error branches
- Tests are isolated (no shared mutable state between tests)

---

### TASK-08: Add middleware and access control tests
**Type**: feature
**Priority**: P2
**Depends on**: TASK-06, TASK-02
**Estimate**: ~2 hours

**Context**: The middleware (`apps/nextjs/src/middleware.ts`) controls which routes are public vs protected, and the access control helper (`packages/api/src/lib/access-control.ts`) enforces RBAC. Both are critical security boundaries that should be tested.

**Tests for access control** (`packages/api/src/__tests__/access-control.test.ts`):
- `org_admin` → has all permissions on any facility in their org
- `facility_manager` with specific `facilityIds` → access granted for those facilities, denied for others
- `facility_manager` with empty `facilityIds` → access to all facilities
- `staff` → read + booking permissions only, scoped to `facilityIds`
- `staff` with empty `facilityIds` → no access to any facility
- Non-member → throws FORBIDDEN
- Each permission type (`manage_facility`, `manage_courts`, `manage_bookings`, `view_bookings`, `manage_settings`) tested per role

**Tests for rate limiting** (if extracted to a utility — otherwise skip):
- Requests under limit → pass through
- Requests at limit → return 429
- After window expires → requests allowed again

**Acceptance criteria**:
- Access control tests cover the full role matrix from CLAUDE.md
- Tests catch any future RBAC regression (e.g., accidentally granting staff write access)

---

## Implementation Order

```
TASK-06 (vitest setup)  ──────────────────────────┐
TASK-01 (cancelled status)  ────────────────────┐  │
TASK-02 (rate limiting)     ──────┐             │  │
TASK-04 (logomark)          ──┐   │             │  │
                              ▼   ▼             ▼  ▼
                           TASK-05 (QA pass)   TASK-07 (invite tests)
                                               TASK-08 (access control tests)
                                                │
                                                ▼
                                            TASK-03 (pending invite prompt)
```

**Parallel tracks**:
- Track A (features): TASK-01 → TASK-03
- Track B (features): TASK-02, TASK-04 → TASK-05
- Track C (testing): TASK-06 → TASK-07 + TASK-08 (parallel)

**Total remaining estimate**: ~10-13 hours
