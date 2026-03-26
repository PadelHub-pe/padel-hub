import { afterEach, describe, expect, it } from "vitest";

import { storeOtpCode, verifyOtpCode } from "../lib/otp-store";

// These tests run against the in-memory fallback (no Redis in CI/dev).

afterEach(() => {
  // No clean-up needed — each test uses a unique phone to avoid collisions.
});

describe("otp-store (in-memory)", () => {
  it("stores and verifies an OTP code", async () => {
    await storeOtpCode("51900000001", "111111");
    const result = await verifyOtpCode("51900000001", "111111");
    expect(result).toBe("valid");
  });

  it("returns expired when no code stored", async () => {
    const result = await verifyOtpCode("51900000099", "123456");
    expect(result).toBe("expired");
  });

  it("returns invalid for wrong code", async () => {
    await storeOtpCode("51900000002", "111111");
    const result = await verifyOtpCode("51900000002", "999999");
    expect(result).toBe("invalid");
  });

  it("consumes code on valid verification (one-time use)", async () => {
    await storeOtpCode("51900000003", "222222");

    const first = await verifyOtpCode("51900000003", "222222");
    expect(first).toBe("valid");

    // Second attempt should fail — code was consumed
    const second = await verifyOtpCode("51900000003", "222222");
    expect(second).toBe("expired");
  });

  it("returns max_attempts after 5 failed verifications", async () => {
    await storeOtpCode("51900000004", "333333");

    for (let i = 0; i < 5; i++) {
      const result = await verifyOtpCode("51900000004", "000000");
      expect(result).toBe("invalid");
    }

    // 6th attempt should be blocked
    const result = await verifyOtpCode("51900000004", "000000");
    expect(result).toBe("max_attempts");
  });

  it("resets attempts when a new code is stored", async () => {
    await storeOtpCode("51900000005", "444444");

    // Fail 4 times
    for (let i = 0; i < 4; i++) {
      await verifyOtpCode("51900000005", "000000");
    }

    // Store a new code — should reset attempts
    await storeOtpCode("51900000005", "555555");

    const result = await verifyOtpCode("51900000005", "555555");
    expect(result).toBe("valid");
  });

  it("correct code still works after some failed attempts", async () => {
    await storeOtpCode("51900000006", "666666");

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      const r = await verifyOtpCode("51900000006", "000000");
      expect(r).toBe("invalid");
    }

    // Correct code should still work
    const result = await verifyOtpCode("51900000006", "666666");
    expect(result).toBe("valid");
  });
});
