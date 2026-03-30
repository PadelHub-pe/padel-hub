# Tasks

## Current: Web Dashboard Production Readiness

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
