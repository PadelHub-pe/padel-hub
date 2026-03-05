import type { ImageVariant } from "./types";
import { getAccountHash } from "../env";
import { VARIANTS } from "./config";

const SRCSET_VARIANTS = ["thumbnail", "card", "gallery"] as const;

function isExternalUrl(value: string): boolean {
  return value.startsWith("http");
}

export function getImageUrl(imageId: string, variant: ImageVariant): string {
  if (isExternalUrl(imageId)) {
    return imageId;
  }
  return `https://imagedelivery.net/${getAccountHash()}/${imageId}/${variant}`;
}

export function getImageSrcSet(imageId: string): string {
  if (isExternalUrl(imageId)) {
    return imageId;
  }
  const hash = getAccountHash();
  return SRCSET_VARIANTS.map(
    (v) =>
      `https://imagedelivery.net/${hash}/${imageId}/${v} ${VARIANTS[v].width}w`,
  ).join(", ");
}

export function getAvatarUrl(imageId: string | null): string | null {
  if (!imageId) {
    return null;
  }
  if (isExternalUrl(imageId)) {
    return imageId;
  }
  return `https://imagedelivery.net/${getAccountHash()}/${imageId}/avatar`;
}
