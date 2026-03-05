import type { ImageVariant } from "./types";

export interface VariantConfig {
  width: number;
  height: number;
  fit: "cover" | "contain";
}

export const VARIANTS: Record<ImageVariant, VariantConfig> = {
  avatar: { width: 128, height: 128, fit: "cover" },
  thumbnail: { width: 300, height: 200, fit: "cover" },
  card: { width: 600, height: 400, fit: "cover" },
  gallery: { width: 1200, height: 800, fit: "contain" },
  og: { width: 1200, height: 630, fit: "cover" },
  original: { width: 4096, height: 4096, fit: "contain" },
};

export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxPhotos: {
    facility: 10,
    court: 1,
    organization: 1,
    user: 1,
  },
} as const;
