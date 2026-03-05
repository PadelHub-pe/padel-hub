import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_HASH = "test-account-hash";

describe("url", () => {
  beforeEach(() => {
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account-id");
    vi.stubEnv("CLOUDFLARE_IMAGES_HASH", TEST_HASH);
    vi.stubEnv("CLOUDFLARE_IMAGES_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getImageUrl", () => {
    it("returns correct Cloudflare URL for image ID and variant", async () => {
      const { getImageUrl } = await import("../url");
      expect(getImageUrl("abc", "thumbnail")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/thumbnail`,
      );
    });

    it("returns correct URL for different variants", async () => {
      const { getImageUrl } = await import("../url");
      expect(getImageUrl("abc", "avatar")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/avatar`,
      );
      expect(getImageUrl("abc", "card")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/card`,
      );
      expect(getImageUrl("abc", "gallery")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/gallery`,
      );
      expect(getImageUrl("abc", "og")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/og`,
      );
      expect(getImageUrl("abc", "original")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/original`,
      );
    });

    it("returns external URL as-is when imageId starts with http", async () => {
      const { getImageUrl } = await import("../url");
      const externalUrl = "https://example.com/img.jpg";
      expect(getImageUrl(externalUrl, "thumbnail")).toBe(externalUrl);
    });

    it("passes through https URLs", async () => {
      const { getImageUrl } = await import("../url");
      const url = "https://images.unsplash.com/photo-123?w=600";
      expect(getImageUrl(url, "card")).toBe(url);
    });

    it("passes through http URLs", async () => {
      const { getImageUrl } = await import("../url");
      const url = "http://localhost:3000/test.png";
      expect(getImageUrl(url, "thumbnail")).toBe(url);
    });
  });

  describe("getImageSrcSet", () => {
    it("returns valid srcSet with 3 sizes for Cloudflare ID", async () => {
      const { getImageSrcSet } = await import("../url");
      const srcSet = getImageSrcSet("abc");
      expect(srcSet).toBe(
        `https://imagedelivery.net/${TEST_HASH}/abc/thumbnail 300w, ` +
          `https://imagedelivery.net/${TEST_HASH}/abc/card 600w, ` +
          `https://imagedelivery.net/${TEST_HASH}/abc/gallery 1200w`,
      );
    });

    it("returns external URL as-is", async () => {
      const { getImageSrcSet } = await import("../url");
      const url = "https://example.com/img.jpg";
      expect(getImageSrcSet(url)).toBe(url);
    });
  });

  describe("getAvatarUrl", () => {
    it("returns null when imageId is null", async () => {
      const { getAvatarUrl } = await import("../url");
      expect(getAvatarUrl(null)).toBeNull();
    });

    it("returns Cloudflare avatar URL for image ID", async () => {
      const { getAvatarUrl } = await import("../url");
      expect(getAvatarUrl("user-123")).toBe(
        `https://imagedelivery.net/${TEST_HASH}/user-123/avatar`,
      );
    });

    it("returns external URL as-is (Google avatar)", async () => {
      const { getAvatarUrl } = await import("../url");
      const googleUrl = "https://lh3.googleusercontent.com/a/photo-abc123";
      expect(getAvatarUrl(googleUrl)).toBe(googleUrl);
    });
  });
});
