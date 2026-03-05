# Tasks

## Completed Flows

### Email Notification System

Fully implemented `packages/email` (React Email + Resend):

- Resend client with dev-mode console fallback (no API key required locally)
- Shared components: Layout, Header, Footer, Button
- 4 templates: OrganizationInvite, PasswordReset, AccessRequestApproval, AccessRequestConfirmation
- High-level senders exported from `@wifo/email`
- Integrated into org router, admin router, auth hooks, and landing page API
- Vercel-aware base URL resolution, `.env.example` updated

### Flow 1: Authentication & Access

All 8 tasks completed. Full auth system implemented:

- Login (email/password + Google OAuth), invite acceptance, password reset
- Rate limiting on web dashboard and admin panel
- Post-login pending invite prompt
- Brand logomark on login page
- Auth error states hardened to match spec
- Vitest infrastructure + invite router tests + RBAC unit tests (129 tests passing)

### Flow 2: Organization Management

All 6 tasks completed. Facilities page fully functional:

- Facility card actions menu with inactive styling (TASK-2.1)
- Deactivation confirmation dialog with pending bookings warning (TASK-2.2)
- First-time empty state for zero facilities (TASK-2.3)
- URL-persisted filters with result count (TASK-2.4)
- Org switcher single-org behavior and active checkmark (TASK-2.5)
- "Agregar Local" button in facilities page header (TASK-2.6)

---

## Image System

Technical plan: `docs/TECHNICAL_PLAN.md`

### TASK-IMG-1: Cloudflare Images Account Setup [config]

**Manual task — no code. Must be done before any other task.**

- [x] Enable Cloudflare Images ($5/mo) in Cloudflare Dashboard
- [x] Note Account ID and Account Hash
- [x] Create API Token with `Cloudflare Images:Edit` permission
- [x] Create 6 variants in dashboard: `avatar` (128x128 cover), `thumbnail` (300x200 cover), `card` (600x400 cover), `gallery` (1200x800 contain), `og` (1200x630 cover), `original` (4096x4096 contain)
- [x] Test: upload sample image, verify all 6 variant URLs work
- [ ] Optional: configure custom domain `images.padelhub.pe` (can use `imagedelivery.net` for MVP)

**Blocks:** Everything

---

### TASK-IMG-2: Package Scaffolding [feature]

**Create `packages/images/` workspace package.**

Files to create:
- `packages/images/package.json` — `@wifo/images`, two exports: `"."` (full) and `"./url"` (client-safe)
- `packages/images/tsconfig.json` — extends `compiled-package.json`
- `packages/images/src/types.ts` — `ImageVariant`, `UploadContext`, entity types
- `packages/images/src/config.ts` — account config, variants map, limits (maxFileSize, allowedTypes, maxPhotos)
- `packages/images/src/env.ts` — `@t3-oss/env-core` validation for Cloudflare env vars
- `packages/images/src/index.ts` — barrel export
- `packages/images/src/url.ts` — (empty placeholder, implemented in TASK-IMG-3)

Acceptance criteria:
- [x] `pnpm install` resolves cleanly
- [x] `pnpm typecheck` passes
- [x] Package importable as `@wifo/images` from `packages/api`

**Depends on:** nothing (can start before TASK-IMG-1)

---

### TASK-IMG-3: URL Builder [feature]

**Implement `packages/images/src/url.ts` — the most-used utility.**

Functions:
- `getImageUrl(imageId, variant)` — returns `https://imagedelivery.net/{hash}/{id}/{variant}`
- `getImageSrcSet(imageId)` — returns srcSet string with thumbnail/card/gallery sizes
- `getAvatarUrl(imageId | null)` — returns URL or null; detects full URLs (Google) vs Cloudflare IDs

Key behavior: if `imageId` starts with `http`, return it as-is (external URL passthrough). This ensures backward compat with Unsplash URLs in seed data and Google avatar URLs.

Acceptance criteria:
- [x] `getImageUrl('abc', 'thumbnail')` returns correct Cloudflare URL
- [x] `getImageUrl('https://example.com/img.jpg', 'thumbnail')` returns the URL as-is
- [x] `getAvatarUrl(null)` returns null
- [x] `getImageSrcSet('abc')` returns valid srcSet with 3 sizes
- [x] Importable separately via `@wifo/images/url` (no server env vars needed)

**Depends on:** TASK-IMG-2

---

### TASK-IMG-4: Server-side Upload & Delete Logic [feature]

**Implement Cloudflare API calls in `packages/images/src/`.**

Files:
- `upload.ts` — `requestUploadUrl(context)` gets one-time Direct Creator Upload URL, `getImageDetails(imageId)` validates upload
- `delete.ts` — `deleteImage(imageId)` removes from Cloudflare

Both use `fetch()` against Cloudflare Images REST API. No external dependencies.

Acceptance criteria:
- [x] `requestUploadUrl()` returns `{ uploadUrl, imageId }` from Cloudflare
- [x] Metadata (entityType, entityId, uploadedBy, uploadedAt) attached to upload
- [x] `getImageDetails()` returns image info including variants
- [x] `deleteImage()` returns boolean, logs errors, doesn't throw
- [x] All functions require server-side env vars (API token)

**Depends on:** TASK-IMG-2, TASK-IMG-1 (for testing)

---

### TASK-IMG-5: tRPC Images Router [feature]

**Create `packages/api/src/router/images.ts` and register in root router.**

Procedures:
- `images.getUploadUrl` — protected mutation. Input: `{ entityType, entityId }`. Verifies write access, calls `requestUploadUrl()`.
- `images.confirmUpload` — protected mutation. Input: `{ entityType, entityId, imageId, position? }`. Validates image in Cloudflare, stores ID in entity's DB column.
- `images.delete` — protected mutation. Input: `{ entityType, entityId, imageId }`. Removes from DB column + deletes from Cloudflare.
- `images.reorder` — protected mutation. Input: `{ entityType, entityId, imageIds: string[] }`. Updates photo array order (gallery mode).

Access control per entityType:
- `facility` — `verifyFacilityAccess(ctx, entityId, 'facility:write')`
- `court` — look up court's facilityId, then `verifyFacilityAccess(ctx, facilityId, 'court:write')`
- `organization` — verify user is org_admin of the org
- `user` — verify `entityId === ctx.session.user.id`

Files to modify:
- `packages/api/src/root.ts` — add `images: imagesRouter`
- `packages/api/package.json` — add `@wifo/images` dependency

Acceptance criteria:
- [x] `getUploadUrl` returns upload URL for authorized users, throws UNAUTHORIZED otherwise
- [x] `confirmUpload` stores image ID in correct DB column (photos array or single field)
- [x] `delete` removes from DB and Cloudflare
- [x] `reorder` updates photos array order
- [x] All procedures check entity-specific permissions

**Depends on:** TASK-IMG-4, TASK-IMG-3

---

### TASK-IMG-6: Environment Variables [config]

- [x] Add `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_HASH`, `CLOUDFLARE_IMAGES_TOKEN` to `.env.local`
- [x] Add to `.env.example` with placeholders
- [x] Add to Vercel env vars (production + preview) — deferred until dashboard deployment
- [x] `CLOUDFLARE_IMAGES_HASH` exposed client-side (it's in delivery URLs) — add to `apps/nextjs` public env if needed
- [x] Add `imagedelivery.net` to `next.config.js` `images.remotePatterns`
- [x] Missing vars throw clear error at startup (via `@t3-oss/env-core`)

**Depends on:** TASK-IMG-1, TASK-IMG-2

---

### TASK-IMG-7: Dashboard ImageUpload Component [feature]

**Build reusable React upload component.**

Files to create in `apps/nextjs/src/components/images/`:
- `ImageUpload.tsx` — Main component with drag-drop, click-to-browse, progress, preview
- `ImagePreview.tsx` — Thumbnail with hover delete overlay
- `ImageGallery.tsx` — Sortable grid for gallery mode (drag-to-reorder)

Props API:
```tsx
type ImageUploadProps = {
  entityType: 'facility' | 'court' | 'organization' | 'user';
  entityId: string;
  mode: 'single' | 'gallery';
  value: string[];
  onChange: (ids: string[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  variant?: ImageVariant;
  aspectRatio?: string;
  placeholder?: string;
  className?: string;
};
```

Upload sequence:
1. Client validates file type + size
2. Show local preview via `URL.createObjectURL`
3. Call `images.getUploadUrl` mutation
4. POST file directly to Cloudflare upload URL
5. Call `images.confirmUpload` mutation
6. Swap local preview for Cloudflare delivery URL

States: empty, drag-over, uploading (progress), uploaded, error, max-reached.

All copy in Spanish: "Arrastra o haz clic para subir", "Suelta para subir", "Archivo muy grande", etc.

Acceptance criteria:
- [x] Drag-and-drop works in Chrome, Safari, Firefox
- [x] Client-side rejects files > 10MB and non-image types
- [x] Upload progress shown during transfer
- [x] Local preview appears instantly, swaps to Cloudflare URL after
- [x] Gallery mode: drag-to-reorder, shows "N/M fotos" count, hides zone at max
- [x] Single mode: new upload replaces existing (deletes old)
- [x] Delete with confirmation
- [x] Network error shows retry option

**Depends on:** TASK-IMG-5, TASK-IMG-6

---

### TASK-IMG-8: Integrate with Facility Photos [feature]

**Wire ImageUpload into facility settings/creation.**

- Replace Unsplash URL placeholder in facility cards with `getImageUrl(photos[0], 'thumbnail')`
- Add `<ImageUpload mode="gallery" entityType="facility">` to facility settings page
- Update facility profile tab to show/manage gallery
- Ensure facility cards, detail pages use `getImageUrl()` for display

Files to modify:
- `apps/nextjs/.../facilities/_components/facility-card.tsx`
- `apps/nextjs/.../facilities/[facilityId]/settings/` (settings page)
- Any facility detail views showing photos

**Depends on:** TASK-IMG-7

---

### TASK-IMG-9: Integrate with Court Photos [feature]

**Wire ImageUpload into court creation/editing.**

- Replace URL text input in `photo-section.tsx` with `<ImageUpload mode="single" entityType="court">`
- Update court cards to use `getImageUrl(imageUrl, 'thumbnail')` for display
- Update court create/edit forms

Files to modify:
- `apps/nextjs/.../courts/_components/photo-section.tsx`
- `apps/nextjs/.../courts/_components/court-card.tsx`
- `apps/nextjs/.../courts/new/_components/court-create-form.tsx`
- Court edit form (if exists)

**Depends on:** TASK-IMG-7

---

### TASK-IMG-10: Integrate with Org Logo [feature] ✅

**Wire ImageUpload into org profile settings.**

- [x] Replace "coming soon" placeholder in `org-profile-tab.tsx` with `<ImageUpload mode="single" entityType="organization">`
- [x] Update sidebar/switcher to use `getImageUrl(logoUrl, 'avatar')` for logo display
- [x] Handle null logo gracefully (show initials fallback)

Files modified:
- `apps/nextjs/.../org-profile-tab.tsx`
- `apps/nextjs/.../org-selector.tsx`

**Depends on:** TASK-IMG-7

---

### Parallel Execution

Tasks that can run in parallel:
- TASK-IMG-2 + TASK-IMG-1 (package setup doesn't need Cloudflare account)
- TASK-IMG-3 + TASK-IMG-4 (URL builder and upload logic are independent)
- TASK-IMG-6 is independent once TASK-IMG-1 provides credentials
- TASK-IMG-8 + TASK-IMG-9 + TASK-IMG-10 (all depend on IMG-7 but are independent of each other)
