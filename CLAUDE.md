# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PadelHub** is a two-sided platform connecting padel players with court facilities in Lima, Peru. Built on T3 Stack (create-t3-turbo) with Turborepo, pnpm workspaces, and full-stack TypeScript with tRPC.

### Applications
- **Mobile App** (Expo): Player-facing app for court discovery, booking, and open match coordination
- **Web Dashboard** (Next.js): Court owner dashboard for facility management, reservations, and analytics
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

### Other
```bash
pnpm ui-add           # Add shadcn/ui components interactively
pnpm email:dev        # React Email preview server (http://localhost:3333)
pnpm turbo gen init   # Scaffold new package from templates
```

## Commit Conventions

Format: `type(scope): message` (lowercase, imperative mood)

- **Types**: `feat`, `fix`, `refactor`, `chore`, `docs`
- **Scopes**: `web`, `admin`, `landing`, `repo`, `auth`, `db`
- Examples: `feat(web): add booking calendar view`, `chore(repo): fix lint and format issues`

## Architecture

```
/apps
  ├─ nextjs           # Court Owner Dashboard (web, port 3000)
  ├─ admin            # PadelHub Admin Panel (web, port 3001)
  ├─ landing          # B2B Landing Page (Astro)
  └─ expo             # Player App (iOS + Android)
/assets               # Brand assets (logos, favicons, OG images)
/packages
  ├─ api              # tRPC v11 router definitions
  ├─ auth             # Better Auth authentication
  ├─ db               # Drizzle ORM + schema definitions
  ├─ email            # Email templates & sending (React Email + Resend)
  ├─ ui               # Shared React components (shadcn-ui)
  └─ validators       # Shared Zod validation schemas
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
  sendOrganizationInvite,
  sendAccessRequestApproval,
  sendAccessRequestConfirmation,
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
│           │   └─ facilities/
│           │       ├─ page.tsx           # Facilities list
│           │       └─ _components/       # FacilityCard, filters, etc.
│           └─ (facility-view)/           # Facility-level views with FacilitySidebar
│               └─ facilities/
│                   └─ [facilityId]/
│                       ├─ layout.tsx     # Renders FacilitySidebar
│                       ├─ page.tsx       # Facility dashboard (default)
│                       ├─ courts/        # Courts management
│                       ├─ bookings/      # Bookings list & calendar
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
- `/org/padel-group-lima/facilities/new` - Quick create facility form
- `/org/padel-group-lima/facilities/abc123` - Facility dashboard
- `/org/padel-group-lima/facilities/abc123/setup` - Setup wizard (courts + schedule)
- `/org/padel-group-lima/facilities/abc123/courts` - Courts management

**Facility Onboarding Flow:**
1. Quick Create (`/facilities/new`) - Creates inactive facility with minimal fields
2. Setup Wizard (`/facilities/[id]/setup`) - Configure courts and schedule
3. Complete Setup - Activates facility (sets `onboardingCompletedAt`, `isActive=true`)

Incomplete facilities show "Pendiente" badge on cards and setup banner on dashboard.

### Brand Assets (`/assets`)

Organized brand assets with three color variants (fullcolor, navy, reversed) and multiple densities (@1x, @2x, @3x):

| Folder | Contents |
|--------|----------|
| `logomark/` | Icon-only logo (padel ball shape, blue+green) |
| `horizontal/` | Icon + "PadelHub" text side by side |
| `stacked/` | Icon + text stacked vertically |
| `wordmark/` | Text-only "PadelHub" |
| `favicons/` | PNG at 16, 32, 48, 180, 192, 512px |
| `app-icons/` | Android + iOS app icons |
| `social/` | Avatar, OG images |

**Color variants:**
- `fullcolor` — Blue (#3B82F6) + green (#10B981) + navy text
- `navy` — All navy monochrome
- `reversed` — All white (for dark backgrounds)

Landing page copies the needed assets to `apps/landing/public/images/` (logomark, horizontal logos, OG image) and `apps/landing/public/` (favicons).

### Package Dependencies Flow
```
@wifo/db → @wifo/auth → @wifo/api → Apps
                ↓            ↑
           @wifo/validators  @wifo/email
                ↓
           @wifo/ui
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
  import { format, startOfDay, addDays } from "date-fns";
  import { es } from "date-fns/locale";
  import { toZonedTime } from "date-fns-tz";

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
- `StepCourts` - Court creation form (add/remove courts with name + type)
- `StepSchedule` - Operating hours per day + default pricing

```typescript
import { StepIndicator, StepCourts, StepSchedule } from "~/components/facility-setup";

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

### tRPC Procedures
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints (defined in `packages/api/src/trpc.ts`)
- Use `adminProcedure` for admin-only endpoints (checks `platformAdmins` table)

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
| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio | http://127.0.0.1:54323 |
| Inbucket (emails) | http://127.0.0.1:54324 |

### Switching between Local and Production
Update `POSTGRES_URL` in your `.env` file:
- **Local**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Production**: Use the Supabase cloud connection string
