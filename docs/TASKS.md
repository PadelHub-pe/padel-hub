# Tasks

## Current: Player-Facing Landing Page Redesign

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

### TASK-15: Polish, lint, and QA

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
