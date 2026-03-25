import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBookingConfirmation } from "../notifications";

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

describe("sendBookingConfirmation", () => {
  const defaultParams = {
    phone: "51987654321",
    customerName: "Juan Pérez",
    facilityName: "Padel Zone Miraflores",
    courtName: "Cancha 1",
    date: "25/03/2026",
    startTime: "10:00",
    endTime: "11:00",
    bookingCode: "ABC123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends booking confirmation via WhatsApp template", async () => {
    mockSendTemplate.mockResolvedValueOnce({
      messages: [{ id: "wamid.456" }],
    });

    const result = await sendBookingConfirmation(defaultParams);

    expect(result).toEqual({
      success: true,
      messageId: "wamid.456",
    });
    expect(mockSendTemplate).toHaveBeenCalledWith({
      phoneNumberId: "test-phone-number-id",
      to: "51987654321",
      template: {
        name: "booking_confirmation",
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Juan Pérez" },
              { type: "text", text: "Padel Zone Miraflores" },
              { type: "text", text: "Cancha 1" },
              { type: "text", text: "25/03/2026" },
              { type: "text", text: "10:00 - 11:00" },
              { type: "text", text: "ABC123" },
            ],
          },
        ],
      },
    });
  });

  it("returns error on API failure", async () => {
    mockSendTemplate.mockRejectedValueOnce(new Error("Template not found"));

    const result = await sendBookingConfirmation(defaultParams);

    expect(result).toEqual({
      success: false,
      error: "Template not found",
    });
  });

  it("handles non-Error exceptions", async () => {
    mockSendTemplate.mockRejectedValueOnce(42);

    const result = await sendBookingConfirmation(defaultParams);

    expect(result).toEqual({
      success: false,
      error: "Unknown error",
    });
  });
});
