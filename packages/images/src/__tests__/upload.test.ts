import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getImageDetails, requestUploadUrl } from "../upload";

vi.mock("../../env", () => ({
  imagesEnv: () => ({
    CLOUDFLARE_ACCOUNT_ID: "test-account-id",
    CLOUDFLARE_IMAGES_TOKEN: "test-token",
  }),
}));

describe("requestUploadUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns uploadUrl and imageId from Cloudflare", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            id: "cf-image-123",
            uploadURL: "https://upload.imagedelivery.net/test/cf-image-123",
          },
          errors: [],
        }),
        { status: 200 },
      ),
    );

    const result = await requestUploadUrl({
      entityType: "facility",
      entityId: "facility-1",
      uploadedBy: "user-1",
    });

    expect(result).toEqual({
      imageId: "cf-image-123",
      uploadUrl: "https://upload.imagedelivery.net/test/cf-image-123",
    });
  });

  it("sends metadata with entityType, entityId, uploadedBy, uploadedAt", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          result: { id: "img-1", uploadURL: "https://upload.example.com" },
          errors: [],
        }),
        { status: 200 },
      ),
    );

    await requestUploadUrl({
      entityType: "court",
      entityId: "court-1",
      uploadedBy: "user-2",
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const [url, options] = call ?? [];

    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v2/direct_upload",
    );
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({
      Authorization: "Bearer test-token",
    });

    const body = options?.body as FormData;
    expect(body.get("requireSignedURLs")).toBe("false");

    const metadata = JSON.parse(body.get("metadata") as string) as Record<
      string,
      unknown
    >;
    expect(metadata).toMatchObject({
      entityType: "court",
      entityId: "court-1",
      uploadedBy: "user-2",
    });
    expect(metadata).toHaveProperty("uploadedAt");
  });

  it("throws on HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(
      requestUploadUrl({
        entityType: "facility",
        entityId: "f-1",
        uploadedBy: "u-1",
      }),
    ).rejects.toThrow("Cloudflare upload URL request failed: 401");
  });

  it("throws on Cloudflare API error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          result: null,
          errors: [{ message: "Rate limited" }],
        }),
        { status: 200 },
      ),
    );

    await expect(
      requestUploadUrl({
        entityType: "facility",
        entityId: "f-1",
        uploadedBy: "u-1",
      }),
    ).rejects.toThrow("Cloudflare API error: Rate limited");
  });
});

describe("getImageDetails", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns image details including variants", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            id: "img-abc",
            filename: "photo.jpg",
            variants: [
              "https://imagedelivery.net/hash/img-abc/avatar",
              "https://imagedelivery.net/hash/img-abc/thumbnail",
            ],
            uploaded: "2025-01-01T00:00:00Z",
          },
          errors: [],
        }),
        { status: 200 },
      ),
    );

    const result = await getImageDetails("img-abc");

    expect(result).toEqual({
      id: "img-abc",
      filename: "photo.jpg",
      variants: [
        "https://imagedelivery.net/hash/img-abc/avatar",
        "https://imagedelivery.net/hash/img-abc/thumbnail",
      ],
      uploaded: "2025-01-01T00:00:00Z",
    });
  });

  it("calls correct Cloudflare endpoint with auth", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            id: "img-1",
            filename: "f.jpg",
            variants: [],
            uploaded: "",
          },
          errors: [],
        }),
        { status: 200 },
      ),
    );

    await getImageDetails("img-1");

    const call = vi.mocked(fetch).mock.calls[0];
    const [url, options] = call ?? [];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v1/img-1",
    );
    expect(options?.method).toBe("GET");
    expect(options?.headers).toEqual({
      Authorization: "Bearer test-token",
    });
  });

  it("throws on HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Not Found", { status: 404 }),
    );

    await expect(getImageDetails("bad-id")).rejects.toThrow(
      "Cloudflare get image failed: 404",
    );
  });
});
