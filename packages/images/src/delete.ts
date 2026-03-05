import { imagesEnv } from "../env";

const CF_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

/**
 * Delete an image from Cloudflare Images.
 * Returns true if deleted successfully, false on error.
 * Logs errors but never throws — callers can proceed even if cleanup fails.
 */
export async function deleteImage(imageId: string): Promise<boolean> {
  try {
    const env = imagesEnv();
    const url = `${CF_API_BASE}/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Cloudflare delete failed for ${imageId}: ${response.status} ${text}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete image from Cloudflare:", error);
    return false;
  }
}
