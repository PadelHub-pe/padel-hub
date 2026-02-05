# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PadelHub** is a two-sided platform connecting padel players with court facilities in Lima, Peru. Built on T3 Stack (create-t3-turbo) with Turborepo, pnpm workspaces, and full-stack TypeScript with tRPC.

### Applications
- **Mobile App** (Expo): Player-facing app for court discovery, booking, and open match coordination
- **Web Dashboard** (Next.js): Court owner dashboard for facility management, reservations, and analytics

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
pnpm dev:next         # Run only Next.js app
```

### Building & Quality
```bash
pnpm build            # Build all packages
pnpm lint             # ESLint across all workspaces
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Check Prettier formatting
pnpm format:fix       # Fix formatting
pnpm typecheck        # TypeScript type checking
```

### Database
```bash
pnpm db:push          # Push Drizzle schema to database
pnpm db:studio        # Open Drizzle Studio UI
pnpm auth:generate    # Regenerate Better Auth schema
```

### Other
```bash
pnpm ui-add           # Add shadcn/ui components interactively
pnpm turbo gen init   # Scaffold new package from templates
```

## Architecture

```
/apps
  ├─ nextjs           # Court Owner Dashboard (web)
  └─ expo             # Player App (iOS + Android)
/packages
  ├─ api              # tRPC v11 router definitions
  ├─ auth             # Better Auth authentication
  ├─ db               # Drizzle ORM + schema definitions
  ├─ ui               # Shared React components (shadcn-ui)
  └─ validators       # Shared Zod validation schemas
/tooling
  ├─ eslint           # ESLint presets (base, react, nextjs)
  ├─ prettier         # Prettier configuration
  ├─ tailwind         # Shared Tailwind CSS config
  └─ typescript       # Shared TypeScript configs
```

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
- `/org/padel-group-lima/facilities/abc123` - Facility dashboard
- `/org/padel-group-lima/facilities/abc123/courts` - Courts management

### Package Dependencies Flow
```
@wifo/db → @wifo/auth → @wifo/api → Apps
                ↓
           @wifo/validators
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

### tRPC Procedures
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints (defined in `packages/api/src/trpc.ts`)

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
