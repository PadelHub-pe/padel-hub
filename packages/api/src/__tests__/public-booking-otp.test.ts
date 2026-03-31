/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { publicBookingRouter } from "../router/public-booking";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockGenerateOtpCode,
  mockDispatchOtp,
  mockStoreOtpCode,
  mockVerifyOtpCode,
  mockCheckOtpSendRateLimit,
  mockCreateVerificationToken,
  mockVerifyTurnstileToken,
} = vi.hoisted(() => ({
  mockGenerateOtpCode: vi.fn().mockReturnValue("123456"),
  mockDispatchOtp: vi.fn().mockResolvedValue({ success: true }),
  mockStoreOtpCode: vi.fn().mockResolvedValue(undefined),
  mockVerifyOtpCode: vi.fn().mockResolvedValue("valid" as const),
  mockCheckOtpSendRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  mockCreateVerificationToken: vi.fn().mockReturnValue("signed-token-123"),
  mockVerifyTurnstileToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("@wifo/whatsapp", () => ({
  generateOtpCode: mockGenerateOtpCode,
  whatsappConfig: { otp: { expirationMinutes: 10, codeLength: 6 } },
}));

vi.mock("../lib/otp-dispatcher", () => ({
  dispatchOtp: mockDispatchOtp,
  getOtpChannel: vi.fn().mockReturnValue("email"),
}));

vi.mock("../lib/otp-store", () => ({
  storeOtpCode: mockStoreOtpCode,
  verifyOtpCode: mockVerifyOtpCode,
}));

vi.mock("../lib/otp-rate-limit", () => ({
  checkOtpSendRateLimit: mockCheckOtpSendRateLimit,
}));

vi.mock("../lib/verification-token", () => ({
  createVerificationToken: mockCreateVerificationToken,
}));

vi.mock("../lib/turnstile", () => ({
  verifyTurnstileToken: mockVerifyTurnstileToken,
}));

// ---------------------------------------------------------------------------
// Caller helper
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ publicBooking: publicBookingRouter });
const createCaller = createCallerFactory(router);

function publicCaller() {
  return createCaller({
    db: {} as any,
    session: null as any,
    authApi: {} as any,
  });
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateOtpCode.mockReturnValue("123456");
  mockDispatchOtp.mockResolvedValue({ success: true });
  mockStoreOtpCode.mockResolvedValue(undefined);
  mockVerifyOtpCode.mockResolvedValue("valid");
  mockCheckOtpSendRateLimit.mockResolvedValue({ allowed: true });
  mockCreateVerificationToken.mockReturnValue("signed-token-123");
  mockVerifyTurnstileToken.mockResolvedValue(true);
});

// ===========================================================================
// Tests: publicBooking.sendOtp
// ===========================================================================

describe("publicBooking.sendOtp", () => {
  it("sends OTP and returns success with expiration", async () => {
    const caller = publicCaller();

    const result = await caller.publicBooking.sendOtp({
      identifier: "test@example.com",
      turnstileToken: "test-token",
    });

    expect(result.success).toBe(true);
    expect(result.expiresInSeconds).toBe(600);

    // Verify the flow: rate check → generate → store → dispatch
    expect(mockCheckOtpSendRateLimit).toHaveBeenCalledWith("test@example.com");
    expect(mockGenerateOtpCode).toHaveBeenCalledOnce();
    expect(mockStoreOtpCode).toHaveBeenCalledWith("test@example.com", "123456");
    expect(mockDispatchOtp).toHaveBeenCalledWith("test@example.com", "123456");
  });

  it("throws TOO_MANY_REQUESTS when rate-limited", async () => {
    mockCheckOtpSendRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 1800,
    });
    const caller = publicCaller();

    await expect(
      caller.publicBooking.sendOtp({
        identifier: "test@example.com",
        turnstileToken: "test-token",
      }),
    ).rejects.toThrow("Demasiados intentos");

    // Should not generate or send anything
    expect(mockGenerateOtpCode).not.toHaveBeenCalled();
    expect(mockDispatchOtp).not.toHaveBeenCalled();
  });

  it("throws INTERNAL_SERVER_ERROR when OTP dispatch fails", async () => {
    mockDispatchOtp.mockResolvedValue({
      success: false,
      error: "API error",
    });
    const caller = publicCaller();

    await expect(
      caller.publicBooking.sendOtp({
        identifier: "test@example.com",
        turnstileToken: "test-token",
      }),
    ).rejects.toThrow("No se pudo enviar el código");

    // Code was still stored (will expire naturally)
    expect(mockStoreOtpCode).toHaveBeenCalled();
  });

  it("rejects empty identifier", async () => {
    const caller = publicCaller();

    await expect(
      caller.publicBooking.sendOtp({
        identifier: "",
        turnstileToken: "test-token",
      }),
    ).rejects.toThrow();
  });

  it("includes retryAfterSeconds in rate limit message", async () => {
    mockCheckOtpSendRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 3600,
    });
    const caller = publicCaller();

    await expect(
      caller.publicBooking.sendOtp({
        identifier: "test@example.com",
        turnstileToken: "test-token",
      }),
    ).rejects.toThrow("3600 segundos");
  });

  it("works with phone number identifier (WhatsApp mode)", async () => {
    const caller = publicCaller();

    const result = await caller.publicBooking.sendOtp({
      identifier: "987654321",
      turnstileToken: "test-token",
    });

    expect(result.success).toBe(true);
    expect(mockDispatchOtp).toHaveBeenCalledWith("987654321", "123456");
  });
});

// ===========================================================================
// Tests: publicBooking.verifyOtp
// ===========================================================================

describe("publicBooking.verifyOtp", () => {
  it("returns verified=true and token when code is valid", async () => {
    mockVerifyOtpCode.mockResolvedValue("valid");
    const caller = publicCaller();

    const result = await caller.publicBooking.verifyOtp({
      identifier: "test@example.com",
      code: "123456",
    });

    expect(result.verified).toBe(true);
    expect(result).toHaveProperty("token", "signed-token-123");
    expect(mockVerifyOtpCode).toHaveBeenCalledWith(
      "test@example.com",
      "123456",
    );
    expect(mockCreateVerificationToken).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  it("returns verified=false when code is invalid", async () => {
    mockVerifyOtpCode.mockResolvedValue("invalid");
    const caller = publicCaller();

    const result = await caller.publicBooking.verifyOtp({
      identifier: "test@example.com",
      code: "999999",
    });

    expect(result.verified).toBe(false);
    expect(result).not.toHaveProperty("token");
    expect(mockCreateVerificationToken).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when code is expired", async () => {
    mockVerifyOtpCode.mockResolvedValue("expired");
    const caller = publicCaller();

    await expect(
      caller.publicBooking.verifyOtp({
        identifier: "test@example.com",
        code: "123456",
      }),
    ).rejects.toThrow("Código expirado o no encontrado");
  });

  it("throws TOO_MANY_REQUESTS when max attempts reached", async () => {
    mockVerifyOtpCode.mockResolvedValue("max_attempts");
    const caller = publicCaller();

    await expect(
      caller.publicBooking.verifyOtp({
        identifier: "test@example.com",
        code: "123456",
      }),
    ).rejects.toThrow("Demasiados intentos fallidos");
  });

  it("rejects code with wrong length", async () => {
    const caller = publicCaller();

    await expect(
      caller.publicBooking.verifyOtp({
        identifier: "test@example.com",
        code: "12345", // 5 digits instead of 6
      }),
    ).rejects.toThrow();
  });

  it("rejects empty identifier", async () => {
    const caller = publicCaller();

    await expect(
      caller.publicBooking.verifyOtp({
        identifier: "",
        code: "123456",
      }),
    ).rejects.toThrow();
  });
});
