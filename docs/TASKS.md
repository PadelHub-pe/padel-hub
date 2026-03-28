# Tasks

## Current: Dual-Audience Landing Page

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

### TASK-08: Responsive polish, lint, and visual QA

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
