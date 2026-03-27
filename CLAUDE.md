# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PadelHub** is a two-sided platform connecting padel players with court facilities in Lima, Peru. Built on T3 Stack (create-t3-turbo) with Turborepo, pnpm workspaces, and full-stack TypeScript with tRPC.

### Applications

- **Mobile App** (Expo): Player-facing app for court discovery, booking, and open match coordination
- **Web Dashboard** (Next.js): Court owner dashboard for facility management, reservations, and analytics
- **Public Bookings** (Next.js): Player-facing booking page at `bookings.padelhub.pe/[facilitySlug]` — no account required, phone OTP verification
- **Admin Panel** (Next.js): Internal PadelHub admin panel for managing access requests and organizations
- **Landing Page** (Astro): B2B marketing page for facility owner lead generation ("Solicitar Acceso")

### Product Requirements

See `PRD.MD` for complete functional requirements, data models, and user flows.

## Domain Concepts

- **Organization**: A business entity that owns/manages one or more facilities
- **Facility**: A venue with one or more courts (also called "club" or "venue")
- **Court**: A single padel playing surface (indoor/outdoor)
- **Slot**: A bookable time period on a court (typically 60-120 minutes)
- **Booking**: A reservation by a player for a specific slot
- **Open Match**: A match where the host is seeking additional players (1-3 spots)
- **Join Request**: A player's request to join an open match (pending → accepted/declined)
- **Skill Category**: 6-1 scale (6=beginner, 1=professional) - note: lower is better

### Key Entities

```
Organization ─┬─► OrganizationMember (role: org_admin | facility_manager | staff)
              │
              └─► Facility ─► Court ─► Booking ◄── User (Player)
                                          │
                                          └─► OpenMatch ◄── JoinRequest
```

## Localization (MVP)

- **Language**: Spanish (Peru)
- **Currency**: PEN (Peruvian Sol) - prices stored as `priceInCents`
- **Timezone**: America/Lima (PET)
- **Date format**: DD/MM/YYYY

## Commands

### Development

```bash
pnpm dev              # Run all apps in watch mode
pnpm dev:next         # Run only Next.js app (http://localhost:3000)
pnpm dev:admin        # Run only Admin panel (http://localhost:3001)
pnpm dev:bookings     # Run only Public Bookings app (http://localhost:3002)
pnpm dev:landing      # Run only Astro landing page (http://localhost:4321)
```

### Building & Quality

```bash
pnpm build            # Build all packages
pnpm lint             # ESLint across all workspaces
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Check Prettier formatting
pnpm format:fix       # Fix formatting
pnpm typecheck        # TypeScript type checking
pnpm lint:ws          # Workspace dependency lint (sherif)
```

**IMPORTANT: Code quality checks are mandatory.** After writing or modifying code, always run `pnpm lint`, `pnpm format`, and `pnpm lint:ws` to verify compliance. Do NOT bypass lint rules with eslint-disable comments unless there is a genuine technical reason (e.g., library API constraints). Instead, fix the underlying issue:

- `no-non-null-assertion` → Add proper null checks or use `?? defaultValue`
- `no-unnecessary-condition` → Remove redundant optional chains or nullish coalescing
- `no-unused-vars` → Remove the unused import/variable
- `prefer-nullish-coalescing` → Use `??` instead of `||` (use ternary when empty-string-to-undefined conversion is needed)
- `require-await` → Remove `async` if no `await` is needed, or add `await` if it should be async
- `array-type` → Use `T[]` instead of `Array<T>`
- `consistent-type-imports` → Use `import type` for type-only imports
- `react-hooks/error-boundaries` → Move JSX rendering out of try/catch blocks

When `eslint-disable` is truly necessary, prefer block-scoped `/* eslint-disable */` / `/* eslint-enable */` over `eslint-disable-next-line` for multi-line expressions that Prettier may reformat.

### Database

```bash
pnpm db:push          # Push Drizzle schema to database
pnpm db:studio        # Open Drizzle Studio UI
pnpm db:seed          # Seed sample data (test accounts + facilities)
pnpm db:create-admin  # Add a platform admin user
pnpm db:reset         # Reset database and run migrations + seed
pnpm auth:generate    # Regenerate Better Auth schema
```

### Testing

```bash
pnpm test             # Run all tests with Vitest
```

- **Framework**: Vitest with `describe`/`it`/`expect`
- **Test files**: Co-located in `packages/*/src/__tests__/*.test.ts`
- **Current coverage**: `packages/api` (access-control, account, booking, booking-cancel, booking-list, booking-price, booking-status, calendar, dashboard, default-operating-hours, invite, last-admin, otp-store, pricing, public-booking, public-booking-mutations, public-booking-otp, schedule-utils, schedule, setup, slots, slugify, team, verification-token), `packages/whatsapp` (otp, otp-dev-mode, notifications), `packages/images` (upload, delete, URL builder), `apps/nextjs` (facility-switch-path), `packages/validators` (setup)
- **Conventions**: Helper factories (`makeMembership()`, `makeFacility()`), mock tRPC callers, constants for test IDs

### Other

```bash
pnpm ui-add           # Add shadcn/ui components interactively
pnpm email:dev        # React Email preview server (http://localhost:3333)
pnpm turbo gen init   # Scaffold new package from templates
```

## Commit Conventions

Format: `type(scope): message` (lowercase, imperative mood)

- **Types**: `feat`, `fix`, `refactor`, `chore`, `docs`
- **Scopes**: `web`, `bookings`, `admin`, `landing`, `repo`, `auth`, `db`, `api`, `images`, `whatsapp`
- Examples: `feat(web): add booking calendar view`, `chore(repo): fix lint and format issues`

## Architecture

```
/apps
  ├─ nextjs           # Court Owner Dashboard (web, port 3000)
  ├─ admin            # PadelHub Admin Panel (web, port 3001)
  ├─ bookings         # Public Booking Page (web, port 3002)
  ├─ landing          # B2B Landing Page (Astro)
  └─ expo             # Player App (iOS + Android)
/assets               # Brand assets (logos, favicons, OG images)
/packages
  ├─ api              # tRPC v11 router definitions
  ├─ auth             # Better Auth authentication
  ├─ db               # Drizzle ORM + schema definitions
  ├─ email            # Email templates & sending (React Email + Resend)
  ├─ images           # Cloudflare Images integration (upload, delete, URL builder)
  ├─ ui               # Shared React components (shadcn-ui)
  ├─ validators       # Shared Zod validation schemas
  └─ whatsapp         # WhatsApp OTP & notifications (Kapso SDK)
/tooling
  ├─ eslint           # ESLint presets (base, react, nextjs)
  ├─ prettier         # Prettier configuration
  ├─ tailwind         # Shared Tailwind CSS config
  └─ typescript       # Shared TypeScript configs
```

### Landing Page (`apps/landing`)

Astro app with zero-JS-by-default static sections and one React island for the email form.

- **Stack**: Astro 5, `@astrojs/react` (island), `@astrojs/vercel` adapter, Tailwind CSS v4
- **Output**: `server` mode — static pages prerendered, API endpoint as serverless function
- **Fonts**: Sora (display) + DM Sans (body) via Google Fonts
- **Pages**: `/` (landing), `/terminos`, `/privacidad`, `/api/access-request` (POST)
- **React island**: `AccessRequestForm.tsx` with `client:visible` (lazy hydration)
- **DB table**: `access_requests` — stores "Solicitar Acceso" email submissions

**Vercel deployment:**

- Root Directory: `apps/landing`
- Build Command: `astro build` (not `pnpm build`, to skip `with-env` on Vercel)
- Env var: `POSTGRES_URL` required for the API endpoint

**Scoped `<style>` in Astro pages** need `@reference "../styles/global.css"` to access Tailwind theme tokens (e.g., `font-display`, color vars). Use relative paths, not `~/` alias.

### Email Package (`packages/email`)

Transactional email system using React Email for templates and Resend for delivery.

- **Stack**: React Email, Resend, `@t3-oss/env-core`
- **Templates**: `src/templates/` — React components rendered to HTML
- **Senders**: `src/senders/` — High-level functions that compose template + delivery
- **Dev mode**: When `RESEND_API_KEY` is not set, emails log to console instead of sending
- **Preview**: `pnpm -F @wifo/email preview` opens React Email preview on `:3333`

**Templates:**

- `OrganizationInvite` — Team member invite (used by `org.inviteMember`, `org.resendInvite`)
- `AccessRequestApproval` — Congratulations email when admin approves access request
- `AccessRequestConfirmation` — Thank-you email when user submits on landing page
- `PasswordReset` — Password reset link (wired via Better Auth `sendResetPassword` hook)

**Public API** (exported from `@wifo/email`):

```typescript
import {
  sendAccessRequestApproval,
  sendAccessRequestConfirmation,
  sendOrganizationInvite,
  sendPasswordReset,
} from "@wifo/email";
```

**Environment**: Uses Vercel env vars (`VERCEL_ENV`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`) for `baseUrl` resolution. `RESEND_API_KEY` is optional in dev.

**Integration points:**

- `packages/api/src/router/admin.ts` — `sendAccessRequestApproval` on approve
- `packages/api/src/router/org.ts` — `sendOrganizationInvite` on invite/resend
- `apps/nextjs/src/auth/server.ts` — `sendPasswordReset` via `onSendResetPassword` callback
- `apps/landing/src/pages/api/access-request.ts` — `sendAccessRequestConfirmation` on submit

### Admin Panel (`apps/admin`)

Internal Next.js app for PadelHub platform administrators to manage access requests and organizations.

- **Stack**: Next.js 16, tRPC, TanStack Table, Better Auth, Tailwind CSS v4
- **Port**: 3001 (`pnpm dev:admin`)
- **Auth**: Cookie-based session with `platformAdmins` table check via `adminProcedure`
- **Middleware**: Redirects unauthenticated users to `/login`, authenticated `/` to `/access-requests`
- **Site protection**: Optional `ADMIN_SITE_PASSWORD` env var enables a `/gate` password page before any admin route

**Route structure:**

```
apps/admin/src/app/
├─ _components/admin-layout.tsx   # Sidebar + main content wrapper
├─ login/page.tsx                 # Login form
├─ access-requests/               # Manage access requests from landing page
│   ├─ page.tsx
│   └─ _components/
│       ├─ access-requests-columns.tsx
│       ├─ access-requests-view.tsx
│       ├─ approve-dialog.tsx      # Creates org + facility + invite on approve
│       └─ reject-dialog.tsx
├─ organizations/                  # View all organizations
│   ├─ page.tsx
│   └─ _components/
│       ├─ organizations-columns.tsx
│       └─ organizations-view.tsx
└─ api/
    ├─ auth/[...all]/route.ts     # Better Auth handler
    └─ trpc/[trpc]/route.ts       # tRPC handler
```

**Key flows:**

- **Approve access request** → Creates organization + facility shell (inactive) + org_admin invite (7-day token) + marks request as approved
- **Reject access request** → Marks request as rejected with optional notes

**tRPC procedures** (all use `adminProcedure`):

- `admin.getStats` - Platform overview (org/facility/user/pending counts)
- `admin.listAccessRequests` - Paginated list with status filter + search
- `admin.approveAccessRequest` - Full approval flow (org + facility + invite)
- `admin.rejectAccessRequest` - Reject with optional notes
- `admin.listOrganizations` - Paginated list with member/facility counts

**Database tables:**

- `platform_admins` - userId reference to `user` table, grants admin panel access
- `organization_invites` - Token-based invites (role, facilityIds, expiresAt, status)

**Seed data:** `owner@padelhub.pe` is seeded as a platform admin.

### Public Bookings App (`apps/bookings`)

Player-facing booking page deployed to `bookings.padelhub.pe`. Guest booking with WhatsApp OTP — no account required.

- **Stack**: Next.js 16, React 19, tRPC client, Tailwind CSS v4
- **Port**: 3002 (`pnpm dev:bookings`)
- **Auth**: None — phone verification via WhatsApp OTP (Kapso SDK)
- **Abuse prevention**: Cloudflare Turnstile (invisible CAPTCHA) + Upstash Redis rate limits + OTP

**Route structure:**

```
apps/bookings/src/app/
├─ [facilitySlug]/
│   ├─ page.tsx                     # Facility landing (info, photos, date picker)
│   ├─ _components/
│   │   ├─ facility-landing.tsx     # Main landing component
│   │   ├─ facility-header.tsx      # Name, address, district, court count
│   │   ├─ photo-carousel.tsx       # Embla carousel for facility photos
│   │   ├─ date-selector.tsx        # Date picker + "Reservar" CTA
│   │   └─ amenity-list.tsx         # Amenity chips
│   ├─ book/
│   │   ├─ page.tsx                 # Court & time slot selection
│   │   └─ _components/
│   │       ├─ booking-page.tsx     # Duration tabs + slot grid
│   │       └─ slot-grid.tsx        # Available slot cards
│   ├─ confirm/
│   │   ├─ page.tsx                 # Contact info + OTP verification
│   │   └─ _components/
│   │       ├─ confirm-page.tsx     # Multi-step: name → OTP → confirm
│   │       ├─ booking-summary.tsx  # Price/time summary
│   │       └─ otp-input.tsx        # 6-digit OTP input
│   ├─ success/
│   │   ├─ page.tsx                 # Booking confirmation
│   │   └─ _components/
│   │       ├─ success-page.tsx     # Booking code + details
│   │       └─ calendar-link.tsx    # iCalendar export
│   └─ mis-reservas/
│       ├─ page.tsx                 # Guest booking history
│       └─ _components/
│           ├─ mis-reservas-page.tsx # Phone verify → booking list
│           └─ booking-card.tsx     # Booking card with cancel
└─ api/trpc/[trpc]/route.ts        # tRPC handler
```

**Key flows:**

- **View availability** → Fully public, no auth required
- **Make a booking** → Name + phone + WhatsApp OTP (once per device)
- **View my bookings** → Same verified phone (token in localStorage, 30-day TTL)

**OTP verification:**

1. Player enters phone → `sendOtp` (rate-limited: 5/phone/hour)
2. Kapso SDK sends WhatsApp AUTHENTICATION template with 6-digit code
3. Code stored in Redis (10-min TTL), max 5 verification attempts
4. On success → HMAC-signed token (`v1.{phone}.{expiresAt}.{signature}`)
5. Token stored in `localStorage` per facility → subsequent bookings skip OTP

**Slot generation** (`packages/api/src/utils/slots.ts`):

Pure function `getAvailableSlots()` — computes available time windows from schedule data. Composes `getTimeZoneWithMarkup()` + `getRateForSlot()`. Inputs: operating hours, peak periods, blocked slots, existing bookings, allowed durations. Returns `AvailableSlot[]` with pricing.

**Environment:**

- Inherits root `.env` (`POSTGRES_URL`, `AUTH_SECRET`)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile
- `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH` — Image delivery

### WhatsApp Package (`packages/whatsapp`)

WhatsApp integration via Kapso SDK for OTP delivery and booking notifications.

- **Stack**: Kapso WhatsApp Cloud API SDK, `@t3-oss/env-core`, Zod
- **Exports**: `@wifo/whatsapp` (sendOtp, sendBookingConfirmation, generateOtpCode, whatsappConfig)
- **Dev mode**: When `KAPSO_API_KEY` is not set, messages log to console instead of sending

**Public API** (exported from `@wifo/whatsapp`):

```typescript
import {
  sendOtp,
  sendBookingConfirmation,
  generateOtpCode,
  whatsappConfig,
} from "@wifo/whatsapp";
```

**WhatsApp templates** (pre-approved in Kapso):

- `booking_verification` — AUTHENTICATION template with COPY_CODE button (OTP delivery)
- `booking_confirmation` — UTILITY template with booking details (court, date, time, code)

**Environment**: `KAPSO_API_KEY` (optional — dev mode logs to console), `WHATSAPP_PHONE_NUMBER_ID`.

**Integration points:**

- `packages/api/src/router/public-booking.ts` — `sendOtp` in OTP procedures, `sendBookingConfirmation` after booking creation
- `packages/api/src/lib/otp-store.ts` — Redis-backed OTP storage with in-memory fallback
- `packages/api/src/lib/otp-rate-limit.ts` — Upstash sliding window rate limiter
- `packages/api/src/lib/verification-token.ts` — HMAC-signed phone verification tokens

### Web Dashboard Route Structure

The Next.js dashboard uses a multi-organization architecture. All users belong to at least one organization, even if they only manage a single facility.

```
apps/nextjs/src/app/
├─ (auth)/                    # Public auth pages (login, register)
├─ (org)/                     # Organization-scoped routes (main dashboard)
│   └─ org/
│       ├─ _components/       # Shared org components (OrgSidebar)
│       └─ [orgSlug]/         # Dynamic org segment
│           ├─ layout.tsx     # Auth validation only (no sidebar)
│           ├─ (org-view)/    # Org-level views with OrgSidebar
│           │   ├─ layout.tsx # Renders OrgSidebar
│           │   ├─ facilities/
│           │   │   ├─ page.tsx           # Facilities list
│           │   │   └─ _components/       # FacilityCard, filters, etc.
│           │   └─ settings/              # Org settings (team, profile)
│           │       └─ _components/       # TeamTab, InviteDialog, EditMemberDialog
│           └─ (facility-view)/           # Facility-level views with FacilitySidebar
│               └─ facilities/
│                   └─ [facilityId]/
│                       ├─ layout.tsx     # Renders FacilitySidebar
│                       ├─ page.tsx       # Facility dashboard (default)
│                       ├─ courts/        # Courts management (list, new, [courtId]/edit)
│                       ├─ bookings/      # Bookings list, [bookingId] detail, calendar/
│                       ├─ schedule/      # Operating hours management
│                       ├─ pricing/       # Court pricing management
│                       ├─ setup/         # Onboarding wizard (3 steps)
│                       ├─ settings/      # Facility settings
│                       └─ ...
```

**Key routing patterns:**

- Route groups `(org-view)` and `(facility-view)` prevent layout nesting - each has its own sidebar
- `[orgSlug]` layout handles auth validation, child layouts handle sidebars
- Facility root (`/org/[orgSlug]/facilities/[facilityId]`) renders the dashboard directly
- Use `useParams()` to get `orgSlug` and `facilityId` for building navigation links

**URL examples:**

- `/org/padel-group-lima/facilities` - List all facilities
- `/org/padel-group-lima/settings` - Org settings (team, profile)
- `/org/padel-group-lima/facilities/new` - Quick create facility form
- `/org/padel-group-lima/facilities/abc123` - Facility dashboard
- `/org/padel-group-lima/facilities/abc123/setup` - Setup wizard (courts + schedule)
- `/org/padel-group-lima/facilities/abc123/courts` - Courts management
- `/org/padel-group-lima/facilities/abc123/bookings` - Bookings list
- `/org/padel-group-lima/facilities/abc123/bookings/calendar` - Calendar view
- `/org/padel-group-lima/facilities/abc123/schedule` - Operating hours, peak periods, blocked slots
- `/org/padel-group-lima/facilities/abc123/pricing` - Default/court pricing, revenue calculator
- `/org/padel-group-lima/facilities/abc123/settings` - Facility settings

**Facility Onboarding Flow:**

1. Quick Create (`/facilities/new`) - Creates inactive facility with minimal fields (name, address, district, slug auto-generated)
2. Setup Wizard (`/facilities/[id]/setup`) - 3-step wizard:
   - Step 1: Courts (individual CRUD, each court persisted immediately with pricing)
   - Step 2: Schedule (operating hours per day, "Aplicar a todos" bulk action)
   - Step 3: Photos & Amenities (optional, not blocking activation)
3. Complete Setup - Validates courts + schedule + pricing → activates facility (`onboardingCompletedAt`, `isActive=true`)

Incomplete facilities show "Pendiente" badge on cards and setup banner on dashboard. Wizard auto-resumes from the correct step based on progress.

### Brand Assets (`/assets`)

Organized brand assets with three color variants (fullcolor, navy, reversed) and multiple densities (@1x, @2x, @3x):

| Folder        | Contents                                      |
| ------------- | --------------------------------------------- |
| `logomark/`   | Icon-only logo (padel ball shape, blue+green) |
| `horizontal/` | Icon + "PadelHub" text side by side           |
| `stacked/`    | Icon + text stacked vertically                |
| `wordmark/`   | Text-only "PadelHub"                          |
| `favicons/`   | PNG at 16, 32, 48, 180, 192, 512px            |
| `app-icons/`  | Android + iOS app icons                       |
| `social/`     | Avatar, OG images                             |

**Color variants:**

- `fullcolor` — Blue (#3B82F6) + green (#10B981) + navy text
- `navy` — All navy monochrome
- `reversed` — All white (for dark backgrounds)

Landing page copies the needed assets to `apps/landing/public/images/` (logomark, horizontal logos, OG image) and `apps/landing/public/` (favicons).

### Images Package (`packages/images`)

Cloudflare Images integration for direct browser uploads and server-side management.

- **Stack**: Cloudflare Images API, `@t3-oss/env-core`, Zod
- **Exports**: `@wifo/images` (upload, delete, config), `@wifo/images/url` (URL builder), `@wifo/images/env` (env validation)
- **Upload flow**: Direct Creator Upload — server gets one-time upload URL from Cloudflare → client uploads directly → server confirms

**Entity types** (`facility`, `court`, `organization`, `user`):

- `facility` — gallery mode (up to 10 photos, stored as `photos: string[]`)
- `court`, `organization`, `user` — single image mode (1 image, stored as URL string)

**tRPC router** (`images.*`): `getUploadUrl`, `confirmUpload`, `delete`, `reorder` — all use `protectedProcedure` with entity-scoped access control.

**URL helpers** (`@wifo/images/url`):

- `getImageUrl(imageId, variant)` — single image URL
- `getImageSrcSet(imageId)` — responsive srcset (thumbnail, card, gallery)
- `getAvatarUrl(imageId)` — avatar variant

**Variants**: `thumbnail` (200px), `card` (400px), `gallery` (800px), `full` (1600px), `avatar` (96px).

### Package Dependencies Flow

```
@wifo/db → @wifo/auth → @wifo/api → Apps
                ↓            ↑
           @wifo/validators  @wifo/email
                ↓            ↑
           @wifo/ui     @wifo/images
                             ↑
                        @wifo/whatsapp
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5.9, Tailwind CSS v4
- **Backend/API**: tRPC v11, Better Auth, Drizzle ORM
- **Database**: PostgreSQL (Supabase/Vercel Postgres)
- **Validation**: Zod v4
- **Build**: Turborepo, pnpm workspaces
- **Node**: ^22.21.0, pnpm ^10.19.0

## Key Patterns

### Date Handling

- Use `date-fns` and `date-fns-tz` for all date manipulation and formatting
- Default timezone: `America/Lima` (PET, UTC-5)
- Store dates in database as timestamps
- Format dates for display using `format()` from date-fns with Spanish locale
- Use `startOfDay()`, `endOfDay()`, `addDays()` for date range calculations
- Example:

  ```typescript
  import { addDays, format, startOfDay } from "date-fns";
  import { toZonedTime } from "date-fns-tz";
  import { es } from "date-fns/locale";

  const TIMEZONE = "America/Lima";
  const limaDate = toZonedTime(new Date(), TIMEZONE);
  const formatted = format(limaDate, "dd/MM/yyyy", { locale: es });
  ```

### Tables (Web Dashboard)

- Use TanStack Table (`@tanstack/react-table`) for all data tables in the Next.js dashboard
- Reusable DataTable component: `apps/nextjs/src/components/ui/data-table.tsx`
- Define columns in separate `*-columns.tsx` files for each table
- Pattern:

  ```typescript
  // Define column definitions
  import type { ColumnDef } from "@tanstack/react-table";

  export interface MyDataRow {
    id: string;
    // ... fields
  }

  export function getMyDataColumns(): ColumnDef<MyDataRow>[] {
    return [
      { accessorKey: "id", header: "ID", cell: ({ row }) => row.original.id },
      // ... more columns
    ];
  }

  // Use in component
  import { DataTable } from "~/components/ui/data-table";
  import { getMyDataColumns } from "./my-data-columns";

  const columns = useMemo(() => getMyDataColumns(), []);
  return <DataTable columns={columns} data={data} onRowClick={handleClick} />;
  ```

### Forms (Web Dashboard)

- Use React Hook Form (`react-hook-form`) with Zod validation for all forms
- Form components available from `@wifo/ui/form`
- Pattern:

  ```typescript
  import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
  import { useForm } from "react-hook-form";
  import { z } from "zod";
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@wifo/ui/form";
  import { Input } from "@wifo/ui/input";
  import { Button } from "@wifo/ui/button";

  // 1. Define schema with Zod
  const myFormSchema = z.object({
    name: z.string().min(2, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
  });

  type MyFormValues = z.infer<typeof myFormSchema>;

  // 2. Create form with useForm hook
  function MyFormComponent() {
    const form = useForm<MyFormValues>({
      resolver: standardSchemaResolver(myFormSchema),
      defaultValues: { name: "", email: "" },
    });

    async function onSubmit(values: MyFormValues) {
      // Handle submission
      // Use form.setError("root", { message: "..." }) for API errors
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Root error for API/server errors */}
          {form.formState.errors.root && (
            <div className="text-sm text-red-500">
              {form.formState.errors.root.message}
            </div>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </Form>
    );
  }
  ```

- Key features:
  - `standardSchemaResolver` integrates Zod v4 schemas with react-hook-form (Zod v4 implements Standard Schema)
  - `FormMessage` automatically displays field errors
  - Use `form.setError("root", ...)` for server/API errors
  - Use `form.formState.isSubmitting` for loading states
  - Error messages should be in Spanish

### Facility Setup Components

Reusable setup wizard components in `apps/nextjs/src/components/facility-setup/`:

- `StepIndicator` - Progress indicator with configurable step labels
- `StepCourts` - Court CRUD with individual persist (name, type, pricing per court)
- `StepSchedule` - Operating hours per day with "Aplicar a todos" bulk action
- `StepPhotos` - Facility photo upload (Cloudflare Images gallery mode, up to 10)
- `AmenityChips` - Amenity selection with chip-style toggles
- `SetupComplete` - Completion screen with summary, warnings, and navigation

```typescript
import { StepIndicator, StepCourts, StepSchedule, StepPhotos, AmenityChips } from "~/components/facility-setup";

// StepIndicator props
<StepIndicator
  currentStep={1}
  steps={[{ label: "Courts" }, { label: "Schedule" }]}
/>

// StepCourts with controlled state
const [courts, setCourts] = useState([{ name: "", type: "indoor" }]);
<StepCourts courts={courts} onChange={setCourts} />

// StepSchedule with controlled state
const [schedule, setSchedule] = useState({ days: [...], defaultPrice: 5000 });
<StepSchedule schedule={schedule} onChange={setSchedule} />
```

### tRPC Routers & Procedures

**Procedure types** (defined in `packages/api/src/trpc.ts`):

- `publicProcedure` — No auth required, timing middleware only
- `protectedProcedure` — Requires authenticated session (`ctx.session.user`)
- `adminProcedure` — Requires `platformAdmins` table entry (admin panel only)

**Router overview** (`packages/api/src/router/`):

| Router      | Key Procedures                                                                                                        | Auth             |
| ----------- | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `admin`     | getStats, listAccessRequests, approveAccessRequest, rejectAccessRequest, listOrganizations                            | admin            |
| `org`       | getMyOrganizations, getFacilities, getStats, updateFacilityStatus, getFacilityManagers, getDistricts, createFacility, getOrgProfile, updateOrgProfile, getTeamMembers, inviteMember, updateMember, removeMember, cancelInvite, resendInvite | protected        |
| `invite`    | validate, accept, acceptExisting, getPendingInvites                                                                   | public/protected |
| `facility`  | getProfile, updateProfile, getSetupStatus, saveCourts, saveSchedule, completeSetup                                    | protected        |
| `court`     | list, getById, getStats, create, update, updateStatus, delete                                                         | protected        |
| `booking`   | list, getById, confirm, cancel, updateStatus, createManual, getStats, addPlayer, removePlayer, getActivity, searchUsers, getSlotInfo, calculatePrice | protected        |
| `calendar`  | getDayView, getWeekView, getDayStats, getMonthBookingDates                                                            | protected        |
| `schedule`  | operating hours (get/update), peak periods (get/create/update/delete), blocked slots (get/list/checkConflicts/block/delete), getDayOverview | protected |
| `pricing`   | getOverview, updateDefaultRates, updateCourtPricing, resetCourtPricing, calculateRevenue                              | protected        |
| `dashboard` | getStats, getTodaySchedule (facility dashboard)                                                                       | protected        |
| `account`   | getMyProfile, updateMyProfile, getSecurityInfo                                                                        | protected        |
| `publicBooking` | getFacility, getAvailableSlots, calculatePrice, sendOtp, verifyOtp, createBooking, getMyBookings, cancelBooking   | public           |
| `images`    | getUploadUrl, confirmUpload, delete, reorder                                                                          | protected        |
| `auth`      | getSession                                                                                                            | public           |

### RBAC & Access Control

Centralized in `packages/api/src/lib/access-control.ts`. All facility-scoped routers use `verifyFacilityAccess(ctx, facilityId, permission)`.

**Roles & permissions:**

| Permission           | `org_admin` | `facility_manager` | `staff` |
| -------------------- | :---------: | :----------------: | :-----: |
| `facility:read`      |     all     |        all         | scoped  |
| `facility:write`     |     all     |       scoped       |   no    |
| `booking:read/write` |     all     |       scoped       | scoped  |
| `court:write`        |     all     |       scoped       |   no    |
| `schedule:write`     |     all     |       scoped       |   no    |
| `pricing:write`      |     all     |       scoped       |   no    |
| `team:manage`        |     yes     |         no         |   no    |

**Facility scoping** (via `facilityIds` array on membership):

- `org_admin` — empty = all facilities
- `facility_manager` — empty = all facilities
- `staff` — empty = no access (must be explicitly assigned)

**UI enforcement** (Next.js hooks in `apps/nextjs/src/hooks/`):

- `usePermission(role)` — Returns `canManageOrg`, `canConfigureFacility`, `canInviteStaff`, `canManageBookings`, `canViewReports`
- `useFacilityContext()` — Returns `orgSlug`, `facilityId`, `basePath` for facility-scoped pages

### Schedule & Pricing Utilities

Shared zone calculation in `packages/api/src/utils/schedule.ts` — pure functions, no DB dependencies:

- `getTimeZone(time, dayOfWeek, date, config)` → `'closed' | 'regular' | 'peak' | 'blocked'`
- `getTimeZoneWithMarkup(...)` → zone + `markupPercent`
- `getRateForSlot(court, zone, facilityDefaults)` → cents (fallback chain: court → facility defaults → 0)
- `parseTimeToMinutes(time)` → minutes since midnight

**Pricing model:**

- Facility has `defaultPriceInCents` and `defaultPeakPriceInCents` (nullable)
- Courts with `priceInCents IS NOT NULL` are "custom" — courts with `NULL` use facility defaults
- Peak pricing is **markup-based**: `markupPercent` on `peak_periods` table (0–200%)

### Booking Status Resolution

On-access status transitions in `packages/api/src/utils/booking-status.ts` — pure functions:

- `resolveBookingStatus(booking, now)` → detects `confirmed → in_progress` (at start time) and `in_progress → completed` (at end time)
- `resolveBookingStatuses(bookings, now)` → batch version, returns list of transitions needed

Persistence layer in `packages/api/src/lib/booking-status-persist.ts`:

- `resolveAndPersistBookingStatuses(db, bookings, now)` → resolves + batch-updates DB + logs `booking_activity` entries
- Integrated into `booking.list` and `booking.getById` — statuses auto-correct on every read

### Workspace Packages

- All internal packages use `workspace:*` specifier
- All packages prefixed with `@wifo/`

### Auth Schema Generation

- Better Auth CLI uses `packages/auth/script/auth-cli.ts` (separate from main export)
- Run `pnpm auth:generate` after database schema changes

### Environment Variables

Required in `.env` (copy from `.env.example`):

- `POSTGRES_URL` - Supabase/Vercel Postgres connection string
- `AUTH_SECRET` - Generate via `openssl rand -base64 32`
- `RESEND_API_KEY` - Resend API key for transactional emails (optional in dev — logs to console)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- OAuth credentials for player auth (Google, Apple per PRD requirements)

Optional:

- `ADMIN_SITE_PASSWORD` - Site-level password gate for admin panel
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis for OTP storage + rate limiting (falls back to in-memory)
- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_IMAGES_TOKEN` - Cloudflare Images API credentials
- `CLOUDFLARE_IMAGES_HASH` / `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH` - Cloudflare Images delivery hash
- `KAPSO_API_KEY` - Kapso WhatsApp API key for OTP & notifications (optional — dev mode logs to console)
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business phone number ID (Kapso)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile for public booking bot protection

## Testing Conventions

- **Framework**: Vitest with `describe`/`it`/`expect`
- **Location**: Co-located in `packages/*/src/__tests__/*.test.ts`
- **Current suites**: `access-control` (104), `account` (11), `booking` (54), `booking-cancel` (28), `booking-list` (23), `booking-price` (13), `booking-status` (19), `calendar` (21), `dashboard` (11), `default-operating-hours` (2), `invite` (24), `last-admin` (8), `otp-store` (7), `pricing` (27), `public-booking` (18), `public-booking-mutations` (31), `public-booking-otp` (13), `schedule-utils` (43), `schedule` (23), `setup` (46), `slots` (29), `slugify` (15), `team` (32), `verification-token` (10), `whatsapp/otp` (8), `whatsapp/notifications` (3), `whatsapp/otp-dev-mode` (2), `images` (21), `nextjs/facility-switch-path` (14), `validators` (1) — 661 total
- **Mocking**: `vi.mock()` for external modules, `vi.fn()` for DB methods, `vi.stubGlobal()` for fetch
- **Factory helpers**: `makeMembership()`, `makeInvite()`, `makeMemberWithUser()`, `makeOrg()`, `makePeakPeriod()`, `makeOperatingHour()`, `makeBooking()`, `makeBookingPlayer()` — return typed objects with optional overrides
- **tRPC testing**: Use `createCallerFactory(router)` to create server-side callers with mock context (`{ db, session, authApi }`)
- **Error assertions**: `expect(...).rejects.toThrow("Spanish error message")`
- **ESLint overrides**: Tests use `/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */` at file top for mock compatibility

```typescript
// Typical test setup pattern
const router = createTRPCRouter({ org: orgRouter });
const createCaller = createCallerFactory(router);
const caller = createCaller({
  db: mockDb as any,
  session: { user: { id: "user-1" } } as any,
  authApi: mockAuthApi as any,
});

// Factory pattern
function makeMembership(overrides?: Partial<OrgMember>) {
  return { id: "member-1", role: "org_admin", facilityIds: [], ...overrides };
}
```

## Initial Setup

```bash
pnpm install
cp .env.example .env  # Configure environment variables
pnpm supabase:start   # Start local Supabase (Docker required)
pnpm db:push          # Push schema to database
pnpm auth:generate    # Generate auth schema
pnpm db:seed          # Seed sample data
pnpm dev              # Start development
```

## Local Development with Supabase

### Prerequisites

- Docker Desktop must be running
- Supabase CLI installed (`brew install supabase/tap/supabase`)

### Commands

```bash
pnpm supabase:start   # Start local Supabase containers
pnpm supabase:stop    # Stop local Supabase containers
pnpm supabase:status  # Check status and get local URLs
pnpm db:reset         # Reset database and run migrations + seed
```

### Local URLs (when running)

| Service           | URL                                                     |
| ----------------- | ------------------------------------------------------- |
| API               | http://127.0.0.1:54321                                  |
| Database          | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio            | http://127.0.0.1:54323                                  |
| Inbucket (emails) | http://127.0.0.1:54324                                  |

### Switching between Local and Production

Update `POSTGRES_URL` in your `.env` file:

- **Local**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Production**: Use the Supabase cloud connection string
