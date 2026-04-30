/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HEALTH_KEY, runKeepAlive } from "../lib/keep-alive";

function makeDbMock(executeImpl?: () => Promise<unknown>) {
  return {
    execute: vi.fn(executeImpl ?? (() => Promise.resolve([{ "?column?": 1 }]))),
  };
}

function makeRedisMock(setImpl?: () => Promise<unknown>) {
  return {
    set: vi.fn(setImpl ?? (() => Promise.resolve("OK"))),
  };
}

describe("runKeepAlive", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pings both stores and returns ok status (S-1)", async () => {
    const db = makeDbMock();
    const redis = makeRedisMock();

    const result = await runKeepAlive({ db: db as any, redis: redis as any });

    expect(result.ok).toBe(true);
    expect(result.postgres).toBe("ok");
    expect(result.redis).toBe("ok");
    expect(typeof result.timestamp).toBe("string");
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();

    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(HEALTH_KEY, result.timestamp);
  });

  it("reports redis failure without swallowing it (S-3)", async () => {
    const db = makeDbMock();
    const redis = makeRedisMock(() =>
      Promise.reject(new Error("WRONGPASS invalid token")),
    );
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await runKeepAlive({ db: db as any, redis: redis as any });

    expect(result.ok).toBe(false);
    expect(result.postgres).toBe("ok");
    expect(result.redis).toEqual({ error: "WRONGPASS invalid token" });

    expect(errorSpy).toHaveBeenCalled();
    const logCall = errorSpy.mock.calls.at(0)?.join(" ") ?? "";
    expect(logCall).toMatch(/redis/i);
    expect(logCall).toContain("WRONGPASS invalid token");
  });

  it("reports postgres failure without swallowing it (S-3)", async () => {
    const db = makeDbMock(() =>
      Promise.reject(new Error("connection refused")),
    );
    const redis = makeRedisMock();
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await runKeepAlive({ db: db as any, redis: redis as any });

    expect(result.ok).toBe(false);
    expect(result.postgres).toEqual({ error: "connection refused" });
    expect(result.redis).toBe("ok");

    const logCall = errorSpy.mock.calls.at(0)?.join(" ") ?? "";
    expect(logCall).toMatch(/postgres/i);
    expect(logCall).toContain("connection refused");
  });

  it("isolates probes — both can fail independently", async () => {
    const db = makeDbMock(() => Promise.reject(new Error("pg down")));
    const redis = makeRedisMock(() => Promise.reject(new Error("redis down")));

    const result = await runKeepAlive({ db: db as any, redis: redis as any });

    expect(result.ok).toBe(false);
    expect(result.postgres).toEqual({ error: "pg down" });
    expect(result.redis).toEqual({ error: "redis down" });
  });

  it("treats missing redis as skipped (not an error)", async () => {
    const db = makeDbMock();

    const result = await runKeepAlive({ db: db as any, redis: null });

    expect(result.ok).toBe(true);
    expect(result.postgres).toBe("ok");
    expect(result.redis).toBe("skipped");
  });

  it("ok=false when postgres fails even if redis is skipped", async () => {
    const db = makeDbMock(() => Promise.reject(new Error("pg down")));

    const result = await runKeepAlive({ db: db as any, redis: null });

    expect(result.ok).toBe(false);
    expect(result.postgres).toEqual({ error: "pg down" });
    expect(result.redis).toBe("skipped");
  });

  it("coerces non-Error throws to a string message", async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- intentionally non-Error to verify coercion
    const db = makeDbMock(() => Promise.reject("string thrown"));
    const redis = makeRedisMock();

    const result = await runKeepAlive({ db: db as any, redis: redis as any });

    expect(result.postgres).toEqual({ error: "string thrown" });
  });
});
