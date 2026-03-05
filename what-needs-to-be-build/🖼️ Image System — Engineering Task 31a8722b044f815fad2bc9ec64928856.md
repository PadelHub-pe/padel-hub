# 🖼️ Image System — Engineering Task

Build the shared image infrastructure for uploading, storing, transforming, and delivering images across all dashboard flows. The dashboard is the **upload point**, the mobile app is the **primary consumer**. This system must handle multiple image sizes efficiently for both web cards and mobile galleries over cellular data.

---

## Context

**Why before feature flows?** Facility photos, court images, org logos, and user avatars are needed across Flows 2, 4, 5, and eventually the mobile app. Without a centralized image system, each flow would implement its own upload logic, storage, and size handling — creating inconsistency, duplicated code, and performance problems on mobile.

**Where images are needed across the platform:**

| Flow | Image Type | Upload Point | Consumer | Priority |
| --- | --- | --- | --- | --- |
| Flow 2: Org | Organization logo | Org profile settings | Sidebar, facility cards, emails | P1 |
| Flow 4: Facility | Facility photos (gallery) | Facility onboarding + settings | Facility cards, mobile discovery, OG images | P0 |
| Flow 5: Courts | Court photos | Court creation/edit | Court cards, mobile booking screen | P0 |
| Flow 4/5 | Amenity icons | Predefined set (not user-uploaded) | Facility/court detail pages, mobile | P2 |
| Flow 1: Auth | User avatars | Profile settings (or Google OAuth) | Team lists, booking details, mobile profiles | P1 |
| Landing | OG/social share images | Generated from facility data | WhatsApp/social previews | P2 |

---

## Architecture Decision: Cloudflare Images

**Why Cloudflare Images over alternatives?**

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Cloudflare Images** | Built-in variants (auto-resize), global CDN, direct creator uploads, $5/mo, already using Cloudflare for DNS | Vendor lock-in to Cloudflare ecosystem | ✅ **Selected** |
| Supabase Storage | Already in stack, S3-compatible, free tier | No image transformations — must resize with Sharp on server or serve originals. Bad for mobile perf | ❌ |
| Cloudflare R2 | S3-compatible, zero egress, flexible | No built-in transformations — need Image Resizing add-on (paid Workers plan). More plumbing | ❌ |
| Uploadthing | Popular in T3 ecosystem, nice DX | Just storage + upload, no transforms, another vendor, no CDN layer | ❌ |

**Key Cloudflare Images features we'll use:**

1. **Variants** — Define image sizes once, every upload auto-generates all sizes
2. **Direct Creator Upload** — Browser uploads directly to Cloudflare via one-time signed URL (no file through Vercel functions)
3. **Global CDN** — Images served from nearest edge to Lima players
4. **Zero egress fees** — Critical for mobile app serving galleries to thousands of players

---

## Upload Flow Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Dashboard     │     │   Your API       │     │   Cloudflare      │
│   (Browser)     │     │   (tRPC)          │     │   Images          │
└────────┬────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                       │                       │
    1. "I want to          2. Request one-time    3. Return upload
       upload a               upload URL from        URL to API
       facility photo"        Cloudflare API
         │                       │                       │
         │            ┌────────┴─────────┐              │
         │            │  Return upload   │              │
         │◄───────────┤  URL to browser  │              │
         │       4.   └──────────────────┘              │
         │                                              │
    5. Browser uploads     ────────────────────────────►│
       directly to                                      │
       Cloudflare          6. Cloudflare processes,     │
         │                    generates all variants    │
         │                                              │
    7. Cloudflare returns image ID to browser            │
         │                                              │
    8. Browser sends       ┌──────────────────┐       │
       image ID to    ────►│  API stores      │       │
       your API            │  image ID in DB  │       │
                           └──────────────────┘       │
                                                        │
┌─────────────────┐                                │
│  Mobile App      │   9. Request image:                │
│  (Consumer)      │──────images.padelhub.pe/─────────►│
│                  │      {id}/thumbnail        Served from
│                  │◄──────────────────────── nearest edge
└─────────────────┘
```

**Why Direct Creator Upload?**

- Files never pass through your Vercel serverless functions (avoids 4.5MB body limit on Vercel)
- Faster upload — browser talks directly to Cloudflare edge
- Reduces server load and bandwidth costs
- Signed URLs are one-time use, scoped to authenticated users

---

## Cloudflare Images Setup

### Account Configuration

**Priority:** P0

**Estimate:** 30 min

#### Steps

- [ ]  Go to Cloudflare Dashboard → Images
- [ ]  Enable Cloudflare Images ($5/month — includes 100K stored images + 100K deliveries/month)
- [ ]  Note the **Account ID** and **Account Hash** (needed for delivery URLs)
- [ ]  Create an **API Token** with `Cloudflare Images:Edit` permission
- [ ]  Optionally configure a custom delivery domain: `images.padelhub.pe` (CNAME to `imagedelivery.net`)

#### Acceptance Criteria

- [ ]  Cloudflare Images enabled on the PadelHub Cloudflare account
- [ ]  API token created and stored securely
- [ ]  Account ID and Account Hash documented
- [ ]  Custom domain `images.padelhub.pe` configured (optional but nice — can use default `imagedelivery.net` for MVP)

---

### Variant Definitions

**Priority:** P0

**Estimate:** 15 min

Define image transformation variants in Cloudflare Dashboard → Images → Variants:

| Variant Name | Dimensions | Fit | Use Case |
| --- | --- | --- | --- |
| `avatar` | 128×128 | Cover (crop to square) | User avatars, org logos in sidebar/lists |
| `thumbnail` | 300×200 | Cover (crop) | Facility cards in dashboard grid, mobile list items |
| `card` | 600×400 | Cover (crop) | Facility detail cards, mobile discovery feed |
| `gallery` | 1200×800 | Contain (fit within) | Full gallery view, facility detail page, mobile fullscreen |
| `og` | 1200×630 | Cover (crop) | OG/social share images (WhatsApp, Facebook, Twitter) |
| `original` | No resize | As uploaded | Download original, print, backup |

#### Acceptance Criteria

- [ ]  All 6 variants created in Cloudflare Images dashboard
- [ ]  Test: upload a sample image → all 6 variant URLs return correctly sized images
- [ ]  `cover` crops maintain center focus (Cloudflare default)
- [ ]  `contain` preserves aspect ratio with no cropping

---

## Package Structure

```
packages/images/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Public API — export all utilities
│   ├── client.ts                   # Cloudflare Images API client
│   ├── config.ts                   # Account ID, hash, variants, limits
│   ├── upload.ts                   # Server: request upload URL, confirm upload
│   ├── delete.ts                   # Server: delete image from Cloudflare
│   ├── url.ts                      # Shared: build delivery URLs for any variant
│   └── types.ts                    # Shared types
```

---

## Implementation Details

### 1. Package Setup

**Priority:** P0

**Estimate:** 45 min

#### `package.json`

```json
{
  "name": "@padelhub/images",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./url": "./src/url.ts"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

Note: No external dependencies needed — Cloudflare Images API is just REST calls via `fetch`. The `url.ts` export is separate so the **mobile app** and **landing page** can import URL builders without pulling in server-side upload logic.

#### Acceptance Criteria

- [ ]  Package exists and builds without errors
- [ ]  Can be imported from `packages/api` as `@padelhub/images`
- [ ]  URL builder can be imported separately as `@padelhub/images/url` (for mobile/landing)
- [ ]  `pnpm install` resolves cleanly

---

### 2. Configuration

**Priority:** P0

**Estimate:** 30 min

#### `config.ts`

```tsx
export const imageConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  accountHash: process.env.CLOUDFLARE_IMAGES_HASH!,
  apiToken: process.env.CLOUDFLARE_IMAGES_TOKEN!,
  
  // Base delivery URL
  deliveryBase: process.env.CLOUDFLARE_IMAGES_DOMAIN 
    || `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_HASH}`,
  
  variants: {
    avatar: 'avatar',       // 128x128 cover
    thumbnail: 'thumbnail', // 300x200 cover
    card: 'card',           // 600x400 cover
    gallery: 'gallery',     // 1200x800 contain
    og: 'og',               // 1200x630 cover
    original: 'original',   // No resize
  },
  
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFacilityPhotos: 10,
    maxCourtPhotos: 5,
  },
} as const;

export type ImageVariant = keyof typeof imageConfig.variants;
```

---

### 3. URL Builder

**Priority:** P0

**Estimate:** 30 min

This is the most-used utility — every component that displays an image calls this.

#### `url.ts`

```tsx
import { imageConfig, type ImageVariant } from './config';

/**
 * Build a Cloudflare Images delivery URL.
 * 
 * Usage:
 *   getImageUrl('abc-123', 'thumbnail')
 *   // => https://imagedelivery.net/{hash}/abc-123/thumbnail
 *   
 *   getImageUrl('abc-123', 'card')
 *   // => https://imagedelivery.net/{hash}/abc-123/card
 */
export function getImageUrl(
  imageId: string, 
  variant: ImageVariant = 'card'
): string {
  return `${imageConfig.deliveryBase}/${imageId}/${variant}`;
}

/**
 * Build a srcSet for responsive <img> tags.
 * Returns thumbnail for small screens, card for medium, gallery for large.
 */
export function getImageSrcSet(imageId: string): string {
  return [
    `${getImageUrl(imageId, 'thumbnail')} 300w`,
    `${getImageUrl(imageId, 'card')} 600w`,
    `${getImageUrl(imageId, 'gallery')} 1200w`,
  ].join(', ');
}

/**
 * Get avatar URL with initials fallback.
 * Returns null if no imageId — component should render initials.
 */
export function getAvatarUrl(
  imageId: string | null | undefined
): string | null {
  if (!imageId) return null;
  return getImageUrl(imageId, 'avatar');
}
```

#### Acceptance Criteria

- [ ]  `getImageUrl(id, 'thumbnail')` returns correct Cloudflare delivery URL
- [ ]  `getImageSrcSet(id)` returns valid srcSet string with 3 sizes
- [ ]  `getAvatarUrl(null)` returns `null` (component renders initials fallback)
- [ ]  URL builder works without server-side env vars (uses `deliveryBase` which can be hardcoded or public)
- [ ]  Importable from mobile app via `@padelhub/images/url`

---

### 4. Server-side Upload Logic

**Priority:** P0

**Estimate:** 2h

#### `upload.ts` — Direct Creator Upload Flow

```tsx
import { imageConfig } from './config';

type UploadContext = {
  entityType: 'facility' | 'court' | 'organization' | 'user';
  entityId: string;
  uploadedBy: string; // user ID
};

/**
 * Step 1: Request a one-time upload URL from Cloudflare.
 * The browser will upload directly to this URL.
 */
export async function requestUploadUrl(context: UploadContext) {
  const metadata = {
    entityType: context.entityType,
    entityId: context.entityId,
    uploadedBy: context.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${imageConfig.accountId}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imageConfig.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata,
        requireSignedURLs: false, // Public delivery URLs
      }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    console.error('[Images] Failed to get upload URL:', data.errors);
    throw new Error('Failed to create upload URL');
  }

  return {
    uploadUrl: data.result.uploadURL,  // One-time URL for browser
    imageId: data.result.id,           // Pre-assigned image ID
  };
}

/**
 * Get image details from Cloudflare (for validation after upload).
 */
export async function getImageDetails(imageId: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${imageConfig.accountId}/images/v1/${imageId}`,
    {
      headers: {
        'Authorization': `Bearer ${imageConfig.apiToken}`,
      },
    }
  );

  const data = await response.json();
  if (!data.success) return null;

  return {
    id: data.result.id,
    filename: data.result.filename,
    metadata: data.result.meta,
    variants: data.result.variants, // Array of variant URLs
    uploaded: data.result.uploaded,
  };
}
```

#### `delete.ts` — Image Deletion

```tsx
import { imageConfig } from './config';

/**
 * Delete an image from Cloudflare Images.
 * Call when: facility photo removed, court deleted, org logo replaced.
 */
export async function deleteImage(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${imageConfig.accountId}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${imageConfig.apiToken}`,
        },
      }
    );

    const data = await response.json();
    if (!data.success) {
      console.error('[Images] Failed to delete:', data.errors);
      return false;
    }

    console.log(`[Images] Deleted: ${imageId}`);
    return true;
  } catch (err) {
    console.error('[Images] Delete error:', err);
    return false;
  }
}
```

#### Acceptance Criteria

- [ ]  `requestUploadUrl()` returns a one-time upload URL and pre-assigned image ID
- [ ]  Metadata (entityType, entityId, uploadedBy) is stored with the image in Cloudflare
- [ ]  `getImageDetails()` returns image info including all variant URLs
- [ ]  `deleteImage()` removes image from Cloudflare, returns boolean success
- [ ]  Failed API calls are caught and logged, not thrown (non-blocking for delete)
- [ ]  Upload URL creation requires valid API token (server-side only)

---

### 5. Public API (`index.ts`)

**Priority:** P0

**Estimate:** 30 min

```tsx
// Server-side (tRPC routers)
export { requestUploadUrl, getImageDetails } from './upload';
export { deleteImage } from './delete';
export { imageConfig, type ImageVariant } from './config';

// Shared (server + client + mobile)
export { getImageUrl, getImageSrcSet, getAvatarUrl } from './url';
```

#### Usage from tRPC Router

```tsx
// packages/api/src/router/images.ts
import { requestUploadUrl, deleteImage, imageConfig } from '@padelhub/images';

export const imagesRouter = router({
  // Get a one-time upload URL
  getUploadUrl: protectedProcedure
    .input(z.object({
      entityType: z.enum(['facility', 'court', 'organization', 'user']),
      entityId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return requestUploadUrl({
        entityType: input.entityType,
        entityId: input.entityId,
        uploadedBy: ctx.user.id,
      });
    }),

  // Confirm upload and store image ID in the entity
  confirmUpload: protectedProcedure
    .input(z.object({
      entityType: z.enum(['facility', 'court', 'organization', 'user']),
      entityId: z.string().uuid(),
      imageId: z.string(),
      position: z.number().optional(), // For ordered galleries
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate image exists in Cloudflare
      // Add imageId to entity's photos JSONB array (or logo_url field)
      // Return updated entity
    }),

  // Remove image from entity and Cloudflare
  delete: protectedProcedure
    .input(z.object({
      entityType: z.enum(['facility', 'court', 'organization', 'user']),
      entityId: z.string().uuid(),
      imageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Remove imageId from entity's photos JSONB
      // Delete from Cloudflare
      await deleteImage(input.imageId);
    }),
});
```

---

### 6. Dashboard Upload Component

**Priority:** P0

**Estimate:** 4-5h

Reusable React component for all image upload needs across the dashboard.

#### Component API

```tsx
type ImageUploadProps = {
  entityType: 'facility' | 'court' | 'organization' | 'user';
  entityId: string;
  
  // Single image (logo, avatar) vs multi (gallery)
  mode: 'single' | 'gallery';
  
  // Current images
  value: string[];              // Array of Cloudflare image IDs
  onChange: (ids: string[]) => void;
  
  // Limits
  maxImages?: number;           // Default: 1 for single, 10 for gallery
  maxFileSize?: number;         // Default: 10MB
  acceptedTypes?: string[];     // Default: jpeg, png, webp
  
  // Display
  variant?: ImageVariant;       // Preview variant. Default: 'thumbnail'
  aspectRatio?: string;         // CSS aspect-ratio. Default: '3/2'
  placeholder?: string;         // Placeholder text
  className?: string;
};
```

#### Features

- **Drag and drop** zone with visual feedback
- **Click to browse** file picker
- **Client-side validation** before upload: file type, file size, image dimensions
- **Upload progress** indicator per file
- **Preview** using local `URL.createObjectURL` during upload, swap to Cloudflare URL after
- **Reorder** images via drag-and-drop (gallery mode)
- **Delete** with confirmation
- **Error handling**: file too large, wrong type, upload failed, network error

#### Component States

| State | Visual |
| --- | --- |
| Empty | Dashed border zone with upload icon + "Arrastra o haz clic para subir" |
| Drag over | Blue border, blue bg-50, "Suelta para subir" |
| Uploading | Progress bar overlay on image preview, disabled interactions |
| Uploaded | Image preview with hover overlay showing delete icon |
| Error | Red border, error message below: "Archivo muy grande" / "Formato no soportado" |
| Max reached (gallery) | Upload zone hidden, count shown: "10/10 fotos" |

#### Upload Sequence (Browser)

```tsx
async function handleFileUpload(file: File) {
  // 1. Client-side validation
  if (file.size > maxFileSize) throw 'FILE_TOO_LARGE';
  if (!acceptedTypes.includes(file.type)) throw 'INVALID_TYPE';
  
  // 2. Show local preview immediately
  const localPreview = URL.createObjectURL(file);
  setPreview(localPreview);
  
  // 3. Get upload URL from your API
  const { uploadUrl, imageId } = await trpc.images.getUploadUrl.mutate({
    entityType,
    entityId,
  });
  
  // 4. Upload directly to Cloudflare
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  
  // 5. Confirm upload with your API
  await trpc.images.confirmUpload.mutate({
    entityType,
    entityId,
    imageId,
    position: currentImages.length, // Append to end
  });
  
  // 6. Swap local preview for Cloudflare URL
  URL.revokeObjectURL(localPreview);
  onChange([...value, imageId]);
}
```

#### Acceptance Criteria

- [ ]  Drag-and-drop upload works across Chrome, Safari, Firefox
- [ ]  Click-to-browse opens native file picker with correct type filter
- [ ]  Client-side validation rejects files > 10MB with "Archivo muy grande. Máximo 10MB."
- [ ]  Client-side validation rejects non-image files with "Formato no soportado. Usa JPG, PNG o WebP."
- [ ]  Upload progress shown during transfer
- [ ]  Local preview appears instantly before upload completes
- [ ]  After upload, preview swaps to Cloudflare delivery URL
- [ ]  Gallery mode: drag-to-reorder updates position in JSONB array
- [ ]  Gallery mode: shows "N/M fotos" count, hides upload zone at max
- [ ]  Single mode: uploading new image replaces existing (with delete of old)
- [ ]  Delete: click × → confirmation → removes from DB + deletes from Cloudflare
- [ ]  Network error during upload → "Error al subir la imagen. Intenta de nuevo." with retry
- [ ]  Component is reusable across org logo, facility photos, court photos, user avatar

---

### 7. Database Schema Updates

**Priority:** P0

**Estimate:** 30 min

Images are stored as Cloudflare image IDs in existing JSONB columns. No new tables needed.

#### Storage Pattern

| Entity | Column | Type | Example Value |
| --- | --- | --- | --- |
| Organizations | `logo_url` | VARCHAR → rename to `logo_image_id` | `"cf-img-abc123"` |
| Facilities | `photos` | JSONB | `["cf-img-def456", "cf-img-ghi789"]` |
| Courts | Add `photos` column | JSONB | `["cf-img-jkl012"]` |
| Users | `avatar_url` | VARCHAR → rename to `avatar_image_id` | `"cf-img-mno345"` or Google avatar URL |

**Note on avatar_url:** Users who sign up via Google OAuth will have a Google-hosted avatar URL, not a Cloudflare image ID. The `getAvatarUrl()` helper and components need to handle both: Cloudflare IDs (short string → build delivery URL) and full URLs (starts with `http` → use as-is).

#### Migration

```tsx
// Option A: Rename columns (clean but breaking)
// ALTER TABLE organizations RENAME COLUMN logo_url TO logo_image_id;
// ALTER TABLE users RENAME COLUMN avatar_url TO avatar_image_id;

// Option B: Keep column names, store image IDs in them (pragmatic)
// No migration needed — just change what we store in these fields.
// URL builder handles converting IDs to full URLs at render time.
```

**Recommendation:** Option B for MVP. No migration, no breaking changes. The `getImageUrl()` and `getAvatarUrl()` helpers abstract the conversion from ID to URL.

#### Acceptance Criteria

- [ ]  Facility photos stored as ordered array of Cloudflare image IDs in `photos` JSONB
- [ ]  Court photos column added (or existing JSONB used)
- [ ]  Org logo stored as single Cloudflare image ID
- [ ]  User avatar handles both Cloudflare IDs and external URLs (Google)
- [ ]  `getImageUrl()` correctly builds delivery URLs from stored IDs

---

### 8. Environment Variables

**Priority:** P0

**Estimate:** 15 min

```bash
# .env.local (development)
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_IMAGES_HASH=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_IMAGES_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: custom delivery domain
CLOUDFLARE_IMAGES_DOMAIN=https://images.padelhub.pe
```

#### Acceptance Criteria

- [ ]  All 3 required env vars added to `.env.local`
- [ ]  All 3 added to Vercel environment variables (production + preview)
- [ ]  `.env.example` updated with placeholders
- [ ]  Missing vars throw clear error at startup
- [ ]  `CLOUDFLARE_IMAGES_HASH` is safe to expose client-side (it's in delivery URLs anyway)

---

## Implementation Order

| Order | Task | Estimate | Blocks |
| --- | --- | --- | --- |
| 1 | Cloudflare Images account setup + variants | 45 min | Everything |
| 2 | Package setup (`packages/images`) | 45 min | All code |
| 3 | Config + URL builder | 1h | All image display |
| 4 | Server-side upload + delete logic | 2h | Upload component |
| 5 | tRPC images router | 2h | Upload component |
| 6 | Dashboard upload component | 4-5h | All upload UIs |
| 7 | Database schema updates | 30 min | — |
| 8 | Env vars + Vercel config | 15 min | Production uploads |

**Total estimate:** ~11-13 hours

---

## Files to Create

```
packages/images/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── config.ts
│   ├── upload.ts
│   ├── delete.ts
│   ├── url.ts
│   └── types.ts

apps/dashboard/components/
├── images/
│   ├── ImageUpload.tsx              # Reusable upload component
│   ├── ImagePreview.tsx             # Thumbnail with delete overlay
│   ├── ImageGallery.tsx             # Sortable gallery grid
│   └── AvatarUpload.tsx             # Circular avatar upload variant

packages/api/src/router/
└── images.ts                       # getUploadUrl, confirmUpload, delete
```

**Files to modify:**

```
packages/api/package.json           # Add @padelhub/images dependency
packages/api/src/router/index.ts    # Add imagesRouter
apps/dashboard/.env.local            # Add Cloudflare env vars
apps/dashboard/.env.example          # Add placeholders
pnpm-workspace.yaml                  # Verify packages/images included
```

---

## Testing Plan

### Upload Testing

- [ ]  Upload a JPG facility photo → appears in Cloudflare dashboard
- [ ]  Upload a PNG org logo → all 6 variants generated
- [ ]  Upload a WebP court photo → works correctly
- [ ]  Upload a 15MB file → rejected client-side before upload
- [ ]  Upload a .gif file → rejected client-side
- [ ]  Upload with slow connection → progress bar updates smoothly
- [ ]  Upload fails mid-transfer → error shown, retry available

### Delivery Testing

- [ ]  `getImageUrl(id, 'thumbnail')` returns 300×200 image
- [ ]  `getImageUrl(id, 'gallery')` returns 1200×800 image
- [ ]  `getImageUrl(id, 'avatar')` returns 128×128 square crop
- [ ]  Images load fast from Lima (≤200ms for thumbnails)
- [ ]  `getImageSrcSet()` serves correct size based on viewport
- [ ]  Custom domain `images.padelhub.pe` resolves (if configured)

### Deletion Testing

- [ ]  Delete image from facility gallery → removed from DB JSONB + Cloudflare
- [ ]  Replace org logo → old image deleted from Cloudflare, new one stored
- [ ]  Delete court with photos → all court images cleaned up from Cloudflare

### Component Testing

- [ ]  Single mode (org logo): upload replaces existing, shows circular preview
- [ ]  Gallery mode (facility): up to 10 photos, drag to reorder, delete individual
- [ ]  Drag-and-drop works in Chrome, Safari, Firefox
- [ ]  Mobile: tap to upload opens camera/file picker

---

## Cost Analysis

| Tier | Storage | Deliveries/month | Cost |
| --- | --- | --- | --- |
| Base plan | 100K images | 100K deliveries | $5/month |
| PadelHub MVP (est.) | ~500 images (50 facilities × 10 photos) | ~10K deliveries | $5/month |
| PadelHub Scale (est.) | ~5K images | ~100K deliveries | $5/month |
| Overage | $1 per 1K stored | $1 per 100K delivered | Negligible at our scale |

At $5/month flat for the foreseeable future, this is a trivial cost.

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Cloudflare account | ✅ Exists (DNS already here) | Everything |
| Cloudflare Images subscription | 🔲 Needs activation ($5/mo) | Everything |
| `facilities.photos` JSONB column | ✅ Exists in schema | — |
| `courts.photos` column | 🔲 Needs to be added | Court photo uploads |
| tRPC router structure | ✅ Exists | — |

---

## Definition of Done

- [ ]  Cloudflare Images enabled with 6 variants defined
- [ ]  `packages/images` exists as a workspace package
- [ ]  `getImageUrl()` and `getImageSrcSet()` build correct delivery URLs
- [ ]  `requestUploadUrl()` returns valid one-time upload URLs
- [ ]  tRPC `images` router exposes `getUploadUrl`, `confirmUpload`, `delete`
- [ ]  Reusable `ImageUpload` component works in single and gallery mode
- [ ]  Test image uploaded from dashboard appears correctly at all 6 variant sizes
- [ ]  Test image deleted from dashboard is removed from both DB and Cloudflare
- [ ]  Env vars configured in `.env.local` and Vercel
- [ ]  All UI copy in Spanish
- [ ]  Flow 2 (org logo), Flow 4 (facility photos), Flow 5 (court photos) can consume this system