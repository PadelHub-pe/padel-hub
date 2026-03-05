# Tasks

## Completed Flows

### Email Notification System

Fully implemented `packages/email` (React Email + Resend):

- Resend client with dev-mode console fallback (no API key required locally)
- Shared components: Layout, Header, Footer, Button
- 4 templates: OrganizationInvite, PasswordReset, AccessRequestApproval, AccessRequestConfirmation
- High-level senders exported from `@wifo/email`
- Integrated into org router, admin router, auth hooks, and landing page API
- Vercel-aware base URL resolution, `.env.example` updated

### Flow 1: Authentication & Access

All 8 tasks completed. Full auth system implemented:

- Login (email/password + Google OAuth), invite acceptance, password reset
- Rate limiting on web dashboard and admin panel
- Post-login pending invite prompt
- Brand logomark on login page
- Auth error states hardened to match spec
- Vitest infrastructure + invite router tests + RBAC unit tests (129 tests passing)

### Flow 2: Organization Management

All 6 tasks completed. Facilities page fully functional:

- Facility card actions menu with inactive styling (TASK-2.1)
- Deactivation confirmation dialog with pending bookings warning (TASK-2.2)
- First-time empty state for zero facilities (TASK-2.3)
- URL-persisted filters with result count (TASK-2.4)
- Org switcher single-org behavior and active checkmark (TASK-2.5)
- "Agregar Local" button in facilities page header (TASK-2.6)

---

## Next Flow

_No tasks scoped yet. Run `/scope-task` to plan the next flow._
