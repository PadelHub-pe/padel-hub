# Tasks

## Current: Dual OTP Channel (Email + WhatsApp) with Feature Flag

**Goal**: Add email as an alternative OTP delivery channel alongside WhatsApp, controlled by an env var flag. When WhatsApp is unavailable (Meta Business verification pending), email OTP is used. Switching back to WhatsApp is a one-line env change.

**Context**: WhatsApp OTP via Kapso requires Meta Business verification (pending). The OTP infrastructure (store, rate limiting, verification tokens) is already channel-agnostic — only the delivery mechanism and UI labels are WhatsApp-specific.

---

### TASK-43: Add OTP channel config and email OTP sender

**Type**: feat
**Scope**: `packages/api`, `packages/email`
**Files**: ~4

1. **Add env flag** in `packages/api/src/env.ts` (or a shared config):
   - `OTP_CHANNEL` — `"whatsapp" | "email"`, default `"email"` (safe default while WhatsApp is pending)

2. **Create email OTP template** (`packages/email/src/templates/OtpVerification.tsx`):
   - Simple React Email template: "Tu código de verificación es: **{code}**"
   - 10-minute expiration note
   - PadelHub branding (reuse existing email layout patterns)

3. **Create email OTP sender** (`packages/email/src/senders/otp-verification.ts`):
   - `sendOtpEmail({ email, code })` — follows existing sender pattern (see `password-reset.ts`)
   - Export from `@wifo/email` barrel

4. **Create OTP dispatcher** (`packages/api/src/lib/otp-dispatcher.ts`):
   - `sendOtpToUser(identifier, code)` — reads `OTP_CHANNEL` env, routes to WhatsApp `sendOtp` or email `sendOtpEmail`
   - Single import point for the router

**Tests**: Unit test the dispatcher routing logic (mock both senders).

---

### TASK-44: Update public-booking router for dual-channel OTP

**Type**: feat
**Scope**: `packages/api`
**Depends on**: TASK-43
**Files**: ~3

1. **Update input schemas** in `public-booking.ts`:
   - `sendOtpSchema`: change `phone` to `identifier` (or add `email` field alongside `phone`)
   - Better: keep both fields optional, require exactly one based on channel config
   - Simplest approach: `identifier: z.string()` + validate format based on `OTP_CHANNEL`

2. **Update `sendOtp` procedure**:
   - Use `sendOtpToUser()` dispatcher instead of direct WhatsApp `sendOtp()`
   - Rate limit key remains the identifier (phone or email)
   - `expiresInSeconds` stays the same (600s)

3. **Update `verifyOtp` procedure**:
   - Same logic, just accept `identifier` instead of `phone`

4. **Update `createBooking` procedure**:
   - `requireVerifiedPhone` → `requireVerifiedIdentifier` (token still works — it signs any string)
   - Store in `customerPhone` if WhatsApp, or `customerEmail` if email (note: `customerEmail` column may need adding — check schema)

5. **Update verification token** (`verification-token.ts`):
   - Already generic — `createVerificationToken(phone)` works with any string. Just rename param to `identifier` for clarity.

**Tests**: Update existing `public-booking-otp.test.ts` and `verification-token.test.ts`.

---

### TASK-45: Update bookings UI for dual-channel OTP

**Type**: feat
**Scope**: `apps/bookings`
**Depends on**: TASK-44
**Files**: ~3

1. **Update `confirm-page.tsx`**:
   - Read OTP channel from a public env var (`NEXT_PUBLIC_OTP_CHANNEL`)
   - If `"email"`: show email input instead of phone input, update label from "Teléfono (WhatsApp)" to "Correo electrónico"
   - Update helper text from "Te enviaremos un código de verificación por WhatsApp" to "Te enviaremos un código de verificación por correo electrónico"
   - Update "Cambiar número" button text to "Cambiar correo"
   - Send `identifier` (email or phone) to `sendOtp` mutation

2. **Update `mis-reservas-page.tsx`**:
   - Same channel-aware input (email vs phone)
   - localStorage key can stay the same (keyed by facilityId)

3. **Add `NEXT_PUBLIC_OTP_CHANNEL`** to `apps/bookings/src/env.ts`

**No structural changes** — same multi-step flow (contact → OTP → confirming), just different input field and labels.

---

### TASK-46: Lint, typecheck, test, and QA

**Type**: chore
**Scope**: all
**Depends on**: TASK-45

- `pnpm lint && pnpm format && pnpm lint:ws`
- `pnpm typecheck`
- `pnpm test` — all 661+ tests pass
- Manual QA: test email OTP flow end-to-end locally
- Verify switching `OTP_CHANNEL=whatsapp` reverts to WhatsApp flow

---

## Previous: Public Bookings Production Readiness ✅

**Goal**: Harden `apps/bookings` (public booking page) for production — bot protection, race conditions, error handling, SEO, and edge cases.

**Context**: Audit across 5 dimensions (security/abuse, API integrity, error handling, SEO, UI edge cases) found 12 actionable items. Verification tokens (HMAC-SHA256), input validation (Zod), security headers, WhatsApp notifications, loading states, and mobile responsiveness are already solid.

---

### TASK-31: Implement Cloudflare Turnstile on booking mutations ✅

**Type**: feat
**Scope**: `apps/bookings`, `packages/api`
**Severity**: CRITICAL

Turnstile env vars (`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) are defined in `src/env.ts` but **never used anywhere**. All public mutations (`sendOtp`, `createBooking`) have zero bot protection.

**Client-side (`apps/bookings`):**
- Install `@marsidev/react-turnstile` (lightweight React wrapper)
- Add invisible Turnstile widget to `confirm-page.tsx` (renders before OTP send)
- Pass `turnstileToken` in `sendOtp` and `createBooking` mutation inputs
- Reset widget on error/retry

**Server-side (`packages/api/src/router/public-booking.ts`):**
- Add `turnstileToken: z.string().min(1)` to `sendOtp` and `createBooking` input schemas
- Create `packages/api/src/lib/turnstile.ts` — validates token against Cloudflare siteverify API
- Call `verifyTurnstileToken(token)` before processing each mutation
- Skip validation if `TURNSTILE_SECRET_KEY` not set (dev mode)

**Tests**: Mock `verifyTurnstileToken` in existing public-booking tests.

---

### TASK-32: Fix double-booking race condition with DB transaction ✅

**Type**: fix
**Scope**: `packages/api/src/router/public-booking.ts`
**Severity**: CRITICAL

The `createBooking` mutation checks for overlapping bookings, then inserts — with no transaction. Two concurrent requests can both pass the overlap check and both insert, creating a double booking.

**Fix:**
- Wrap the overlap check + insert in `ctx.db.transaction(async (tx) => { ... })`
- Use `SELECT ... FOR UPDATE` semantics by querying inside the transaction
- Move the overlap check, price calculation, code generation, and insert all inside the transaction
- If overlap found inside transaction, throw `CONFLICT` error

**Alternative (defense-in-depth):** Add a partial unique index on `bookings(court_id, date, start_time) WHERE status != 'cancelled'` — prevents double-booking even if app logic has bugs. This requires a Drizzle migration.

**Tests**: Add test for concurrent booking attempts (mock DB to simulate race).

---

### TASK-33: Add error boundaries for bookings app ✅

**Type**: fix
**Scope**: `apps/bookings/src/app/`
**Severity**: CRITICAL

No `error.tsx` files exist. Any `useSuspenseQuery` failure (network error, API error) crashes the page with a white screen.

**Create `src/app/error.tsx`:**
- `"use client"` directive
- Spanish error message: "Algo salió mal"
- Description: "Ocurrió un error inesperado. Intenta nuevamente."
- "Reintentar" button calling `reset()`
- "Volver al inicio" link
- Simple, mobile-friendly layout (no heavy dependencies)

**Create `src/app/global-error.tsx`:**
- Catches root layout errors (renders its own `<html>`, `<body>`)
- Minimal UI — no external CSS/fonts
- "Reintentar" button

**Create `src/app/[facilitySlug]/error.tsx`:**
- Facility-specific error boundary
- "Volver" button that navigates to facility root

---

### TASK-34: Fix OTP rate limiter fail-open behavior ✅

**Type**: fix
**Scope**: `packages/api/src/lib/otp-rate-limit.ts`, `packages/api/src/lib/otp-store.ts`
**Severity**: CRITICAL

When Redis is unavailable:
- `checkOtpSendRateLimit()` returns `{ allowed: true }` — all rate limits bypassed silently
- OTP store falls back to in-memory `Map` with no cleanup — memory leak over time

**Fix for `otp-rate-limit.ts`:**
- Log a one-time warning when Redis is unavailable: `console.warn("[OTP] Redis not configured — rate limiting disabled")`
- Use a `didWarn` flag to avoid log spam

**Fix for `otp-store.ts`:**
- Add TTL-based cleanup to the in-memory fallback: on each `storeOtpCode` call, evict expired entries
- Cap the Map size (e.g., 1000 entries) — reject new OTPs if exceeded (fail-closed)
- Log warning when using in-memory fallback

**Tests**: Update `otp-store.test.ts` for eviction behavior.

---

### TASK-35: Add robots.txt and sitemap for bookings app ✅

**Type**: feat
**Scope**: `apps/bookings/src/app/`
**Severity**: HIGH

No SEO files exist. The bookings app is public-facing and should be indexed.

**Create `src/app/robots.ts`:**
```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://bookings.padelhub.pe/sitemap.xml",
  };
}
```

**Create `src/app/sitemap.ts`:**
- Dynamic sitemap — queries all active facilities from DB
- Each facility slug gets an entry: `https://bookings.padelhub.pe/{slug}`
- `changeFrequency: "daily"`, `priority: 0.8`

---

### TASK-36: Re-validate slot availability on confirm page ✅

**Type**: fix
**Scope**: `apps/bookings/src/app/[facilitySlug]/confirm/_components/confirm-page.tsx`
**Severity**: HIGH

User selects a slot on `/book`, navigates to `/confirm`, and the slot could be booked by someone else during that time. The confirm page does NOT re-check availability.

**Fix:**
- After OTP verification succeeds (before calling `createBooking`), call `getAvailableSlots` to verify the selected slot is still available
- If slot is gone, show a clear error: "Este horario ya no está disponible. Selecciona otro."
- Add a "Ver horarios" button that navigates back to `/book`

**Note**: The server-side `createBooking` already checks for overlaps (TASK-32 strengthens this), but the client-side check provides better UX — the user sees a clear message instead of a generic error.

---

### TASK-37: Use crypto for booking code generation ✅

**Type**: fix
**Scope**: `packages/api/src/router/public-booking.ts`
**Severity**: HIGH

`generateBookingCode()` uses `Math.random().toString(36).substring(2, 6)` — predictable and weak entropy. Only ~1.68M combinations per year.

**Fix:**
```typescript
import { randomBytes } from "crypto";

function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString("hex").substring(0, 6).toUpperCase();
  return `PH-${year}-${random}`;
}
```

This gives 16^6 = ~16.7M combinations — 10x improvement with cryptographic randomness.

**Tests**: Existing retry logic tests should still pass. Add test verifying code format.

---

### TASK-38: Remove localhost from production CORS whitelist ✅

**Type**: fix
**Scope**: `apps/bookings/src/app/api/trpc/[trpc]/route.ts`
**Severity**: HIGH

`ALLOWED_ORIGINS` hardcodes `http://localhost:3002` alongside the production origin. This should be environment-aware.

**Fix:**
- Use `process.env.NODE_ENV` to conditionally include localhost
- Production: only `https://bookings.padelhub.pe`
- Development: add `http://localhost:3002`

---

### TASK-39: Tighten phone validation to Peru format ✅

**Type**: fix
**Scope**: `packages/api/src/router/public-booking.ts`, `apps/bookings/src/app/[facilitySlug]/confirm/_components/confirm-page.tsx`
**Severity**: MEDIUM

Phone regex `/^\d{8,15}$/` accepts any 8-15 digits. Peru mobile numbers are 9 digits starting with 9.

**Server-side fix:**
- Change `sendOtp` and `verifyOtp` phone schema to `/^9\d{8}$/` (Peru mobile)
- Update error message: "Ingresa un número de celular válido (9 dígitos)"

**Client-side fix:**
- Update phone input validation in `confirm-page.tsx` and `mis-reservas-page.tsx` to match
- Add `maxLength={9}` to phone input
- Show inline validation message

**Tests**: Update OTP tests with Peru-format phone numbers.

---

### TASK-40: Add accessibility improvements (aria-labels) ✅

**Type**: fix
**Scope**: `apps/bookings/src/app/[facilitySlug]/`
**Severity**: MEDIUM

Several interactive elements lack screen reader support.

**OTP input (`otp-input.tsx`):**
- Add `aria-label={`Dígito ${index + 1} del código`}` to each input

**Slot grid (`slot-grid.tsx`):**
- Add `aria-label` to slot buttons: `{courtName}, {startTime} - {endTime}, S/ {price}`

**Date selector (`date-selector.tsx`):**
- Add `aria-label` to date buttons: `{dayName} {dayNumber} de {month}`

**Calendar link (`calendar-link.tsx`):**
- Add `aria-label="Agregar al calendario de Google"` to the link

---

### TASK-41: Handle missing sessionStorage on success page ✅

**Type**: fix
**Scope**: `apps/bookings/src/app/[facilitySlug]/success/_components/success-page.tsx`
**Severity**: MEDIUM

If user bookmarks the success page or sessionStorage is cleared, booking details are lost. Currently shows a minimal fallback but could query the backend.

**Fix:**
- If `sessionStorage` has no data for the booking code, call `getMyBookings` with the verification token (if available in localStorage) and find the booking by code
- If no token available, show the booking code with a message: "Para ver los detalles de tu reserva, visita 'Mis Reservas'"
- Link to `/mis-reservas`

---

### TASK-42: Lint, typecheck, and final QA ✅

**Type**: chore
**Scope**: `apps/bookings/`, `packages/api/`
**Depends on**: TASK-31 through TASK-41

- Run `pnpm lint` — fix any new lint issues
- Run `pnpm format:fix` — fix formatting
- Run `pnpm typecheck` — verify no type errors
- Run `pnpm test` — all existing tests pass (661+)
- Run `pnpm lint:ws` — workspace dependency lint
- Verify Turnstile widget renders in dev (with test keys)
- Verify error boundaries render correctly
- Verify robots.txt serves correctly
- Test booking flow end-to-end

---

## Previous: Web Dashboard Production Readiness ✅

**Goal**: Harden `apps/nextjs` (court owner dashboard) for production — error handling, security headers, CORS, logging, performance, and SEO.

**Context**: Audit across 4 dimensions (config, security, error handling, performance) found 10 actionable items. Auth, input validation, RBAC, image optimization, and data fetching are already solid.

---

### TASK-21: Add error boundaries (error.tsx + global-error.tsx) ✅

**Type**: fix
**Scope**: `apps/nextjs/src/app/`
**Severity**: CRITICAL

Zero error boundaries exist. Runtime errors crash the page with no recovery UI.

**Create `src/app/error.tsx`:**
- `"use client"` directive (required for error boundaries)
- Shows PadelHub branding (logomark)
- Spanish error message: "Algo salió mal"
- Description: "Ocurrió un error inesperado. Intenta nuevamente."
- "Reintentar" button that calls `reset()`
- "Volver al inicio" link to `/org`
- Dark background matching `not-found.tsx` style

**Create `src/app/global-error.tsx`:**
- `"use client"` directive
- Catches root layout errors (renders its own `<html>` and `<body>`)
- Minimal UI (no external CSS/fonts — layout may be broken)
- "Reintentar" button that calls `reset()`

**Reference**: Match the visual style of the existing `src/app/not-found.tsx`.

---

### TASK-22: Add security headers to next.config.js ✅

**Type**: fix
**Scope**: `apps/nextjs/next.config.js`
**Severity**: CRITICAL

No security headers configured. Missing HSTS, clickjacking protection, MIME sniffing protection, and referrer policy.

**Add `headers()` function to the Next.js config:**
```
Source: "/(.*)"
Headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- X-DNS-Prefetch-Control: on
```

**Do NOT add CSP yet** — it requires careful allow-listing of inline styles (Tailwind), fonts (Google Fonts), images (Cloudflare, Unsplash), and maps (OpenStreetMap iframes). CSP is a separate follow-up task.

---

### TASK-23: Restrict CORS in tRPC route handler ✅

**Type**: fix
**Scope**: `apps/nextjs/src/app/api/trpc/[trpc]/route.ts`
**Severity**: CRITICAL

Currently sets `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Headers: *`. The dashboard only makes same-origin requests from the Next.js frontend to its own `/api/trpc` endpoint — no cross-origin access is needed.

**Fix:**
- Remove the `setCorsHeaders` function and all calls to it
- Remove the `OPTIONS` handler export
- Keep only the `GET` and `POST` handler exports

If cross-origin access is needed later (e.g., for the mobile app), add it back with explicit origin allow-listing.

---

### TASK-24: Sanitize sensitive logging ✅

**Type**: fix
**Scope**: `packages/auth/src/index.ts`, `apps/nextjs/src/app/api/trpc/[trpc]/route.ts`
**Severity**: HIGH

**Auth package (`packages/auth/src/index.ts`):**
- Line 51-53: Password reset fallback logs the full reset URL to console. This is a dev-only path (production provides `onSendResetPassword` callback), but the URL contains the reset token. Change to log only `[AUTH] Password reset requested for ${resetUser.email}` without the URL.
- Line 80: `console.error("BETTER AUTH API ERROR", error, ctx)` logs the full context object which may contain session data or request details. Change to `console.error("BETTER AUTH API ERROR", error)` — omit `ctx`.

**tRPC route handler (`apps/nextjs/src/app/api/trpc/[trpc]/route.ts`):**
- Line 38: `console.error(\`>>> tRPC Error on '${path}'\`, error)` logs the full error object including stack traces. In production, log only the error message and code. In development, keep the full stack.
- Use `process.env.NODE_ENV === "production"` check to control verbosity.

---

### TASK-25: Add robots.txt to prevent search engine indexing ✅

**Type**: fix
**Scope**: `apps/nextjs/src/app/`
**Severity**: MEDIUM

The dashboard is an authenticated B2B app — it should not be indexed by search engines. Middleware already allows `robots.txt` through, but no file exists.

**Create `src/app/robots.ts`:**
```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
```

---

### TASK-26: Fix rate limiter fail-open behavior ✅

**Type**: fix
**Scope**: `apps/nextjs/src/lib/rate-limit.ts`, `apps/nextjs/src/middleware.ts`
**Severity**: HIGH

When Redis is unavailable, `getAuthLimiter()` returns `null` and `checkRateLimit()` silently skips rate limiting. For production, this should at minimum log a warning.

**Changes to `src/lib/rate-limit.ts`:**
- When `getRedis()` returns null (missing credentials), log a one-time warning: `console.warn("[RATE-LIMIT] Redis not configured — auth rate limiting disabled")`
- Use a `didWarn` flag to avoid spamming logs

**Changes to `src/middleware.ts`:**
- No changes needed — the current behavior (skip rate limiting if limiter unavailable) is acceptable for a low-traffic B2B dashboard. The auth layer itself (session cookies, password hashing) is the primary protection.

**Note**: Full fail-closed behavior (503 on Redis failure) would be too aggressive for this app's scale.

---

### TASK-27: Add notFound() handling for dynamic route params ✅

**Type**: fix
**Scope**: `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/courts/[courtId]/page.tsx`, `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/bookings/[bookingId]/page.tsx`
**Severity**: HIGH
**Depends on**: TASK-21

Currently, invalid `courtId` and `bookingId` params prefetch a query that will fail, then `useSuspenseQuery` throws client-side. With TASK-21's error boundaries this shows a generic error — but a proper 404 is better UX.

**For both pages, add server-side validation:**
1. After `prefetch()`, call the same query with `await` via `api()` caller
2. If the tRPC call throws (not found), call `notFound()` from `next/navigation`
3. Wrap in try/catch since tRPC throws `TRPCError`

**Pattern:**
```typescript
const caller = await api();
try {
  await caller.court.getById({ facilityId, id: courtId });
} catch {
  notFound();
}
```

**Note**: `orgSlug` and `facilityId` already have redirect-based validation in their layout files — those are fine as-is since they handle access control (redirect to assigned facility, not 404).

---

### TASK-28: Add dynamic imports for heavy components ✅

**Type**: refactor
**Scope**: `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/settings/_components/facility-settings-view.tsx`
**Severity**: MEDIUM

Settings page eagerly imports 7 tab components (`BookingLinkTab`, `FacilityInfoTab`, `FacilityPhotosTab`, `FacilityTeamTab`, `NotificationsTab`, `ProfileTab`, `SecurityTab`) but only shows 1 tab at a time. Heavy dependencies like `qrcode.react` (in BookingLinkTab) and `@dnd-kit/*` (in FacilityPhotosTab) are bundled into the initial load.

**Fix:**
- Use `next/dynamic` for each tab component with a skeleton loading fallback
- Example:
  ```typescript
  const BookingLinkTab = dynamic(
    () => import("./booking-link-tab").then((m) => ({ default: m.BookingLinkTab })),
    { loading: () => <TabSkeleton /> },
  );
  ```
- Create a simple `TabSkeleton` component (animated pulse placeholder matching tab content height)
- Apply to all 7 tab imports

---

### TASK-29: Add React.memo to calendar grid components ✅

**Type**: refactor
**Scope**: `apps/nextjs/src/app/org/[orgSlug]/(facility-view)/facilities/[facilityId]/bookings/calendar/_components/`
**Severity**: MEDIUM

`CalendarDayGrid` and `CalendarWeekGrid` render many child elements (time slots × courts). Parent state changes (e.g., tooltip open/close, date navigation) cause full re-renders of the grid even when booking data hasn't changed.

**Changes to `calendar-day-grid.tsx`:**
- Wrap the component export in `React.memo()`
- The component already receives stable props (bookings, courts, blockedSlots are from React Query cache)

**Changes to `calendar-week-grid.tsx`:**
- Wrap the component export in `React.memo()`

**Changes to `calendar-view.tsx`:**
- Wrap `onBookingClick` and `onEmptySlotClick` callbacks in `useCallback` so they don't break memo

---

### TASK-30: Lint, typecheck, and final QA ✅

**Type**: chore
**Scope**: `apps/nextjs/`, `packages/auth/`
**Depends on**: TASK-21 through TASK-29

- Run `pnpm lint` — fix any new lint issues
- Run `pnpm format:fix` — fix formatting
- Run `pnpm typecheck` — verify no type errors
- Run `pnpm test` — all existing tests pass
- Run `pnpm lint:ws` — workspace dependency lint
- Verify error boundaries render correctly (trigger an error in dev)
- Verify security headers present in response (check with `curl -I`)
- Verify robots.txt serves `Disallow: /`

---

## Previous: Landing Page Production Readiness ✅

**Goal**: Fix SEO, accessibility, performance, and asset issues in `apps/landing` before production launch.

**Context**: Audit found missing SEO fundamentals (robots.txt, sitemap, canonical URLs, Twitter cards), a 1.4MB hero image, form inputs without labels, incomplete favicon linking, and unused deployed assets.

---

### TASK-16: SEO fundamentals ✅

**Type**: fix
**Scope**: `apps/landing/src/layouts/Layout.astro`, `apps/landing/public/`

Add missing SEO elements to the landing page:

**Layout.astro meta tags:**
- Add `<link rel="canonical" href={Astro.url} />` to all pages
- Add `<meta property="og:url" content={Astro.url} />`
- Add `<meta property="og:image:width" content="1200" />` and `og:image:height` (630)
- Add `<meta property="og:image:type" content="image/png" />`
- Add `<meta name="robots" content="index, follow" />`
- Add Twitter card tags: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`

**Static files:**
- Create `public/robots.txt` — allow all, reference sitemap URL
- Create `public/sitemap.xml` — 3 pages: `/` (priority 1.0), `/terminos` (0.3), `/privacidad` (0.3)

---

### TASK-17: Accessibility — form labels and screen reader support ✅

**Type**: fix
**Scope**: `apps/landing/src/components/WaitlistForm.tsx`, `AccessRequestForm.tsx`, `Navbar.astro`

**Form inputs** (WaitlistForm + AccessRequestForm):
- Add `aria-label` to every `<input>` (e.g., `aria-label="Tu nombre"`, `aria-label="Tu email"`, `aria-label="Tu teléfono"`)
- Add `role="alert"` and `aria-live="polite"` to success/error message containers

**Skip-to-content:**
- Add a visually-hidden skip link at the top of `Layout.astro`: `<a href="#main-content" class="sr-only focus:not-sr-only ...">Saltar al contenido</a>`
- Add `id="main-content"` to the `<main>` element

---

### TASK-18: Optimize hero images ✅

**Type**: fix
**Scope**: `apps/landing/public/images/`

- Compress `hero-players-1.jpg` from 1.4MB to under 300KB (use quality 80, resize if needed — current 2400x1600 is oversized for a background)
- Remove `hero-players-2.jpg` (821KB, unused in code)

---

### TASK-19: Complete favicon and web manifest ✅

**Type**: fix
**Scope**: `apps/landing/src/layouts/Layout.astro`, `apps/landing/public/`

**Layout.astro:**
- Add links for `favicon-192.png` and `favicon-512.png` (already in `/public/` but not referenced in HTML)
- Add `<meta name="theme-color" content="#3B82F6" />` (brand blue)
- Add `<link rel="manifest" href="/site.webmanifest" />`

**Create `public/site.webmanifest`:**
```json
{
  "name": "PadelHub",
  "short_name": "PadelHub",
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "display": "browser"
}
```

---

### TASK-20: Remove unused public assets ✅

**Type**: chore
**Scope**: `apps/landing/public/`

Remove files deployed to `/public/` but never referenced in code:
- `public/images/logomark.svg`
- `public/images/logomark-reversed.svg`
- `public/images/padelhub-horizontal-fullcolor.png`

These are available in `/assets/` if ever needed again.

---

## Previous: Player-Facing Landing Page Redesign ✅

**Goal**: Redesign the player side of the landing page from a misleading "book online" experience into a real facility directory with WhatsApp contact + player waitlist for the mobile app launch.

**Context**: The bookings app (`bookings.padelhub.pe`) requires a direct facility link — there's no discovery/browse page. The current player-side landing promises court search that doesn't exist. Instead, we'll show the 17 real Lima facilities from `padel_lima_research.json` (PR #1) with WhatsApp booking CTAs, and onboarded facilities get a "Reservar Online" link. A waitlist collects player info for the future mobile app.

**Data source**: Static JSON import at build time (Astro SSG). Research data has 17 facilities: 6 with phone, 8 with Instagram, 7 with neither (fallback to Google Maps).

---

### TASK-09: Add `type` discriminator to `access_requests` schema ✅

**Type**: db
**Scope**: `packages/db`, `packages/api`, `apps/landing`, `apps/admin`

Add a `type` enum (`player` | `owner`) to `access_requests` to support both facility owner access requests and player waitlist signups in the same table.

**Schema changes:**
- Add `access_request_type` pgEnum: `["player", "owner"]`
- Add `type` column to `accessRequests` table (default `"owner"` for backwards compat)
- Update `CreateAccessRequestSchema` to include `type`
- Change unique constraint from `email` alone to `(email, type)` — same person can be both a player and an owner

**API changes:**
- Update `apps/landing/src/pages/api/access-request.ts` to accept and store `type`
- Update duplicate check to be `email + type` scoped

**Admin panel:**
- Add `type` column to access requests table
- Add type filter (Todos / Jugadores / Propietarios)
- Player-type requests don't need the approve flow (no org creation) — just informational

**Tests**: Update existing access-request tests if any, add test for type discrimination.

---

### TASK-10: Prepare facility directory data ✅

**Type**: data
**Scope**: `apps/landing/src/data/`

Copy and curate `padel_lima_research.json` from PR #1 branch (`origin/chore/add-website`) into the landing page for static import.

**Steps:**
- Copy JSON to `apps/landing/src/data/facilities.ts` as a typed TypeScript export
- Define a `DirectoryFacility` interface with the fields we need: `id`, `name`, `district`, `address`, `courtCount`, `courtType` (indoor/outdoor/mixto), `phone`, `whatsappUrl`, `instagramUrl`, `googleMapsUrl`, `imageUrl`, `amenities`, `hours`
- Transform the raw research JSON into this clean shape
- Add `bookingSlug: string | null` field — set for facilities that are onboarded on PadelHub (currently none in prod, but the seed data facilities for dev)
- Curate contact fallbacks: phone → WhatsApp CTA, else Instagram → Instagram CTA, else Google Maps → "Ver en Maps"

**Output**: `apps/landing/src/data/facilities.ts` exporting `facilities: DirectoryFacility[]` and the type.

---

### TASK-11: Build FacilityDirectory section ✅

**Type**: feature
**Scope**: `apps/landing/src/components/`

Create `FacilityDirectory.astro` — a card grid showing all Lima padel facilities.

**Card design:**
- Facility image (top, with fallback placeholder)
- Name, district badge, court count + type (e.g., "4 canchas · outdoor")
- Amenity chips (top 3-4)
- CTA button (priority order):
  1. `bookingSlug` → "Reservar Online" (green, links to `bookings.padelhub.pe/{slug}`)
  2. `whatsappUrl` → "Reservar por WhatsApp" (green WhatsApp icon, pre-filled message)
  3. `instagramUrl` → "Contactar por Instagram" (secondary style)
  4. `googleMapsUrl` → "Ver en Google Maps" (tertiary/link style)

**Layout:**
- Section heading: "Canchas de Pádel en Lima" with subtitle
- District filter pills (All, Surco, Miraflores, etc.) — CSS-only or minimal JS
- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- All 17 facilities visible (no pagination needed for 17 items)

**WhatsApp pre-filled message**: `Hola, vengo de PadelHub. Quisiera reservar una cancha en {facilityName}.`

**Files**: `src/components/FacilityDirectory.astro` (or React island if district filter needs JS)

---

### TASK-12: Build PlayerWaitlist section and API ✅

**Type**: feature
**Scope**: `apps/landing/src/components/`, `apps/landing/src/pages/api/`

Create a waitlist signup section for players to register interest in the mobile app.

**UI (`PlayerWaitlist.astro` + `WaitlistForm.tsx` React island):**
- Heading: "Sé de los primeros en usar la app" or similar
- Subtitle: "Estamos construyendo la app de PadelHub para que reserves canchas, encuentres jugadores y más. Déjanos tus datos y te avisaremos cuando esté lista."
- Form fields: name (required), email (required), phone (optional)
- Success state: "¡Te anotamos! Te avisaremos cuando lancemos la app."
- Trust line: "Sin spam. Solo te avisaremos del lanzamiento."

**API update:**
- Update `/api/access-request` endpoint to accept `type: "player" | "owner"` (default `"owner"`)
- Player submissions: no confirmation email needed (or a different simpler one)
- Duplicate check scoped to `email + type`

**Files**: `src/components/PlayerWaitlist.astro`, `src/components/WaitlistForm.tsx`, update `src/pages/api/access-request.ts`

---

### TASK-13: Restructure player-side landing layout ✅

**Type**: refactor
**Scope**: `apps/landing/src/`

Reorganize the player side of the landing page to replace misleading content with the facility directory and waitlist.

**HeroSection changes:**
- Remove the fake search form (district dropdown, date picker, "Buscar Canchas")
- New player hero CTA: "Ver Canchas" (scrolls to `#canchas` directory section)
- Update headline/subtitle to match the new value prop (directory, not booking platform)
- Keep the audience toggle pill (Soy Jugador / Tengo un Club)

**Section order (player view):**
```
Navbar
HeroSection (updated player tab)
FacilityDirectory (id="canchas") ← NEW, replaces PlayerHowItWorks + PlayerTestimonials
PlayerWaitlist ← NEW
AudienceDivider
Features (org)
HowItWorks (org)
ComparisonTable (org)
CtaSection (org)
Footer
```

**Remove/repurpose:**
- `PlayerHowItWorks.astro` — remove (promises flow that doesn't exist)
- `PlayerTestimonials.astro` — remove (fake testimonials)
- `PlayerCta.astro` — remove (links to non-existent search)
- `SocialProof.astro` — update stats to be honest (e.g., "17 canchas mapeadas", "10 distritos")

**Navbar updates:**
- "Buscar Canchas" → "Ver Canchas" (scrolls to #canchas)
- Keep "Solicitar Acceso" for org audience

---

### TASK-14: Update admin panel for request types ✅

**Type**: feature
**Scope**: `apps/admin/`

Update the admin access requests view to handle the new `type` field.

**Changes:**
- Add "Tipo" column to the data table (badge: "Jugador" / "Propietario")
- Add type filter tabs or dropdown (Todos / Jugadores / Propietarios)
- Player requests: no approve/reject flow — just a list for future outreach
- Owner requests: keep existing approve/reject flow unchanged
- Update `admin.listAccessRequests` tRPC procedure to accept optional `type` filter

---

### TASK-15: Polish, lint, and QA ✅

**Type**: chore
**Scope**: `apps/landing/`, `apps/admin/`
**Depends on**: TASK-09 through TASK-14

- Run `pnpm lint`, `pnpm format:fix`, `pnpm typecheck`
- Test all breakpoints (375px, 768px, 1280px)
- Verify facility cards render correctly with all CTA variants
- Test WhatsApp links open correctly with pre-filled message
- Test waitlist form submission + duplicate handling
- Test admin panel type filter
- Verify org-side sections unchanged
- Run `pnpm test` — all existing tests pass
- `pnpm db:push` — schema migration works

---

## Previous: Dual-Audience Landing Page ✅

**Goal**: Transform the B2B-only landing page into a dual-audience experience with tabs for Players and Organizations, cherry-picking player content from PR #1.

**Technical Plan**: See `docs/TECHNICAL_PLAN.md`

---

### TASK-01: Add player hero images from PR #1 ✅

**Type**: config
**Scope**: `apps/landing/public/images/`
**Estimate**: Small

Copy padel court photos from PR #1's `apps/website/public/images/` branch into the landing page's public directory. These will be used as the background for the player hero tab. Optimize if needed.

**Files**: `public/images/hero-players-1.jpg`, `public/images/hero-players-2.jpg`

---

### TASK-02: Build the HeroSection React island with audience tabs ✅

**Type**: feature
**Scope**: `apps/landing/src/components/`
**Depends on**: TASK-01

Create `HeroSection.tsx` — a React component with `client:load` hydration that replaces `Hero.astro`. Two tabs with animated transitions:

**Player tab ("Soy Jugador")**:
- Full-bleed photo background with dark gradient overlay
- Headline: "Encuentra tu cancha de padel ideal"
- Subtitle about discovering and booking courts in Lima
- Simplified search form: district dropdown (static list) + date picker + "Buscar Canchas" button
- "Buscar Canchas" links to `bookings.padelhub.pe` with query params
- Trust indicators: "Gratuito para jugadores", "10+ canchas en Lima", "Sin comision"

**Org tab ("Tengo un Club")**:
- Current light gradient background preserved
- Dashboard mockup (current Hero.astro content, converted to JSX)
- Same headline, subtitle, and CTAs as current
- Floating cards (reservas nuevas, hora pico)

**Toggle pill**: Centered, pill-shaped, with sliding indicator animation. Uses green accent for player, blue for org.

**Responsive**: Single-column on mobile for both tabs. Search form stacks vertically.

**Files**: `src/components/HeroSection.tsx`, update `src/pages/index.astro`
**Remove**: `src/components/Hero.astro`

---

### ~~TASK-03: Create PlayerHowItWorks section~~ ✅

**Type**: feature
**Scope**: `apps/landing/src/components/`
**Depends on**: none

Create `PlayerHowItWorks.astro` — a section explaining the player flow in 3 steps:

1. **Descubre** — "Explora canchas de padel en tu distrito. Filtra por tipo, precio y amenidades."
2. **Reserva** — "Elige el horario que prefieras y reserva tu cancha en segundos. Sin llamadas."
3. **Juega** — "Llega a la cancha y disfruta tu partido. Encuentra jugadores de tu nivel."

Content adapted from PR #1's `HowItWorks` component. Desktop: 3-column centered grid with icons and step numbers. Mobile: vertical cards with connecting line.

Include a CTA at the bottom: "Buscar Canchas" button linking to `bookings.padelhub.pe`.

**Files**: `src/components/PlayerHowItWorks.astro`

---

### ~~TASK-04: Create PlayerTestimonials section~~ [x]

**Type**: feature
**Scope**: `apps/landing/src/components/`
**Depends on**: none

Create `PlayerTestimonials.astro` — player testimonials section adapted from PR #1's `TestimonialSection`. Static data, 4 testimonials:

- Carlos M. (Miraflores, Cat 4)
- Maria L. (San Isidro, Cat 5)
- Roberto S. (Surco, Cat 3)
- Ana P. (La Molina, Cat 6)

Desktop: 4-column card grid. Mobile: horizontal scroll-snap carousel (CSS only) with dot indicators. Each card has 5-star rating, quote, and avatar initials.

**Files**: `src/components/PlayerTestimonials.astro`

---

### TASK-05: Create AudienceDivider section ✅

**Type**: feature
**Scope**: `apps/landing/src/components/`
**Depends on**: none

Create `AudienceDivider.astro` — a visual transition section between the player and org content areas. Clean, modern divider that contextualizes what follows.

Example: A centered badge or heading like "Para propietarios de canchas" with a subtle gradient transition, creating a visual break between the player and org sections.

**Files**: `src/components/AudienceDivider.astro`

---

### TASK-06: Update SocialProof, Navbar, and HowItWorks ✅

**Type**: refactor
**Scope**: `apps/landing/src/components/`
**Depends on**: none

**SocialProof.astro**: Update stats to serve both audiences:
- "500+" Jugadores activos (player)
- "10+" Clubes asociados (shared)
- "6" Distritos de Lima (player)
- "100%" Gratis para jugadores (player)

**Navbar.astro**:
- Add "Buscar Canchas" as a secondary CTA (green/secondary button) next to "Solicitar Acceso"
- Update nav links: "Para Jugadores" (#jugadores), "Para Organizaciones" (#organizaciones)
- Keep "Iniciar sesion" link

**HowItWorks.astro**: Rename heading from "Como Funciona" to "Como Empezar" to differentiate from the player HowItWorks. Add `id="organizaciones"` anchor if not present.

**Files**: `SocialProof.astro`, `Navbar.astro`, `HowItWorks.astro`

---

### TASK-07: Assemble page and remove ProblemSolution ✅

**Type**: refactor
**Scope**: `apps/landing/src/pages/index.astro`
**Depends on**: TASK-02, TASK-03, TASK-04, TASK-05, TASK-06

Update `index.astro` with the new section order:

```
Navbar
HeroSection (React island, client:load)
SocialProof
PlayerHowItWorks (id="jugadores")
PlayerTestimonials
AudienceDivider
Features (existing)
HowItWorks (existing, org — id="organizaciones")
ComparisonTable (existing)
CtaSection (existing)
Footer
```

Remove `ProblemSolution` import and usage. Delete `ProblemSolution.astro` file.

**Files**: `src/pages/index.astro`, delete `src/components/ProblemSolution.astro`

---

### TASK-08: Responsive polish, lint, and visual QA ✅

**Type**: chore
**Scope**: `apps/landing/`
**Depends on**: TASK-07

- Run `pnpm lint`, `pnpm format:fix`, `pnpm typecheck`
- Test all breakpoints (mobile 375px, tablet 768px, desktop 1280px)
- Test both hero tabs at each breakpoint
- Verify smooth tab transitions and animations
- Ensure all CTAs link correctly (bookings.padelhub.pe, #solicitar, etc.)
- Verify Navbar scroll behavior works with new hero
- Check page load performance (hero images should be optimized)

---

## Completed

All prior tasks have been archived. See git history for details.

**Summary of completed work:**

- Public Booking Page (14 tasks) — `apps/bookings`, `packages/whatsapp`, `publicBooking` router, slot generation, OTP + verification tokens, WhatsApp notifications, 147 tests
- Email Notification System — `packages/email` (React Email + Resend), 4 templates
- Flow 1: Authentication & Access (8 tasks) — Login, invite acceptance, password reset, 129 tests
- Flow 2: Organization Management (6 tasks) — Facility cards, filters, org switcher
- Image System (10 tasks) — `packages/images`, Cloudflare Images, 21 tests
- Flow 3: Team & Roles - RBAC (8 tasks) — Permissions, route guards, 35 tests
- Flow 4: Facility Onboarding (11 tasks) — Setup wizard, courts, schedule, photos, 52 tests
- Flow 6: Schedule & Pricing (9 tasks) — Zone calculation, peak periods, pricing, 120 tests
- Flow 7: Booking Management (7 tasks) — Status resolver, cancel logic, 143 tests
- Flow 8: Calendar (7 tasks) — Day/week views, quick booking, 474 total tests
- Flow 9: Settings (7 tasks) — Profile, password, RBAC tabs
- Flow 10: Navigation & Context Switching (8 tasks) — Sidebar, breadcrumbs, mobile nav
- Web Dashboard Brand Assets (5 tasks) — Logo, favicon, OG images
- E2E Testing — Playwright MCP (10 tasks) — 9 test suites + smoke tests
- BUG-005 fix (4 subtasks) — Hydration mismatch deferred mount
