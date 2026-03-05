export const IMAGE_VARIANTS = [
  "avatar",
  "thumbnail",
  "card",
  "gallery",
  "og",
  "original",
] as const;

export type ImageVariant = (typeof IMAGE_VARIANTS)[number];

export const ENTITY_TYPES = [
  "facility",
  "court",
  "organization",
  "user",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface UploadContext {
  entityType: EntityType;
  entityId: string;
  uploadedBy: string;
}

export interface UploadResult {
  uploadUrl: string;
  imageId: string;
}

export interface ImageDetails {
  id: string;
  filename: string;
  variants: string[];
  uploaded: string;
}
