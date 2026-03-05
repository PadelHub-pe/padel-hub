import type { ImageVariant } from "@wifo/images";

import { env } from "~/env";

/**
 * Client-safe image URL builder.
 * If the value is already a full URL (e.g. Unsplash, Google), returns it as-is.
 * Otherwise builds a Cloudflare Images delivery URL.
 */
export function getClientImageUrl(
  imageId: string,
  variant: ImageVariant,
): string {
  if (imageId.startsWith("http")) return imageId;
  return `https://imagedelivery.net/${env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH}/${imageId}/${variant}`;
}
