# Image System - Technical Plan

## 1. Context

### What Exists Today

**Database columns already support image storage:**

| Entity | Column | Type | Current Usage |
|--------|--------|------|---------------|
| `facilities` | `photos` | `jsonb("photos").$type<string[]>()` | Unsplash placeholder URLs |
| `courts` | `imageUrl` | `text("image_url")` | Single URL string |
| `organizations` | `logoUrl` | `text("logo_url")` | Nullable, unused |
| `user` (Better Auth) | `image` | `text("image")` | Google avatar URL or null |

**UI components with image display:**
- `facility-card.tsx` - Shows `photos[0]` as `<img>` with Unsplash fallback
- `photo-section.tsx` (court detail) - URL text input + background-image preview
- `org-profile-tab.tsx` - "La carga de foto estara disponible proximamente" placeholder
- `avatar.tsx` (shadcn) - Radix Avatar with image + fallback

**No upload infrastructure exists:** No file handling, no CDN config, no presigned URLs.

### Conventions to Follow

- Package naming: `@wifo/images` (not `@padelhub/images` — all packages use `@wifo/` prefix)
- Package structure: Follow `packages/email` pattern (barrel export, `compiled-package.json` tsconfig)
- Env validation: `@t3-oss/env-core` with `createEnv()`
- tRPC: `TRPCRouterRecord` with `protectedProcedure`, Zod input schemas, `verifyFacilityAccess()`
- Forms: React Hook Form + `standardSchemaResolver` + `useMutation`
- All UI copy in Spanish

### Constraints

- Vercel serverless has 4.5MB body limit — files must NOT pass through API (use Direct Creator Upload)
- Schema changes via `pnpm db:push` (Drizzle push, no migration files)
- `user.image` is managed by Better Auth — may contain Google URLs, not just Cloudflare IDs
- Next.js `next.config.js` needs `images.remotePatterns` for Cloudflare delivery domain

---

## 2. Architecture Decisions

### Cloudflare Images (per engineering task doc)

- $5/month, built-in variants (auto-resize), global CDN, direct creator uploads
- 6 variants: `avatar` (128x128), `thumbnail` (300x200), `card` (600x400), `gallery` (1200x800), `og` (1200x630), `original`
- Direct Creator Upload flow: Browser gets one-time URL from API, uploads directly to Cloudflare edge

### New Package: `packages/images/`

```
packages/images/
  package.json
  tsconfig.json
  src/
    index.ts          # Barrel export (server-side)
    config.ts         # Account config, variants, limits
    types.ts          # Shared types
    url.ts            # URL builders (safe for client/mobile)
    upload.ts         # Server: request upload URL from Cloudflare
    delete.ts         # Server: delete image from Cloudflare
    env.ts            # Environment validation (@t3-oss/env-core)
```

**Two export paths:**
- `"."` → Full API (server-side: upload, delete, config, url)
- `"./url"` → URL builders only (safe for client/mobile, no server env vars)

### tRPC Router: `images`

New router at `packages/api/src/router/images.ts`:
- `images.getUploadUrl` — mutation, returns one-time Cloudflare upload URL + pre-assigned image ID
- `images.confirmUpload` — mutation, validates image exists in Cloudflare, stores ID in entity
- `images.delete` — mutation, removes from DB + deletes from Cloudflare

Access control: `images.getUploadUrl` and `images.confirmUpload` verify the user has write permission on the target entity (facility:write, court:write, settings:write).

### Dashboard Components

```
apps/nextjs/src/components/images/
  ImageUpload.tsx       # Reusable upload (single + gallery modes)
  ImagePreview.tsx      # Thumbnail with delete overlay
  ImageGallery.tsx      # Sortable gallery grid (drag-to-reorder)
```

### Database Changes

**No new tables.** Store Cloudflare image IDs in existing columns:

| Entity | Column | Change |
|--------|--------|--------|
| `facilities` | `photos` | No change — already `string[]`, store Cloudflare IDs instead of URLs |
| `courts` | `imageUrl` | No change — store Cloudflare image ID (URL builder converts at render) |
| `organizations` | `logoUrl` | No change — store Cloudflare image ID |
| `user` | `image` | No change — Better Auth managed. Handle both Google URLs and CF IDs |

The `getImageUrl()` utility handles converting stored IDs to full delivery URLs. Components check if value starts with `http` (external URL) vs short string (Cloudflare ID).

---

## 3. Risk Assessment

### Blast Radius

| Area | Risk | Mitigation |
|------|------|------------|
| Facility cards | Currently use Unsplash URLs in `photos[]` | `getImageUrl()` detects full URLs vs IDs, passes through URLs as-is |
| Court cards | Currently use URL in `imageUrl` | Same detection logic |
| Org sidebar | Currently `logoUrl` is null | No impact — null stays null |
| User avatars | Google OAuth stores full URLs | `getAvatarUrl()` passes through `http` URLs |
| Seed data | Contains Unsplash URLs | Update seed to use Unsplash URLs (no Cloudflare IDs in dev without account) |

### External Dependencies

- **Cloudflare Images subscription ($5/mo)** must be activated before any upload testing
- **API token** must be created with `Cloudflare Images:Edit` permission
- **Variants** must be configured in Cloudflare dashboard before images render at correct sizes

### Migration Complexity

Zero — no schema changes needed. Just changing what we store in existing columns.

### Performance

- Direct Creator Upload: no server bottleneck, browser uploads to nearest Cloudflare edge
- CDN delivery: images served from edge closest to user (Lima players)
- Variants auto-generated: no server-side image processing needed

---

## 4. Task Breakdown

See `docs/TASKS.md` for ordered subtask list.

### Dependency Graph

```
TASK-IMG-1 (Cloudflare setup)
    |
    v
TASK-IMG-2 (Package scaffolding) --> TASK-IMG-3 (URL builder)
    |                                      |
    v                                      v
TASK-IMG-4 (Upload/delete logic) --> TASK-IMG-5 (tRPC router)
    |                                      |
    v                                      v
TASK-IMG-6 (Env vars)             TASK-IMG-7 (Upload component)
                                           |
                                    +------+------+
                                    |      |      |
                                    v      v      v
                              IMG-8    IMG-9    IMG-10
                           (Facility) (Court) (Org logo)
```
