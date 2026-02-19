# PadelHub

A two-sided platform connecting padel players with court facilities in Lima, Peru.

- **Web Dashboard** (Next.js): Court owner dashboard for facility management, reservations, and analytics
- **Admin Panel** (Next.js): Internal platform admin for managing access requests and organizations
- **Landing Page** (Astro): B2B marketing page for facility owner lead generation
- **Mobile App** (Expo): Player-facing app for court discovery, booking, and open match coordination

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | ^22.21.0 | [nodejs.org](https://nodejs.org) or `nvm install 22` |
| **pnpm** | ^10.19.0 | `npm install -g pnpm@10.19.0` |
| **Docker Desktop** | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| **Supabase CLI** | Latest | `brew install supabase/tap/supabase` |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Verify Installation

```bash
node --version    # Should output v22.x.x
pnpm --version    # Should output 10.x.x
docker --version  # Should output Docker version x.x.x
supabase --version # Should output x.x.x
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/padel-hub.git
cd padel-hub
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

The default `.env` is configured for local development. No changes needed for local setup.

### 4. Start Local Supabase

Make sure Docker Desktop is running, then:

```bash
pnpm supabase:start
```

This starts the following local services:

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://127.0.0.1:54321 | Supabase API endpoint |
| **Database** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | PostgreSQL database |
| **Studio** | http://127.0.0.1:54323 | Database admin UI |
| **Inbucket** | http://127.0.0.1:54324 | Email testing inbox |

> **First time?** This will download Docker images (~2-3 GB). Subsequent starts are much faster.

### 5. Push Database Schema

```bash
pnpm db:push
```

This creates all the database tables defined in `packages/db/src/schema.ts`.

### 6. Generate Auth Schema

```bash
pnpm auth:generate
```

This generates the Better Auth tables for authentication.

### 7. Seed Sample Data

```bash
pnpm db:seed
```

This populates the database with sample data for development:
- 3 user accounts:
  - `owner@padelhub.pe` (password: `password123`) - Org Admin
  - `manager@padelhub.pe` (password: `password123`) - Facility Manager
  - `staff@padelhub.pe` (password: `password123`) - Staff
- 1 organization: "Padel Group Lima" (slug: `padel-group-lima`)
- 3 facilities across San Isidro, Miraflores, and La Molina districts
- 9 courts (3 per facility)
- 17 sample bookings with various statuses

### 8. Start the Development Server

```bash
pnpm dev:next
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Local Development

### Starting Your Development Session

```bash
# 1. Start Docker Desktop (if not running)

# 2. Start Supabase
pnpm supabase:start

# 3. Start the Next.js dev server
pnpm dev:next
```

### Stopping Your Development Session

```bash
# Stop the dev server (Ctrl+C)

# Stop Supabase containers
pnpm supabase:stop
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:next` | Start Next.js development server |
| `pnpm dev:admin` | Start Admin panel (port 3001) |
| `pnpm dev:landing` | Start Landing page (port 4321) |
| `pnpm supabase:start` | Start local Supabase containers |
| `pnpm supabase:stop` | Stop local Supabase containers |
| `pnpm supabase:status` | Check Supabase status and URLs |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Drizzle Studio (database UI) |
| `pnpm db:reset` | Reset database (drop all data, re-run migrations and seed) |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm format` | Check Prettier formatting |
| `pnpm format:fix` | Fix formatting issues |

### Accessing the Database

**Option 1: Supabase Studio (Recommended)**

Open [http://127.0.0.1:54323](http://127.0.0.1:54323) in your browser for a visual database admin.

**Option 2: Drizzle Studio**

```bash
pnpm db:studio
```

**Option 3: Direct Connection**

Use any PostgreSQL client with:
- Host: `127.0.0.1`
- Port: `54322`
- Database: `postgres`
- User: `postgres`
- Password: `postgres`

### Viewing Test Emails

When the app sends emails (e.g., password reset), they're captured by Inbucket instead of being sent.

Open [http://127.0.0.1:54324](http://127.0.0.1:54324) to view captured emails.

---

## Project Structure

```
padel-hub/
├── apps/
│   ├── nextjs/              # Court Owner Dashboard (Web, port 3000)
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router pages
│   │   │   │   ├── (auth)/  # Authentication pages (login, register)
│   │   │   │   └── (org)/   # Organization-scoped routes (main dashboard)
│   │   │   │       └── org/[orgSlug]/
│   │   │   │           ├── (org-view)/      # Org-level views (facilities list)
│   │   │   │           └── (facility-view)/ # Facility-level views (dashboard, courts, etc.)
│   │   │   ├── components/  # Shared React components
│   │   │   └── trpc/        # tRPC client setup
│   │   └── public/          # Static assets
│   ├── admin/               # PadelHub Admin Panel (Web, port 3001)
│   ├── landing/             # B2B Landing Page (Astro, port 4321)
│   └── expo/                # Player Mobile App (not covered here)
│
├── packages/
│   ├── api/                 # tRPC API Router
│   │   └── src/
│   │       ├── router/      # Route handlers (booking.ts, court.ts, org.ts, etc.)
│   │       ├── root.ts      # Root router combining all routes
│   │       └── trpc.ts      # tRPC context and procedures
│   │
│   ├── auth/                # Authentication (Better Auth)
│   │   └── src/
│   │       └── index.ts     # Auth configuration
│   │
│   ├── db/                  # Database (Drizzle ORM)
│   │   └── src/
│   │       ├── schema.ts    # Database schema (includes organizations, organizationMembers)
│   │       ├── client.ts    # Database client
│   │       └── seed.ts      # Seed data script
│   │
│   ├── email/               # Transactional Emails (React Email + Resend)
│   │   └── src/
│   │       ├── templates/   # React Email templates (OrganizationInvite, PasswordReset, etc.)
│   │       ├── senders/     # High-level send functions
│   │       └── index.ts     # Public API exports
│   │
│   ├── ui/                  # Shared UI Components (shadcn/ui)
│   │   └── src/
│   │       └── *.tsx        # Button, Input, Dialog, etc.
│   │
│   └── validators/          # Shared Zod Schemas
│
├── supabase/                # Supabase Local Configuration
│   └── config.toml          # Local Supabase settings
│
├── tooling/                 # Shared Tooling Configs
│   ├── eslint/
│   ├── prettier/
│   ├── tailwind/
│   └── typescript/
│
├── .env.example             # Environment variables template
├── CLAUDE.md                # AI assistant instructions
├── package.json             # Root package.json with scripts
└── turbo.json               # Turborepo configuration
```

### Web Dashboard URL Structure

The dashboard supports multi-organization management:

| URL Pattern | Description |
|-------------|-------------|
| `/org/[orgSlug]/facilities` | List all facilities for an organization |
| `/org/[orgSlug]/facilities/[facilityId]` | Facility dashboard |
| `/org/[orgSlug]/facilities/[facilityId]/courts` | Manage courts |
| `/org/[orgSlug]/facilities/[facilityId]/bookings` | View bookings |
| `/org/[orgSlug]/facilities/[facilityId]/bookings/calendar` | Calendar view |

Example: `/org/padel-group-lima/facilities/abc123/courts`

---

## Development Workflow

### Making Database Schema Changes

1. **Edit the schema** in `packages/db/src/schema.ts`

2. **Push changes to the database**:
   ```bash
   pnpm db:push
   ```

3. **If you added auth-related tables**, regenerate the auth schema:
   ```bash
   pnpm auth:generate
   ```

### Adding a New API Endpoint

1. **Create or edit a router** in `packages/api/src/router/`

2. **Register the router** in `packages/api/src/root.ts` (if new)

3. **Use in your component**:
   ```typescript
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.yourRouter.yourProcedure.queryOptions());
   ```

### Adding UI Components

```bash
pnpm ui-add
```

This opens an interactive CLI to add shadcn/ui components to `packages/ui`.

### Creating a New Page

**For org-level pages** (e.g., organization settings, team management):
1. Create folder in `apps/nextjs/src/app/(org)/org/[orgSlug]/(org-view)/your-page/`
2. Add `page.tsx` and `_components/` folder

**For facility-level pages** (e.g., reports, analytics for a specific facility):
1. Create folder in `apps/nextjs/src/app/(org)/org/[orgSlug]/(facility-view)/facilities/[facilityId]/your-page/`
2. Add `page.tsx` and `_components/` folder
3. Use `useParams()` to get `orgSlug` and `facilityId` for navigation links

```tsx
// Example: Getting route params for navigation
const params = useParams();
const orgSlug = params.orgSlug as string;
const facilityId = params.facilityId as string;
const basePath = `/org/${orgSlug}/facilities/${facilityId}`;
```

### Patterns to Follow

- **Tables**: Use TanStack Table via `~/components/ui/data-table.tsx`
- **Dates**: Use `date-fns` with Spanish locale (`es`) and Lima timezone
- **Forms**: Use React Hook Form with Zod validation
- **State**: Use TanStack Query for server state, React state for UI state

---

## Common Tasks

### Reset the Database

If you need a fresh database:

```bash
pnpm db:reset
```

This drops all tables, re-runs migrations, and seeds sample data.

### Update Sample Data

Edit `packages/db/src/seed.ts` and run:

```bash
pnpm db:seed
```

### Check for Type Errors

```bash
pnpm typecheck
```

### Format Code

```bash
pnpm format:fix
```

### Lint Code

```bash
pnpm lint:fix
```

---

## Troubleshooting

### Supabase won't start

**Check Docker is running:**
```bash
docker ps
```
If you see "Cannot connect to the Docker daemon", start Docker Desktop.

**Check if ports are in use:**
```bash
lsof -i :54321
lsof -i :54322
```
Kill any processes using these ports or stop other Supabase instances.

**Reset Supabase:**
```bash
pnpm supabase:stop
docker system prune -f  # Clean up Docker (optional)
pnpm supabase:start
```

### Database connection errors

**Verify Supabase is running:**
```bash
pnpm supabase:status
```

**Check your `.env` file:**
```bash
# Should be:
POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Schema push fails

**Reset and try again:**
```bash
pnpm db:reset
pnpm db:push
```

### "Module not found" errors

**Rebuild packages:**
```bash
pnpm clean
pnpm install
pnpm build
```

### Type errors after schema changes

**Regenerate types:**
```bash
pnpm db:push
pnpm auth:generate
```

---

## Environment Variables

| Variable | Description | Default (Local) |
|----------|-------------|-----------------|
| `POSTGRES_URL` | Database connection string | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| `AUTH_SECRET` | Better Auth secret key | `supersecret` |
| `RESEND_API_KEY` | Resend API key for emails | Not set (logs to console) |

For production, you'll need:
- A Supabase cloud project connection string
- A secure `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- A Resend API key for transactional emails
- OAuth credentials for Google/Apple sign-in

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
