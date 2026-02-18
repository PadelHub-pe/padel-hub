# Dashboard: B2B Landing Page

Estimate: L (1-2d)
Platform: Web
Priority: P0 - Critical
Sprint: Week 1 - Setup
Status: Done
Type: Feature

## 💻 Screen Overview

| Property | Value |
| --- | --- |
| Screen Name | B2B Landing Page — Para Locales |
| Platform | Web (Desktop + Mobile Responsive) |
| Route | `/` or `/para-locales` |
| Priority | P0 - Critical |
| Screen # | 0 (Pre-auth public page) |
| Version | v1 - MVP Launch |
| Auth Required | No — Public route |

---

## 🎯 Purpose

The front door for padel facility owners in Lima. This is a B2B marketing page designed to convert facility owners into "Solicitar Acceso" leads. The page communicates PadelHub's core differentiator: **we're a marketplace that brings players to your courts**, not just another management tool.

**Target audience:** ~30-50 padel facility owners/managers in Lima, Peru.

**Primary goal:** Drive "Solicitar Acceso" email submissions.

**Secondary goal:** Educate owners on the marketplace value proposition vs. traditional SaaS.

---

## 📐 Page Sections

| # | Section | Description |
| --- | --- | --- |
| 1 | Navbar | Fixed, transparent → frosted glass on scroll. Logo + nav links + "Iniciar sesión" + "Solicitar Acceso" CTA |
| 2 | Hero | Bold headline + dashboard mockup with floating notification cards showing live activity |
| 3 | Social Proof Bar | 4 key platform stats (players, venues, bookings, rating) |
| 4 | Problem / Solution | Dark section. Side-by-side 3v3 comparison: "Sin PadelHub" vs "Con PadelHub" |
| 5 | Features | Bento grid — 1 featured card (booking management with preview) + 5 supporting feature cards |
| 6 | How it Works | 3-step process: Solicitar → Configurar → Recibir reservas |
| 7 | Comparison Table | PadelHub vs traditional software across 8 criteria |
| 8 | Testimonial | Single quote from facility owner (placeholder for MVP) |
| 9 | CTA Section | Email capture + "Solicitar Acceso" button on dark background |
| 10 | Footer | Logo + links (Términos, Privacidad, Contacto) + copyright |

---

## 🔑 Key Messaging

### Headline Hierarchy

| Element | Text |
| --- | --- |
| Badge | "Beta activa en Lima" |
| H1 (Hero) | "Llena tus canchas con jugadores reales" |
| Subhead | "PadelHub conecta tu local con miles de jugadores buscando dónde jugar. Tú gestionas tus canchas, nosotros te traemos la demanda." |
| Problem | "Tus canchas vacías no generan ingresos" |
| Features | "Todo lo que necesitas para gestionar tu local" |
| Process | "Activo en menos de 48 horas" |
| Comparison | "No somos otro software de gestión" |
| CTA | "¿Listo para llenar tus canchas?" |

### Core Differentiator

PadelHub = **Marketplace** that generates demand (players find YOU)

Traditional software = **Tool** that helps you manage existing demand (you still need to find players yourself)

---

## 📊 Social Proof Stats (MVP)

| Stat | Value | Source |
| --- | --- | --- |
| Jugadores registrados | 500+ | Static for MVP → dynamic from API later |
| Locales asociados | 12 | Static for MVP |
| Reservas procesadas | 2,400+ | Static for MVP |
| Rating promedio | 4.8★ | Static for MVP |

---

## ❌✅ Problem / Solution Cards

### Sin PadelHub

| Icon | Title | Description |
| --- | --- | --- |
| 📱 | Dependes de WhatsApp | Reservas por mensaje, sin control ni historial. Se pierden clientes por respuestas tardías. |
| 👻 | Jugadores invisibles | Miles de jugadores buscan cancha y no saben que existes. Solo te llegan los que ya te conocen. |
| 📊 | Cero visibilidad | No sabes tu ocupación real, no puedes optimizar precios, ni saber cuánto dejas en la mesa. |

### Con PadelHub

| Icon | Title | Description |
| --- | --- | --- |
| 🚀 | Reservas automáticas 24/7 | Los jugadores reservan directo desde la app. Sin mensajes, sin llamadas, sin demoras. |
| 🎯 | Demanda que llega sola | Tu local aparece frente a cientos de jugadores activos buscando cancha en tu zona. |
| 📈 | Dashboard completo | Reservas, ingresos, ocupación, horarios pico — toda la data que necesitas para crecer. |

---

## ✨ Feature Cards

| Icon | Feature | Description | Layout |
| --- | --- | --- | --- |
| 📋 | Gestión de reservas inteligente | Visualiza, confirma y gestiona todas las reservas. Soporte 4 jugadores, calendario visual, detección de conflictos. | **Featured** (2x2 with live preview mockup) |
| 📅 | Horarios y calendario | Horarios de apertura, horas pico, días especiales. Vista de calendario por día y semana con zonas visuales. | Standard card |
| 💰 | Precios dinámicos | Precios base y markups por hora pico. Calculadora de ingresos estimados. | Standard card |
| 🏟️ | Gestión de canchas | Hasta 10 canchas por local. Tipo de cancha, estado, imágenes y precios individuales. | Standard card |
| 👥 | Equipo y roles | Invita a tu equipo con roles definidos. Org Admins ven todo, managers solo sus locales. | Standard card |
| 🏢 | Multi-local | Gestiona múltiples sedes desde un solo panel con switching instantáneo. | Standard card |

---

## 🔄 How it Works (3 Steps)

| Step | Icon | Title | Description |
| --- | --- | --- | --- |
| 1 | ✍️ | Solicita acceso | Completa el formulario con los datos de tu local. Revisamos en menos de 24 horas y te enviamos tu invitación. |
| 2 | ⚙️ | Configura tu local | Agrega tus canchas, define horarios y precios. Nuestro wizard te guía paso a paso — en 15 minutos estás listo. |
| 3 | 🎾 | Recibe reservas | Tu local aparece en la app de jugadores. Las reservas llegan automáticamente a tu dashboard. |

---

## ⚖️ Comparison Table

| Característica | PadelHub | Software tradicional |
| --- | --- | --- |
| Marketplace de jugadores | ✅ | ❌ |
| Demanda orgánica de nuevos jugadores | ✅ | ❌ |
| Dashboard de gestión | ✅ | ✅ |
| App móvil para jugadores | ✅ | ❌ |
| Social matchmaking | ✅ | ❌ |
| Soporte multi-local | ✅ | ✅ |
| Sin costo de setup | ✅ | ❌ |
| Enfocado en padel (Perú) | ✅ | ❌ |

---

## 🎨 Design Specifications

### Typography

| Element | Font | Weight | Size |
| --- | --- | --- | --- |
| Display headings | Sora | 700-800 | 36-52px |
| Body text | DM Sans | 400-500 | 14-18px |
| Buttons | DM Sans | 600 | 14-16px |
| Eyebrow labels | DM Sans | 600 | 13px uppercase |

### Colors

Uses PadelHub design system colors:

- **Primary:** `#3B82F6` (actions, links, CTA buttons)
- **Secondary:** `#10B981` (success states, solution cards)
- **Amber:** `#F59E0B` (peak pricing, warnings)
- **Red:** `#EF4444` (problem cards accent)
- **Dark:** `#0F172A` (dark sections background)

### Layout

- Max width: `1200px`
- Section padding: `100px` vertical
- Border radius: `12px` (cards), `14px` (buttons), `28px` (large containers)
- Responsive breakpoints: 1024px (2-col), 768px (1-col)

---

## 🖥️ Navbar Behavior

| State | Background | Padding | Border |
| --- | --- | --- | --- |
| Default (top) | Transparent | 16px vertical | None |
| Scrolled (>50px) | `rgba(255,255,255,0.92)`  • blur(20px) | 12px vertical | Bottom border gray-200 |

### Navbar Links

| Link | Action |
| --- | --- |
| Funcionalidades | Scroll to `#features` |
| Cómo funciona | Scroll to `#como-funciona` |
| Comparación | Scroll to `#comparacion` |
| Iniciar sesión | Navigate to `/login` |
| Solicitar Acceso | Scroll to `#solicitar` |

---

## 📱 Hero Section Details

### Dashboard Mockup

Simulated browser window showing:

- **Sidebar:** 6 navigation items (Vista General active, Reservas, Canchas, Horarios, Precios, Configuración)
- **Stats row:** 3 cards (127 Reservas, 89% Ocupación, S/ 18.4k Ingresos)
- **Chart:** Bar chart showing "Reservas por día" with ascending trend

### Floating Cards

| Card | Position | Content | Animation |
| --- | --- | --- | --- |
| New bookings | Bottom-left of mockup | 🎾 "+3 reservas nuevas" / "Desde la app de jugadores" | Float up/down 3s infinite |
| Peak hours | Top-right of mockup | ⚡ "Hora pico activa" / "18:00 – 21:00" | Float up/down 3s infinite (1.5s delay) |

---

## 🔗 CTA Strategy

| Phase | CTA Label | Form Fields | Backend Action |
| --- | --- | --- | --- |
| MVP | "Solicitar Acceso" | Email only | `trpc.accessRequest.create({ email })` → Manual review → Send invite |
| Post-MVP | "Solicitar Acceso" | Name, email, facility name, district, courts, phone | `trpc.accessRequest.create({ ...fields })` → Admin review dashboard |

### CTA Locations

1. Navbar button (always visible)
2. Hero section (primary + secondary)
3. Bottom CTA section (email form)

---

## 💻 Developer Notes

### tRPC Procedures

```tsx
// accessRequest.router.ts
accessRequest.create.mutate({
  email: string,
  // Post-MVP fields:
  name?: string,
  facilityName?: string,
  district?: string,
  courtCount?: number,
  phone?: string
})
// Returns: { success: boolean, message: string }
// Side effects: 
//   - Stores request in access_requests table
//   - Sends notification to admin (email/Slack)
//   - Sends confirmation email to requester

accessRequest.list.query({ status?: 'pending' | 'approved' | 'rejected' })
// Admin only — for review dashboard

accessRequest.approve.mutate({ requestId: string })
// Triggers invitation email flow

accessRequest.reject.mutate({ requestId: string, reason?: string })
```

### Drizzle Schema

```tsx
export const accessRequests = pgTable('access_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  facilityName: text('facility_name'),
  district: text('district'),
  courtCount: integer('court_count'),
  phone: text('phone'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull().default('pending'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Route Configuration

```tsx
// Next.js App Router
// app/(public)/page.tsx → Landing page (no auth layout)
// app/(public)/layout.tsx → Public layout (no sidebar, no auth check)
// app/(dashboard)/layout.tsx → Authenticated layout (sidebar, auth required)
```

---

## 🚀 Post-MVP Enhancements

- Replace email-only CTA with full "Solicitar Acceso" form modal
- Add video demo / Loom walkthrough in hero
- Real testimonials with photos from partner facilities
- Dynamic stats pulled from API (`trpc.stats.publicMetrics`)
- Localized SEO content per Lima district
- Blog / resources section for padel facility management tips
- A/B test headline variations
- Analytics tracking (Posthog or Vercel Analytics)

---

## 🖼️ Wireframe

See: `00-web-landing.html`

---

**Last Updated:** February 18, 2026

**Version:** 1.0