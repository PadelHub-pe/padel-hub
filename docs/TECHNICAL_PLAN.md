# Technical Plan: Dual-Audience Landing Page

## Context

### What exists today

The landing page (`apps/landing/`) is an **Astro 6 static site** targeting **court owners (B2B)**. It has:

- Hero with dashboard mockup + "Solicitar Acceso" CTA
- SocialProof stats (org-focused)
- ProblemSolution, Features, HowItWorks, ComparisonTable (all org-focused)
- CtaSection with AccessRequestForm (React island, only interactive component)
- Navbar with org-focused links

**Tech**: Astro + one React island, Tailwind v4, Vercel serverless, zero client JS except the form.

### PR #1 (`chore/add-website`)

A **full Next.js app** (`apps/website/`) targeting **players (B2C)**. Key content:

- Hero with full-bleed photo, search tabs (Buscar Cancha / Buscar Partido)
- StatsCounter, DistrictCarousel (Leaflet map), FeaturedCourts (tRPC data)
- HowItWorks (player: Descubre, Reserva, Juega)
- Testimonials (4 player testimonials), AppDownloadCTA (phone mockup)
- WaitlistCTA form, para-propietarios page

**Problem**: PR #1 is a 13K-line Next.js app with tRPC, Leaflet, React Query, etc. It can't be merged directly into Astro.

### What we want

A **single landing page** with a dual-audience experience:

- **Tab 1 -- Jugadores**: Player-focused hero + search CTA
- **Tab 2 -- Organizaciones**: Current org-focused hero + access request CTA
- Below the hero: sections for both audiences on one page
- Modern, polished UX inspired by Airbnb's host/guest toggle pattern

## Architecture Decisions

### 1. Stay on Astro -- cherry-pick content, not code

We will **NOT merge the Next.js app**. Instead, we'll extract the player-facing *content* (copy, section concepts, design patterns) from PR #1 and implement it natively in Astro + React islands.

**Why**: Astro's zero-JS-by-default gives us a fast, SEO-friendly landing page. Adding Next.js would over-engineer it and duplicate `apps/bookings`.

### 2. Hero becomes a React island with audience tabs

The hero section will be a React component (`HeroSection.tsx`) with `client:load` hydration (needs to be interactive immediately). It contains:

- **Audience toggle**: Pill-shaped tabs -- "Soy Jugador" | "Tengo un Club"
- **Player tab**: Photo background with dark overlay, headline, simplified district search form, "Buscar Canchas" button linking to `bookings.padelhub.pe`, trust indicators
- **Org tab**: Current light gradient background, dashboard mockup, "Solicitar Acceso" headline + CTA button

The tab transition uses CSS opacity/transform animations for smooth crossfade between the two hero states.

### 3. No DB queries from landing -- player search links to bookings app

The player search form on the hero is a **lead-in CTA**, not actual search functionality. Clicking "Buscar Canchas" navigates to `bookings.padelhub.pe` (the existing public booking app). No tRPC, no DB calls needed.

### 4. Sections below: sequential dual-audience flow

Rather than dynamically toggling all page sections (which would require making the entire page a React app), we show content for both audiences in a natural reading flow:

```
Hero (React island with tabs)
  SocialProof (shared, updated stats)
  PlayerHowItWorks (NEW -- 3 steps for players)
  PlayerTestimonials (NEW -- player quotes)
  --- visual transition ---
  Features (existing, org-focused)
  HowItWorks (existing, org-focused -- renamed "Como Empezar")
  ComparisonTable (existing, org-focused)
  CtaSection (existing, AccessRequestForm)
```

The ProblemSolution section is removed -- its value prop is now communicated through the hero tabs and the new player sections.

### 5. Design language

**Player tab hero**: Dark, immersive -- full-bleed padel court photo with gradient overlay. White text, green accents. Feels like a sports/lifestyle app.

**Org tab hero**: Light, professional -- current gradient background with dashboard mockup. Blue accents. Feels like a SaaS product.

**Toggle pill**: Centered above the hero headline. White background, rounded-full, with a sliding indicator. Inspired by Airbnb's host/guest toggle.

## UX/UI Design Reference

### Audience Toggle Pattern (inspired by Airbnb, Stripe, Deel)

```
+-------------------------------------------+
|  [ Soy Jugador  |  Tengo un Club ]        |  <- pill toggle
+-------------------------------------------+
```

- Pill container: `rounded-full bg-white/10 backdrop-blur` (on dark bg) or `bg-gray-100` (on light bg)
- Active tab: `bg-white text-gray-900 shadow-sm` (slides with transition)
- Inactive tab: `text-white/70` or `text-gray-500`
- Width: auto, centered, max-w-sm

### Player Hero Layout

```
+--------------------------------------------------+
| [photo background - padel court with players]     |
| +----------------------------------------------+ |
| |         [ toggle pill ]                       | |
| |                                               | |
| |     Encuentra tu cancha de                    | |
| |     **padel** ideal                           | |
| |                                               | |
| |     Descubre y reserva canchas en Lima.       | |
| |     Compara precios y horarios.               | |
| |                                               | |
| |  +- Search Bar ----------------------------+  | |
| |  | [Distrito v] [Fecha] [Buscar Canchas]   |  | |
| |  +-----------------------------------------+  | |
| |                                               | |
| |  check Gratuito  check 10+ canchas  check Sin comision | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

### Org Hero Layout (current, preserved)

```
+--------------------------------------------------+
|  light gradient background                        |
|  +-----------------+--------------------------+  |
|  |   [ toggle ]    |                          |  |
|  |                 |   +- Dashboard Mockup -+ |  |
|  |   Llena tus     |   |  [browser chrome]  | |  |
|  |   canchas con   |   |  [sidebar] [stats] | |  |
|  |   jugadores     |   |  [chart bars]      | |  |
|  |   reales        |   +--------------------+ |  |
|  |                 |   +3 reservas             |  |
|  |  [Solicitar]    |   Hora pico activa        |  |
|  |  [Ver como]     |                          |  |
|  +-----------------+--------------------------+  |
+--------------------------------------------------+
```

## Risk Assessment

### Low risk
- All changes are scoped to `apps/landing/` -- no backend/DB/API changes
- Existing org sections preserved as-is
- No new dependencies beyond what Astro + React already provide

### Medium risk
- **Hero React island complexity**: The tabbed hero with two full layouts is more JS than the current page has. Mitigation: keep it focused, no external deps
- **Image assets**: Player hero needs a good background photo. Mitigation: use PR #1's images (`canva-padel-*.jpg`) or royalty-free padel photos
- **Mobile responsiveness**: Two hero layouts need to look great on mobile. Mitigation: mobile-first design, test each tab state

### Not doing (avoids risk)
- No Leaflet map (heavy dependency)
- No tRPC/DB integration
- No facility listing/detail pages (those belong in `apps/bookings` or future)
- No waitlist form (out of scope)

## File Changes Summary

### New files
- `src/components/HeroSection.tsx` -- React island with audience tabs (replaces Hero.astro)
- `src/components/PlayerHowItWorks.astro` -- 3-step player flow
- `src/components/PlayerTestimonials.astro` -- Player testimonials with mobile carousel
- `src/components/AudienceDivider.astro` -- Visual transition between player and org sections
- `public/images/hero-players.jpg` -- Player hero background image (from PR #1)

### Modified files
- `src/pages/index.astro` -- New section order, add player sections, remove ProblemSolution
- `src/components/SocialProof.astro` -- Updated stats for dual audience
- `src/components/Navbar.astro` -- Add "Buscar Canchas" secondary CTA, update nav links
- `src/components/HowItWorks.astro` -- Rename heading to "Como Empezar" (org context)
- `src/styles/global.css` -- New animation utilities if needed

### Removed
- `src/components/ProblemSolution.astro` -- Content absorbed into hero tabs
- `src/components/Hero.astro` -- Replaced by HeroSection.tsx

## Implementation Notes

### Search form on player hero

Simplified version of PR #1's `HeroSearchTabs`:
- District dropdown (static list of Lima districts, no DB)
- Date picker (HTML date input)
- "Buscar Canchas" button -> navigates to `https://bookings.padelhub.pe?distrito={slug}&fecha={date}`

Intentionally simple -- the real search/booking experience lives at `bookings.padelhub.pe`.

### Player testimonials

Adapted from PR #1's `TestimonialSection`. Static data (no DB), 4 testimonials. Desktop: 4-column grid. Mobile: horizontal scroll-snap carousel (CSS only, no JS).

### Images

Copy from PR #1's branch: `canva-padel-1.jpg`, `canva-padel-2.jpg` -> `apps/landing/public/images/`. These are the background images for the player hero tab.

### Keeping the existing org flow intact

The "Solicitar Acceso" flow (Navbar CTA -> #solicitar anchor -> CtaSection form) remains unchanged. The org tab in the hero also links to `#solicitar`.

---

## Archived Plans

- **Public Booking Page** (completed) -- See git history for the full technical plan. Delivered `apps/bookings`, `packages/whatsapp`, `publicBooking` tRPC router, slot generation, WhatsApp OTP, Cloudflare Turnstile, guest booking flow.
