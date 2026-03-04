# 🔐 Flow 1: Authentication & Access — Engineering Task

Implement the complete invite-only authentication system for the PadelHub web dashboard. This is the **most critical flow** — nothing else works until users can reliably sign in, accept invitations, and be routed to their organization.

---

## Context & Strategy

**Why invite-only?** The dashboard only has value for real facility owners. Open registration would let anyone create empty accounts, pollute marketplace data, and undermine player trust. Lima has ~30-50 padel facilities — this is a finite, targetable market where direct onboarding is both feasible and preferable.

**Three entry points (phased):**

1. **MVP (this task):** You (Luis) create the Org → invite the owner via email → they click invite link → create account → land in pre-configured org
2. **Post-MVP:** Public "Solicitar Acceso" form → you review → trigger invite (landing page form already built)
3. **Scale:** Open registration with facilities starting in "pending review" state

**Auth stack:** Better-Auth (email/password + Google OAuth), session-based, cookies

---

## Prerequisites

- Better-Auth configured with email + Google providers ✅
- `organizations` and `organization_members` tables exist ✅
- Google OAuth credentials created (GCP project `PadelHub`, client ID for `app.padelhub.pe` + `localhost:3000`) ✅
- `organization_invites` table — **needs to be created if not already in schema**

---

## Database: `organization_invites` Table

If this table doesn't exist yet, create it:

```tsx
export const organizationInvites = pgTable('organization_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: orgRoleEnum('role').notNull(),
  facilityIds: jsonb('facility_ids'), // For facility-scoped roles
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  acceptedAt: timestamp('accepted_at'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | accepted | expired | cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueOrgEmail: unique().on(table.organizationId, table.email),
}));
```

**Token generation:** Use `crypto.randomUUID()` or a secure random string (32+ chars).

**Expiration:** 7 days from creation.

---

## Sub-flows: Detailed Specifications

---

### 1.1 Login (Email/Password)

**Route:** `/login`

**Priority:** P0

**Current state:** UI exists, needs testing and hardening

#### Behavior

1. User visits `/login`
2. Enters email + password
3. Clicks "Iniciar Sesión"
4. Better-Auth validates credentials
5. On success → create session → redirect to `/org` (which resolves to first org)
6. On failure → show inline error, don't clear password field

#### Acceptance Criteria

- [x]  Valid email + password → redirects to `/org/[slug]/facilities`
- [x]  Invalid password → shows "Email o contraseña incorrectos" (don't reveal which is wrong)
- [x]  Non-existent email → shows same generic error (don't leak whether email exists)
- [x]  Empty fields → show field-level validation before submitting
- [x]  Email format validation (client-side)
- [x]  Password minimum 8 characters (client-side)
- [x]  "Remember me" checkbox extends session to 30 days (default 24h)
- [x]  Loading state on button while request is in-flight
- [x]  Disabled button during submission (prevent double-submit)
- [x]  If user is already authenticated → redirect to `/org` immediately
- [ ]  Rate limiting: lock after 5 failed attempts for 15 minutes (Better-Auth config)

#### Error States

| Condition | Message | Behavior |
| --- | --- | --- |
| Wrong credentials | "Email o contraseña incorrectos" | Red alert above form, fields preserved |
| Account locked | "Cuenta bloqueada temporalmente. Intenta en 15 minutos." | Disable submit button |
| Network error | "Error de conexión. Verifica tu internet e intenta de nuevo." | Red alert, allow retry |
| Server error (500) | "Algo salió mal. Intenta de nuevo." | Red alert, allow retry |

---

### 1.2 Login (Google OAuth)

**Route:** `/login` → Google popup → callback

**Priority:** P0

#### Behavior

1. User clicks "Continuar con Google"
2. Better-Auth redirects to Google OAuth consent screen
3. User authenticates with Google
4. Callback to `/api/auth/callback/google`
5. Better-Auth either matches existing user by email or creates a new user
6. On success → create session → redirect to `/org`
7. If user has no org membership → redirect to dead-end page (see 1.8)

#### Acceptance Criteria

- [x]  Click "Continuar con Google" → opens Google OAuth flow
- [x]  Google account with matching email in `users` table → login succeeds, redirect to `/org`
- [x]  Google account with email NOT in `users` table → creates user, but has no org → dead-end page
- [ ]  Google account with email matching a pending invite → user created, but invite NOT auto-accepted (they need to go through invite link)
- [ ]  OAuth consent screen shows "PadelHub" as app name with `support@padelhub.pe` as support email
- [ ]  Loading state while OAuth flow is in progress
- [ ]  User cancels Google popup → returns to login page, no error (or subtle message)
- [ ]  Better-Auth `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are set correctly for both `localhost:3000` and `app.padelhub.pe`
- [ ]  Redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google` (dev) and `https://app.padelhub.pe/api/auth/callback/google` (prod)

---

### 1.3 Invite Acceptance → Account Creation

**Route:** `/register?token=xxx`

**Priority:** P0 — This is the primary onboarding path for MVP

#### Behavior

1. Org admin (Luis) sends invite via dashboard (Flow 3.2 — separate task)
2. Facility owner receives email with link: `https://app.padelhub.pe/register?token=abc123`
3. Page loads → validates token via API
4. If valid → show registration form with email pre-filled and **read-only**
5. User fills in: display name, password, confirm password
6. Clicks "Crear Cuenta"
7. Backend: create user → accept invite → add to `organization_members` with invite's role/facility scope
8. Auto-login → redirect to `/org/[slug]/facilities`

#### Acceptance Criteria

- [x]  `/register` without `?token` → show message: "Necesitas una invitación para crear una cuenta. Contacta al administrador de tu organización."
- [x]  Valid token → email field pre-filled and disabled (read-only)
- [x]  Token's organization name shown: "Has sido invitado a [Org Name]"
- [x]  Role shown in invite context: "como Administrador" / "como Manager de [Facility Name]"
- [x]  Display name field: required, 2-100 chars
- [x]  Password field: required, min 8 chars
- [x]  Confirm password field: must match password
- [x]  On submit: user created, invite status set to `accepted`, `acceptedAt` timestamp set
- [x]  User added to `organization_members` with role and facility_ids from invite
- [x]  Auto-login after account creation (no need to go to `/login`)
- [x]  Redirect to `/org/[orgSlug]/facilities` after creation
- [x]  If user with that email already exists → show: "Ya existe una cuenta con este email. Inicia sesión para aceptar la invitación." with link to `/login`
- [ ]  After login, if user has a pending invite for their email, prompt them to accept it

#### API Endpoint

```tsx
// POST /api/auth/accept-invite
// or tRPC: invite.accept.mutate({ token, displayName, password })
{
  token: string;       // from URL
  displayName: string; // user input
  password: string;    // user input
}
// Response: { success: true, redirectTo: '/org/onepadel/facilities' }
```

---

### 1.4 Invite Token Validation

**Route:** `/register?token=xxx` (page load)

**Priority:** P0

#### Acceptance Criteria

- [x]  Valid token → show registration form
- [x]  Expired token (>7 days) → show: "Esta invitación ha expirado. Pide al administrador que envíe una nueva."
- [x]  Already-used token (`status: accepted`) → show: "Esta invitación ya fue utilizada. Si ya tienes cuenta, inicia sesión."
- [ ]  Cancelled token → show: "Esta invitación fue cancelada."
- [ ]  Invalid/malformed token → show: "Invitación no válida."
- [ ]  All error states show a link to `/login`
- [ ]  Token validation happens server-side (API call on page load), not client-side
- [ ]  Loading skeleton while token is being validated

#### API Endpoint

```tsx
// GET /api/invite/validate?token=xxx
// or tRPC: invite.validate.query({ token })
// Response:
{
  valid: boolean;
  error?: 'expired' | 'used' | 'cancelled' | 'invalid';
  invite?: {
    email: string;
    organizationName: string;
    role: 'org_admin' | 'facility_manager' | 'staff';
    facilityNames?: string[]; // if facility-scoped
  }
}
```

---

### 1.5 Forgot Password

**Route:** `/forgot-password`

**Priority:** P1 (not blocking MVP launch, but needed before real users)

**Current state:** 🐛 Link exists on login page, page not built

#### Behavior

1. User clicks "¿Olvidaste tu contraseña?" on login page
2. Enters email → clicks "Enviar enlace"
3. Better-Auth sends password reset email (via Resend, set up in infra step 8)
4. User clicks link → lands on `/reset-password?token=xxx`
5. Enters new password + confirm → submits
6. Password updated → redirect to `/login` with success message

#### Acceptance Criteria

- [ ]  `/forgot-password` page with email input
- [ ]  Submit → always show "Si existe una cuenta con ese email, recibirás un enlace." (don't reveal if email exists)
- [ ]  Password reset email sent via Better-Auth's built-in flow
- [ ]  Reset link valid for 1 hour
- [ ]  `/reset-password?token=xxx` page with new password + confirm fields
- [ ]  Invalid/expired token → "Este enlace ha expirado. Solicita uno nuevo."
- [ ]  Successful reset → redirect to `/login` with toast: "Contraseña actualizada. Inicia sesión."
- [ ]  **Dependency:** Requires Resend integration (Infra step 8). Can stub with console.log for now

---

### 1.6 Session Persistence

**Priority:** P0

#### Acceptance Criteria

- [ ]  After login, refreshing the page keeps user authenticated
- [ ]  Closing browser tab and reopening maintains session (within session duration)
- [ ]  Default session: 24 hours
- [ ]  "Remember me" session: 30 days
- [ ]  Expired session → redirect to `/login` (not a hard error)
- [ ]  Session cookie is `httpOnly`, `secure` (in production), `sameSite: lax`
- [ ]  After session expires, any API call returns 401 → middleware catches and redirects to `/login`
- [ ]  Multiple tabs: logging out in one tab logs out all tabs (optional: via BroadcastChannel or storage event)

---

### 1.7 Org Membership Validation

**Route:** `/org/[orgSlug]/*` layout

**Priority:** P0

#### Behavior

Every page under `/org/[orgSlug]/` must verify the authenticated user is a member of that organization.

#### Acceptance Criteria

- [ ]  Authenticated user who is a member of the org → page loads normally
- [ ]  Authenticated user who is NOT a member → redirect to `/org` (which resolves to their actual org, or dead-end if none)
- [ ]  Org slug doesn't exist → 404 page
- [ ]  Org is inactive (`is_active: false`) → show "Esta organización está desactivada"
- [ ]  Validation happens in the layout component (server-side in Next.js App Router)
- [ ]  User's role and facility scope are loaded into React context for child components to consume

#### Implementation Notes

```tsx
// app/(dashboard)/org/[orgSlug]/layout.tsx
export default async function OrgLayout({ params, children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, session.user.id),
      // join with org to match slug
    )
  });
  
  if (!membership) redirect('/org'); // or dead-end
  
  return (
    <OrgContext.Provider value={{ org, membership, role: membership.role }}>
      {children}
    </OrgContext.Provider>
  );
}
```

---

### 1.8 Redirect Unauthorized Users

**Priority:** P0

#### Acceptance Criteria

- [ ]  Unauthenticated user visits any `/org/*` route → redirect to `/login`
- [ ]  Authenticated user with **no org memberships** → show dead-end page: "Tu cuenta aún no está vinculada a ninguna organización. Si recibiste una invitación, revisa tu email. Si necesitas ayuda, escríbenos a [support@padelhub.pe](mailto:support@padelhub.pe)"
- [ ]  Authenticated user visits `/org` → redirect to `/org/[firstOrgSlug]/facilities`
- [ ]  Authenticated user visits `/` (root of dashboard) → redirect to `/org`
- [ ]  Dead-end page includes: message, check email CTA, support email link, logout button
- [ ]  Middleware handles auth check globally (Next.js middleware.ts)

#### Middleware Logic

```tsx
// middleware.ts
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isPublicRoute) return NextResponse.next();
  
  const session = getSessionFromCookie(request);
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

### 1.9 Remove Public Signup Link from Login

**Route:** `/login`

**Priority:** P0 — Quick win

#### Acceptance Criteria

- [ ]  Remove the "¿No tienes cuenta? Registrarse" link from the login page
- [ ]  Optionally replace with: "¿Eres dueño de un local de pádel?" → link to `padelhub.pe` landing page (Solicitar Acceso)
- [ ]  `/register` without a valid token shows the "need invitation" message (see 1.3)
- [ ]  Direct navigation to `/register` doesn't bypass the invite requirement

---

### 1.10 Google OAuth on Invite Acceptance

**Route:** `/register?token=xxx`

**Priority:** P1

#### Behavior

During invite acceptance, user can choose to create account via Google instead of email/password.

1. User lands on `/register?token=xxx` with valid invite
2. Instead of filling password, clicks "Continuar con Google"
3. Google OAuth flow completes
4. Backend: validate Google email matches invite email
5. Create user with Google provider → accept invite → add to org
6. Auto-login → redirect to org

#### Acceptance Criteria

- [ ]  "Continuar con Google" button appears on invite acceptance page alongside password form
- [ ]  Google email **must match** the invite email exactly → if mismatch, show: "El email de Google no coincide con la invitación. Usa la cuenta de Google asociada a [[invite.email](http://invite.email)]."
- [ ]  Successful Google auth + email match → user created, invite accepted, org membership added
- [ ]  User who already has a Google-linked account with matching email → log them in, accept invite, add to org
- [ ]  State preservation: the invite token must survive the OAuth redirect (pass via `state` parameter or session storage)

---

## Implementation Order

Recommended sequence to minimize blocking and enable incremental testing:

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | 1.9 — Remove public signup | 5-minute quick win, sets the right mental model | 15 min |
| 2 | 1.1 — Login (email/password) | Foundation. Test and harden what exists | 2-3h |
| 3 | 1.2 — Login (Google OAuth) | Second auth method, test with new GCP credentials | 2-3h |
| 4 | 1.6 — Session persistence | Must work before testing protected routes | 1-2h |
| 5 | 1.8 — Redirect unauthorized | Middleware + dead-end page. Unlocks protected route testing | 2-3h |
| 6 | 1.7 — Org membership validation | Layout-level check. Depends on 1.8 working | 2-3h |
| 7 | 1.4 — Token validation | API endpoint needed before invite UI | 2h |
| 8 | 1.3 — Invite acceptance | The core invite flow. Depends on token validation | 4-6h |
| 9 | 1.10 — Google OAuth on invite | Enhancement to invite flow | 2-3h |
| 10 | 1.5 — Forgot password | Depends on Resend integration (Infra step 8). Can stub | 3-4h |

**Total estimate:** ~20-30 hours

---

## Files to Touch

```
apps/dashboard/
├── middleware.ts                          # Auth middleware (1.8)
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                 # 1.1, 1.2, 1.9
│   │   ├── register/page.tsx              # 1.3, 1.4, 1.10
│   │   ├── forgot-password/page.tsx       # 1.5 (new)
│   │   └── reset-password/page.tsx        # 1.5 (new)
│   ├── (dashboard)/
│   │   └── org/
│   │       ├── page.tsx                   # Redirect to first org (1.8)
│   │       └── [orgSlug]/
│   │           └── layout.tsx             # Org membership check (1.7)
│   └── no-organization/page.tsx           # Dead-end page (1.8, new)

packages/
├── api/src/router/
│   └── invite.ts                          # invite.validate, invite.accept (new)
├── db/src/schema/
│   └── organization-invites.ts            # New table (if not exists)
└── auth/
    └── index.ts                           # Better-Auth config, session config (1.6)
```

---

## Testing Checklist

After implementing, verify these end-to-end scenarios:

- [ ]  **Happy path (email):** Receive invite → click link → create account with password → land in org dashboard → see correct facilities
- [ ]  **Happy path (Google):** Receive invite → click link → choose Google → land in org dashboard
- [ ]  **Login existing user:** User with account logs in via email → sees their org
- [ ]  **Login existing user (Google):** User with Google account logs in → sees their org
- [ ]  **Expired invite:** Click old invite link → see expiry message → contact admin
- [ ]  **No org user:** User logs in but has no org membership → dead-end page
- [ ]  **Wrong org URL:** User manually types a different org slug → redirect away
- [ ]  **Session refresh:** Login → close tab → reopen → still authenticated
- [ ]  **Session expiry:** Wait for session timeout → next action redirects to login
- [ ]  **Forgot password:** Request reset → receive email → set new password → login works
- [ ]  **Public routes accessible:** `/login`, `/register?token=x`, `/forgot-password` all load without auth
- [ ]  **Protected routes guarded:** `/org/*` redirects to `/login` when unauthenticated

---

## Dependencies & Blockers

| Dependency | Status | Impact |
| --- | --- | --- |
| Better-Auth configured | ✅ Done | Core auth provider |
| Google OAuth credentials (GCP) | ✅ Done | Needed for 1.2 and 1.10 |
| `organization_invites` table | 🔲 Needs migration | Blocks 1.3, 1.4, 1.10 |
| Resend (transactional email) | 🔲 Infra step 8 | Blocks 1.5 (forgot password email). Can stub with console.log |
| Dashboard deployed to `app.padelhub.pe` | 🔲 Infra step 6 | Needed for production OAuth testing. Dev works on [localhost](http://localhost) |
| Invite sending UI (Flow 3.2) | 🔲 Separate task | For MVP, can create invites manually via Drizzle Studio or seed script |

---

## Environment Variables Required

```bash
# .env.local (development)
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
DATABASE_URL=postgresql://...

# Vercel (production) — same keys, production values
BETTER_AUTH_URL=https://app.padelhub.pe
```

---

## Definition of Done

- [ ]  All 10 sub-flows have acceptance criteria met
- [ ]  No public signup path exists
- [ ]  Invite-only flow works end-to-end (create invite in DB → accept → login → see org)
- [ ]  Protected routes are inaccessible without auth
- [ ]  Org membership is validated on every org page
- [ ]  Session persists across page refreshes and tab closes
- [ ]  Error states are user-friendly and in Spanish
- [ ]  No console errors in browser during any flow
- [ ]  Works on Chrome, Safari, Firefox (latest)
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows