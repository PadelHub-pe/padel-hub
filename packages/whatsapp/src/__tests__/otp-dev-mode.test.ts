import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBookingConfirmation } from "../notifications";
import { sendOtp } from "../otp";

vi.mock("../../env", () => ({
  whatsappEnv: () => ({
    KAPSO_API_KEY: undefined,
    WHATSAPP_PHONE_NUMBER_ID: undefined,
  }),
}));

vi.mock("../client", () => ({
  whatsapp: null,
}));

describe("dev mode (no KAPSO_API_KEY)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(
      (..._args: unknown[]) => undefined,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sendOtp logs to console and returns success", async () => {
    const result = await sendOtp({ phone: "51987654321", code: "123456" });

    expect(result).toEqual({ success: true });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[whatsapp] OTP TO: 51987654321"),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[whatsapp] CODE: 123456"),
    );
  });

  it("sendBookingConfirmation logs to console and returns success", async () => {
    const result = await sendBookingConfirmation({
      phone: "51987654321",
      customerName: "Juan",
      facilityName: "Padel Zone",
      courtName: "Cancha 1",
      date: "25/03/2026",
      startTime: "10:00",
      endTime: "11:00",
      bookingCode: "XYZ789",
    });

    expect(result).toEqual({ success: true });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "[whatsapp] BOOKING CONFIRMATION TO: 51987654321",
      ),
    );
  });
});
