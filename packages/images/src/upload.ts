import type { ImageDetails, UploadContext, UploadResult } from "./types";
import { imagesEnv } from "../env";

const CF_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors: { message: string }[];
}

/**
 * Request a one-time Direct Creator Upload URL from Cloudflare.
 * The browser uses this URL to upload directly to Cloudflare's edge.
 */
export async function requestUploadUrl(
  context: UploadContext,
): Promise<UploadResult> {
  const env = imagesEnv();
  const url = `${CF_API_BASE}/${env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`;

  const metadata = {
    entityType: context.entityType,
    entityId: context.entityId,
    uploadedBy: context.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };

  const body = new FormData();
  body.append("requireSignedURLs", "false");
  body.append("metadata", JSON.stringify(metadata));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Cloudflare upload URL request failed: ${response.status} ${text}`,
    );
  }

  const data = (await response.json()) as CloudflareResponse<{
    id: string;
    uploadURL: string;
  }>;

  if (!data.success) {
    throw new Error(
      `Cloudflare API error: ${data.errors.map((e) => e.message).join(", ")}`,
    );
  }

  return {
    imageId: data.result.id,
    uploadUrl: data.result.uploadURL,
  };
}

/**
 * Get details about an uploaded image from Cloudflare.
 * Used to validate that an upload was completed successfully.
 */
export async function getImageDetails(imageId: string): Promise<ImageDetails> {
  const env = imagesEnv();
  const url = `${CF_API_BASE}/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare get image failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as CloudflareResponse<{
    id: string;
    filename: string;
    variants: string[];
    uploaded: string;
  }>;

  if (!data.success) {
    throw new Error(
      `Cloudflare API error: ${data.errors.map((e) => e.message).join(", ")}`,
    );
  }

  return {
    id: data.result.id,
    filename: data.result.filename,
    variants: data.result.variants,
    uploaded: data.result.uploaded,
  };
}
