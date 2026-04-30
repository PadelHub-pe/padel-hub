import { describe, expect, it } from "vitest";

import { isCronAuthorized } from "../lib/cron-auth";

const SECRET = "a-32-char-cron-secret-for-tests!!";

describe("isCronAuthorized", () => {
  it("accepts a correct Bearer token (S-2 happy path)", () => {
    expect(isCronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects requests with no authorization header", () => {
    expect(isCronAuthorized(null, SECRET)).toBe(false);
    expect(isCronAuthorized(undefined, SECRET)).toBe(false);
    expect(isCronAuthorized("", SECRET)).toBe(false);
  });

  it("rejects requests with the wrong scheme", () => {
    expect(isCronAuthorized(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorized(`Basic ${SECRET}`, SECRET)).toBe(false);
    expect(isCronAuthorized(`Token ${SECRET}`, SECRET)).toBe(false);
  });

  it("rejects requests with a wrong bearer value", () => {
    expect(
      isCronAuthorized(`Bearer wrong-secret-${"x".repeat(15)}`, SECRET),
    ).toBe(false);
  });

  it("rejects requests with a value of different length", () => {
    expect(isCronAuthorized(`Bearer short`, SECRET)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET}-extra`, SECRET)).toBe(false);
  });

  it("rejects all requests when CRON_SECRET is not configured", () => {
    expect(isCronAuthorized(`Bearer anything`, undefined)).toBe(false);
    expect(isCronAuthorized(`Bearer anything`, "")).toBe(false);
  });

  it("does not crash on malformed inputs", () => {
    expect(isCronAuthorized("Bearer ", SECRET)).toBe(false);
    expect(isCronAuthorized("Bearer", SECRET)).toBe(false);
  });
});
