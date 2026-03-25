import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateOtpCode, sendOtp } from "../otp";

const { mockSendTemplate } = vi.hoisted(() => ({
  mockSendTemplate: vi.fn(),
}));

vi.mock("../../env", () => ({
  whatsappEnv: () => ({
    KAPSO_API_KEY: "test-kapso-key",
    WHATSAPP_PHONE_NUMBER_ID: "test-phone-number-id",
  }),
}));

vi.mock("../client", () => ({
  whatsapp: {
    messages: {
      sendTemplate: mockSendTemplate,
    },
  },
}));

describe("generateOtpCode", () => {
  it("generates a 6-digit code by default", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates a code of specified length", () => {
    const code = generateOtpCode(4);
    expect(code).toMatch(/^\d{4}$/);
  });

  it("generates a code of length 8", () => {
    const code = generateOtpCode(8);
    expect(code).toMatch(/^\d{8}$/);
  });

  it("generates different codes on subsequent calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(generateOtpCode());
    }
    // With 6-digit codes and 20 samples, we should get at least 2 unique codes
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("sendOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends OTP via WhatsApp template", async () => {
    mockSendTemplate.mockResolvedValueOnce({
      messages: [{ id: "wamid.123" }],
    });

    const result = await sendOtp({ phone: "51987654321", code: "123456" });

    expect(result).toEqual({
      success: true,
      messageId: "wamid.123",
    });
    expect(mockSendTemplate).toHaveBeenCalledWith({
      phoneNumberId: "test-phone-number-id",
      to: "51987654321",
      template: {
        name: "booking_verification",
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: "123456" }],
          },
          {
            type: "button",
            subType: "url",
            index: 0,
            parameters: [{ type: "text", text: "123456" }],
          },
        ],
      },
    });
  });

  it("returns error on API failure", async () => {
    mockSendTemplate.mockRejectedValueOnce(new Error("API rate limited"));

    const result = await sendOtp({ phone: "51987654321", code: "123456" });

    expect(result).toEqual({
      success: false,
      error: "API rate limited",
    });
  });

  it("handles non-Error exceptions", async () => {
    mockSendTemplate.mockRejectedValueOnce("unexpected string error");

    const result = await sendOtp({ phone: "51987654321", code: "654321" });

    expect(result).toEqual({
      success: false,
      error: "Unknown error",
    });
  });

  it("handles empty messages array in response", async () => {
    mockSendTemplate.mockResolvedValueOnce({
      messages: [],
    });

    const result = await sendOtp({ phone: "51987654321", code: "111111" });

    expect(result).toEqual({
      success: true,
      messageId: undefined,
    });
  });
});
