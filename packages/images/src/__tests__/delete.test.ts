import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteImage } from "../delete";

vi.mock("../../env", () => ({
  imagesEnv: () => ({
    CLOUDFLARE_ACCOUNT_ID: "test-account-id",
    CLOUDFLARE_IMAGES_TOKEN: "test-token",
  }),
}));

describe("deleteImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true on successful deletion", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    const result = await deleteImage("img-123");
    expect(result).toBe(true);
  });

  it("calls correct Cloudflare endpoint with DELETE", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await deleteImage("img-456");

    const call = vi.mocked(fetch).mock.calls[0];
    const [url, options] = call ?? [];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v1/img-456",
    );
    expect(options?.method).toBe("DELETE");
    expect(options?.headers).toEqual({
      Authorization: "Bearer test-token",
    });
  });

  it("returns false and logs on HTTP error (does not throw)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Server Error", { status: 500 }),
    );

    const result = await deleteImage("img-bad");

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Cloudflare delete failed for img-bad: 500"),
    );
  });

  it("returns false and logs on network error (does not throw)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network failure"));

    const result = await deleteImage("img-net");

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to delete image from Cloudflare:",
      expect.any(Error),
    );
  });
});
