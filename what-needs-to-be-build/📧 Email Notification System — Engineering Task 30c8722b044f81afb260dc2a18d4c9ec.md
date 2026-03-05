# 📧 Email Notification System — Engineering Task

Build the shared email infrastructure that all dashboard flows depend on. This is a **cross-cutting foundation** — auth invites, password resets, booking notifications, and access requests all route through this system.

---

## Context

**Why before Flow 1?** The invite-only auth flow (Flow 1.3) literally cannot work without sending emails. Password reset (Flow 1.5) also depends on it. Rather than stubbing email and retrofitting later, we build the real thing first so every downstream flow gets email for free.

**Where email is needed across the dashboard:**

| Flow | Email | Priority |
| --- | --- | --- |
| Flow 1: Auth | Organization invite | P0 — MVP blocker |
| Flow 1: Auth | Password reset | P0 |
| Flow 3: Team | Member invited to org | P0 |
| Flow 3: Team | Role changed notification | P1 |
| Flow 7: Bookings | Booking confirmation | P1 |
| Flow 7: Bookings | Booking cancellation | P1 |
| Flow 7: Bookings | Booking reminder (24h before) | P2 |
| Landing Page | Access request received confirmation | P1 |
| Landing Page | Access request approved (triggers invite) | P1 |

**This task covers:** The shared infrastructure + the 2 templates needed for Flow 1 (invite + password reset). Other templates will be added in their respective flow tasks.

---

## Infrastructure (Already Done ✅)

- Resend account created with `luis@padelhub.pe`
- `padelhub.pe` domain verified in Resend
- DNS records configured in Cloudflare (DKIM + SPF merged with Google Workspace)
- Resend API key available

---

## Architecture Decision: React Email + Resend

**Why React Email?**

- Write email templates as React components — same language as the rest of the stack
- Hot reload preview during development (`email dev` command)
- Type-safe props for each template
- Renders to cross-client compatible HTML
- First-class Resend integration
- Active open-source project by the Resend team

**Why a shared `packages/email` package?**

- Both the dashboard (`apps/dashboard`) and the landing page (`apps/landing`) need to send emails
- tRPC routers in `packages/api` trigger emails from server-side mutations
- Centralized templates, shared styles, one Resend client

---

## Package Structure

```
packages/email/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Public API — export send functions
│   ├── client.ts                   # Resend client singleton
│   ├── config.ts                   # Sender defaults, base URL
│   ├── send.ts                     # Generic send wrapper with error handling
│   ├── templates/
│   │   ├── components/             # Shared email components
│   │   │   ├── Header.tsx          # PadelHub logo + brand header
│   │   │   ├── Footer.tsx          # Unsubscribe link, address, social
│   │   │   ├── Button.tsx          # CTA button (branded)
│   │   │   └── Layout.tsx          # Base layout wrapping all emails
│   │   ├── OrganizationInvite.tsx  # Invite to join org (Flow 1.3)
│   │   ├── PasswordReset.tsx       # Reset password link (Flow 1.5)
│   │   ├── WelcomeToOrg.tsx        # Post-invite acceptance welcome (optional)
│   │   └── ... (future templates)
│   └── types.ts                    # Shared types for template props
```

---

## Implementation Details

### 1. Package Setup

**Priority:** P0

**Estimate:** 1h

#### Steps

- [ ]  Create `packages/email` directory
- [ ]  Initialize `package.json` with dependencies:

```json
{
  "name": "@padelhub/email",
  "private": true,
  "dependencies": {
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.30",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "react-email": "^3.0.0"
  },
  "scripts": {
    "dev": "email dev --port 3333",
    "build": "tsc"
  }
}
```

- [ ]  Add `tsconfig.json` extending the monorepo base config
- [ ]  Add `@padelhub/email` as workspace dependency in `packages/api/package.json`
- [ ]  Verify `pnpm install` resolves cleanly

#### Acceptance Criteria

- [ ]  Package exists and builds without errors
- [ ]  Can be imported from `packages/api` as `@padelhub/email`
- [ ]  `pnpm --filter @padelhub/email dev` starts the React Email preview server on port 3333

---

### 2. Resend Client & Send Utility

**Priority:** P0

**Estimate:** 1h

#### `client.ts` — Resend Singleton

```tsx
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
```

#### `config.ts` — Shared Configuration

```tsx
export const emailConfig = {
  from: {
    noreply: 'PadelHub <no-reply@padelhub.pe>',
    support: 'PadelHub <support@padelhub.pe>',
  },
  replyTo: 'support@padelhub.pe',
  baseUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
} as const;
```

#### `send.ts` — Generic Send Wrapper

```tsx
import { resend } from './client';
import { emailConfig } from './config';

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export async function sendEmail({
  to,
  subject,
  react,
  from = emailConfig.from.noreply,
  replyTo = emailConfig.replyTo,
  tags,
}: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
      tags,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(`[Email] Sent to ${to}: ${subject} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    // Don't throw in production — email failures shouldn't crash the app
    // Log to error tracking (Sentry) when available
    return { success: false, error: err };
  }
}
```

#### Acceptance Criteria

- [ ]  `sendEmail()` sends an email via Resend and returns `{ success: true, id }`
- [ ]  Failed sends are caught and logged, not thrown (non-blocking)
- [ ]  Missing `RESEND_API_KEY` throws at startup, not at send time
- [ ]  Default `from` is `PadelHub <no-reply@padelhub.pe>`
- [ ]  Default `replyTo` is `support@padelhub.pe`
- [ ]  Tags support for Resend analytics (e.g., `{ name: 'category', value: 'invite' }`)

---

### 3. Shared Email Components

**Priority:** P0

**Estimate:** 2-3h

Reusable building blocks for all email templates. These ensure brand consistency across every email PadelHub sends.

#### `Layout.tsx` — Base Layout

```tsx
import {
  Body, Container, Head, Html, Preview, Tailwind,
} from '@react-email/components';

type LayoutProps = {
  preview: string;   // Gmail preview text
  children: React.ReactNode;
};

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] py-8">
            <Header />
            {children}
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

#### `Header.tsx` — Brand Header

- PadelHub logo (hosted on a public URL or inline SVG)
- Consistent across all emails
- **Note:** Until brand assets are finalized (Infra step 9), use the text wordmark "PadelHub" in blue `#3B82F6`

#### `Footer.tsx` — Email Footer

- "PadelHub — La plataforma de pádel de Lima"
- Link to `padelhub.pe`
- `support@padelhub.pe` contact
- "Este email fue enviado a {recipientEmail}"
- Unsubscribe link (required for CAN-SPAM, even for transactional — can link to email preferences page)

#### `Button.tsx` — CTA Button

- Primary blue `#3B82F6` background, white text
- Rounded corners, proper padding
- Works in all email clients (table-based fallback via React Email)
- Takes `href` and `children` props

#### Acceptance Criteria

- [ ]  All components render correctly in React Email preview (`pnpm --filter @padelhub/email dev`)
- [ ]  Layout wraps every template with consistent header/footer
- [ ]  Footer includes [padelhub.pe](http://padelhub.pe) link and support email
- [ ]  Button renders as a clickable link in Gmail, Outlook, Apple Mail
- [ ]  Brand colors match design system (`#3B82F6` primary, `#0F172A` text)
- [ ]  Emails are responsive (readable on mobile)
- [ ]  Preview text (Gmail snippet) is configurable per template

---

### 4. Template: Organization Invite

**Priority:** P0 — Blocks Flow 1.3

**Estimate:** 2h

#### Props

```tsx
type OrganizationInviteProps = {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  role: 'org_admin' | 'facility_manager' | 'staff';
  facilityNames?: string[];  // If facility-scoped
  inviteUrl: string;         // https://app.padelhub.pe/register?token=xxx
  expiresInDays: number;     // Typically 7
};
```

#### Email Content (Spanish)

**Subject:** `{inviterName} te invitó a {organizationName} en PadelHub`

**Preview text:** `Únete a {organizationName} en PadelHub para gestionar tus canchas de pádel.`

**Body:**

```
[PadelHub Logo]

Hola,

{inviterName} te ha invitado a unirte a {organizationName} en PadelHub 
como {roleLabel}.

[If facility-scoped:]
Tendrás acceso a: {facilityNames.join(', ')}

[Aceptar Invitación →]  (button → inviteUrl)

Esta invitación expira en {expiresInDays} días.
Si no esperabas este email, puedes ignorarlo.

---
[Footer]
```

#### Role Labels (Spanish)

| Role | Label |
| --- | --- |
| `org_admin` | Administrador |
| `facility_manager` | Manager de Local |
| `staff` | Staff |

#### Acceptance Criteria

- [ ]  Renders correctly in React Email preview with sample props
- [ ]  Subject line includes inviter name and org name
- [ ]  CTA button links to `inviteUrl` (the `/register?token=xxx` URL)
- [ ]  Shows role in human-readable Spanish
- [ ]  Shows facility names if role is facility-scoped
- [ ]  Shows expiration notice
- [ ]  Responsive on mobile
- [ ]  Tested in Gmail (web), Gmail (mobile), Outlook, Apple Mail

---

### 5. Template: Password Reset

**Priority:** P0 — Blocks Flow 1.5

**Estimate:** 1.5h

#### Props

```tsx
type PasswordResetProps = {
  userEmail: string;
  resetUrl: string;     // https://app.padelhub.pe/reset-password?token=xxx
  expiresInMinutes: number;  // Typically 60
};
```

#### Email Content (Spanish)

**Subject:** `Restablece tu contraseña de PadelHub`

**Preview text:** `Solicitaste restablecer tu contraseña en PadelHub.`

**Body:**

```
[PadelHub Logo]

Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta 
en PadelHub asociada a {userEmail}.

[Restablecer Contraseña →]  (button → resetUrl)

Este enlace expira en {expiresInMinutes} minutos.

Si no solicitaste este cambio, puedes ignorar este email. 
Tu contraseña no será modificada.

---
[Footer]
```

#### Acceptance Criteria

- [ ]  Renders correctly in React Email preview
- [ ]  CTA button links to `resetUrl`
- [ ]  Shows expiration time
- [ ]  Security notice: "Si no solicitaste este cambio, puedes ignorar este email"
- [ ]  Doesn't reveal whether the email exists in the system (that's handled by the API, not the template)
- [ ]  Responsive on mobile

---

### 6. Public API (`index.ts`)

**Priority:** P0

**Estimate:** 1h

Clean exports so consuming code (tRPC routers, API routes) doesn't import internals.

#### `index.ts`

```tsx
import { sendEmail } from './send';
import { emailConfig } from './config';
import { OrganizationInvite } from './templates/OrganizationInvite';
import { PasswordReset } from './templates/PasswordReset';

// High-level send functions — these are what tRPC routers call

export async function sendOrganizationInvite(params: {
  to: string;
  organizationName: string;
  inviterName: string;
  role: 'org_admin' | 'facility_manager' | 'staff';
  facilityNames?: string[];
  inviteToken: string;
}) {
  const inviteUrl = `${emailConfig.baseUrl}/register?token=${params.inviteToken}`;

  return sendEmail({
    to: params.to,
    subject: `${params.inviterName} te invitó a ${params.organizationName} en PadelHub`,
    react: OrganizationInvite({
      inviteeEmail: params.to,
      organizationName: params.organizationName,
      inviterName: params.inviterName,
      role: params.role,
      facilityNames: params.facilityNames,
      inviteUrl,
      expiresInDays: 7,
    }),
    tags: [{ name: 'category', value: 'invite' }],
  });
}

export async function sendPasswordReset(params: {
  to: string;
  resetToken: string;
}) {
  const resetUrl = `${emailConfig.baseUrl}/reset-password?token=${params.resetToken}`;

  return sendEmail({
    to: params.to,
    subject: 'Restablece tu contraseña de PadelHub',
    react: PasswordReset({
      userEmail: params.to,
      resetUrl,
      expiresInMinutes: 60,
    }),
    tags: [{ name: 'category', value: 'password-reset' }],
  });
}

// Re-export for custom usage
export { sendEmail } from './send';
export { emailConfig } from './config';
```

#### Usage from tRPC Router

```tsx
// packages/api/src/router/invite.ts
import { sendOrganizationInvite } from '@padelhub/email';

export const inviteRouter = router({
  send: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum([...]) }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create invite in DB
      const invite = await db.insert(organizationInvites).values({ ... });
      
      // 2. Send email
      await sendOrganizationInvite({
        to: input.email,
        organizationName: ctx.org.name,
        inviterName: ctx.user.displayName,
        role: input.role,
        inviteToken: invite.token,
      });

      return { success: true };
    }),
});
```

#### Acceptance Criteria

- [ ]  `sendOrganizationInvite()` can be called from any tRPC router with simple params
- [ ]  `sendPasswordReset()` can be called from Better-Auth's password reset hook
- [ ]  Consumers don't need to know about Resend, React Email, or template internals
- [ ]  `baseUrl` is configurable via `BETTER_AUTH_URL` env var (works in dev and prod)
- [ ]  URL construction for invite and reset links is centralized (not scattered across routers)

---

### 7. Environment Variables & Vercel Config

**Priority:** P0

**Estimate:** 15 min

#### Required

```bash
# .env.local (development)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Already set (used by email config):
BETTER_AUTH_URL=http://localhost:3000
```

#### Acceptance Criteria

- [ ]  `RESEND_API_KEY` added to `.env.local` for development
- [ ]  `RESEND_API_KEY` added to Vercel environment variables (production + preview)
- [ ]  `.env.example` updated with `RESEND_API_KEY=` placeholder
- [ ]  Missing API key throws clear error at startup

---

## Implementation Order

| Order | Task | Estimate | Blocks |
| --- | --- | --- | --- |
| 1 | Package setup (`packages/email`) | 1h | Everything |
| 2 | Resend client + send utility | 1h | All sends |
| 3 | Shared components (Layout, Header, Footer, Button) | 2-3h | All templates |
| 4 | Organization Invite template | 2h | Flow 1.3 |
| 5 | Password Reset template | 1.5h | Flow 1.5 |
| 6 | Public API (index.ts exports) | 1h | tRPC integration |
| 7 | Env vars + Vercel config | 15 min | Production sends |

**Total estimate:** ~9-10 hours

---

## Files to Create

```
packages/email/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── config.ts
│   ├── send.ts
│   ├── types.ts
│   └── templates/
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── Button.tsx
│       │   └── Layout.tsx
│       ├── OrganizationInvite.tsx
│       └── PasswordReset.tsx
```

**Files to modify:**

```
packages/api/package.json        # Add @padelhub/email dependency
apps/dashboard/.env.local         # Add RESEND_API_KEY
apps/dashboard/.env.example       # Add RESEND_API_KEY placeholder
pnpm-workspace.yaml               # Verify packages/email is included
```

---

## Testing Plan

### Development Testing

- [ ]  `pnpm --filter @padelhub/email dev` → React Email preview opens on `localhost:3333`
- [ ]  Both templates render with sample data in preview
- [ ]  Templates look correct on different viewport widths (desktop + mobile simulation)

### Send Testing

- [ ]  Send test Organization Invite to personal Gmail → arrives in inbox (not spam)
- [ ]  Send test Password Reset to personal Gmail → arrives in inbox
- [ ]  CTA buttons are clickable and link to correct URLs
- [ ]  Emails render correctly in: Gmail (web), Gmail (Android), Gmail (iOS), Outlook (web), Apple Mail
- [ ]  `from` shows "PadelHub" as sender name
- [ ]  `reply-to` is `support@padelhub.pe`

### Deliverability Testing

- [ ]  Send test email from `no-reply@padelhub.pe` via Resend
- [ ]  Check [mail-tester.com](http://mail-tester.com) score — aim for 9+/10
- [ ]  Verify SPF, DKIM, and DMARC pass (check email headers in Gmail: Show original)
- [ ]  Confirm Resend SPF include is merged with Google Workspace SPF (single TXT record)

---

## Future Templates (Not in This Task)

These will be added in their respective flow tasks:

| Template | Flow | When |
| --- | --- | --- |
| Welcome to Organization | Flow 1 | After invite acceptance (optional) |
| Role Changed | Flow 3 | When team management is built |
| Member Removed | Flow 3 | When team management is built |
| Booking Confirmation | Flow 7 | When bookings are live |
| Booking Cancelled | Flow 7 | When bookings are live |
| Booking Reminder (24h) | Flow 7 | Post-MVP |
| Access Request Received | Landing | When request access form is wired |
| Access Request Approved | Landing | When admin review flow exists |

Each new template follows the same pattern: create component in `templates/`, add high-level send function in `index.ts`, call from the relevant tRPC router.

---

## Definition of Done

- [ ]  `packages/email` exists as a workspace package
- [ ]  React Email preview works locally with both templates
- [ ]  `sendOrganizationInvite()` and `sendPasswordReset()` exported and callable from `@padelhub/email`
- [ ]  Test email sent to personal Gmail arrives in inbox with correct formatting
- [ ]  [mail-tester.com](http://mail-tester.com) score of 9+/10
- [ ]  `RESEND_API_KEY` configured in both `.env.local` and Vercel
- [ ]  All shared components (Layout, Header, Footer, Button) use PadelHub brand colors
- [ ]  All email copy is in Spanish
- [ ]  Flow 1 task updated to mark email as a completed dependency