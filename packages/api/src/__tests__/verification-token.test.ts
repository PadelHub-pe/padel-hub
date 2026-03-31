import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  createVerificationToken,
  validateVerificationToken,
} from "../lib/verification-token";

const TEST_SECRET = "test-secret-key-for-hmac-signing-32chars!";

beforeAll(() => {
  vi.stubEnv("AUTH_SECRET", TEST_SECRET);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("verification-token", () => {
  it("creates a token and validates it", () => {
    const token = createVerificationToken("51987654321");
    const phone = validateVerificationToken(token);
    expect(phone).toBe("51987654321");
  });

  it("token contains 4 dot-separated parts", () => {
    const token = createVerificationToken("51987654321");
    const parts = token.split(".");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
    expect(parts[1]).toBe("51987654321");
  });

  it("returns null for tampered token", () => {
    const token = createVerificationToken("51987654321");
    const tampered = token.slice(0, -1) + "x";
    expect(validateVerificationToken(tampered)).toBeNull();
  });

  it("returns null for tampered phone", () => {
    const token = createVerificationToken("51987654321");
    const parts = token.split(".");
    parts[1] = "51999999999";
    expect(validateVerificationToken(parts.join("."))).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(validateVerificationToken("")).toBeNull();
  });

  it("returns null for malformed token (too few parts)", () => {
    expect(validateVerificationToken("a.b")).toBeNull();
    expect(validateVerificationToken("a")).toBeNull();
  });

  it("creates and validates token with email identifier (contains dots)", () => {
    const token = createVerificationToken("user@example.com");
    const result = validateVerificationToken(token);
    expect(result).toBe("user@example.com");
  });

  it("creates and validates token with dotted email", () => {
    const token = createVerificationToken("first.last@gmail.com");
    const result = validateVerificationToken(token);
    expect(result).toBe("first.last@gmail.com");
  });

  it("returns null for expired token", () => {
    // Create token, then fake time to be 31 days later
    const token = createVerificationToken("51987654321");

    const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + thirtyOneDays);

    expect(validateVerificationToken(token)).toBeNull();

    vi.useRealTimers();
  });

  it("accepts token within 30-day window", () => {
    const token = createVerificationToken("51987654321");

    const twentyNineDays = 29 * 24 * 60 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + twentyNineDays);

    expect(validateVerificationToken(token)).toBe("51987654321");

    vi.useRealTimers();
  });

  it("different phones produce different tokens", () => {
    const token1 = createVerificationToken("51987654321");
    const token2 = createVerificationToken("51999888777");
    expect(token1).not.toBe(token2);
  });

  it("throws when AUTH_SECRET is not set", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => createVerificationToken("51987654321")).toThrow(
      "AUTH_SECRET is required",
    );
    vi.stubEnv("AUTH_SECRET", TEST_SECRET);
  });
});
