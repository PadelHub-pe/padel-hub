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

- **Facility**: A venue with one or more courts (also called "club" or "venue")
- **Court**: A single padel playing surface (indoor/outdoor)
- **Slot**: A bookable time period on a court (typically 60-120 minutes)
- **Booking**: A reservation by a player for a specific slot
- **Open Match**: A match where the host is seeking additional players (1-3 spots)
- **Join Request**: A player's request to join an open match (pending → accepted/declined)
- **Skill Category**: 6-1 scale (6=beginner, 1=professional) - note: lower is better

### Key Entities
```
User (Player) ─┬─► Booking ◄── Court ◄── Facility ◄── OwnerAccount
               │      │
               │      └─► OpenMatch ◄── JoinRequest
               └──────────────┘
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
  ├─ tanstack-start   # Alternative web app (not used for MVP)
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
pnpm db:push          # Push schema to database
pnpm auth:generate    # Generate auth schema
pnpm dev              # Start development
```
