import type { Redis } from "@upstash/redis";
import { sql } from "drizzle-orm";

import type { db as DbType } from "@wifo/db/client";

export const HEALTH_KEY = "health:last-ping";

export type ProbeStatus = "ok" | "skipped" | { error: string };

export interface KeepAliveResult {
  postgres: ProbeStatus;
  redis: ProbeStatus;
  timestamp: string;
  ok: boolean;
}

interface KeepAliveDeps {
  db: Pick<typeof DbType, "execute">;
  redis: Redis | null;
}

/**
 * Pings Postgres + Upstash Redis to keep both stores from being shut down for
 * inactivity on free-tier providers. Each probe is isolated — one failing does
 * not prevent the other from running, and neither throws out of this function.
 */
export async function runKeepAlive(
  deps: KeepAliveDeps,
): Promise<KeepAliveResult> {
  const timestamp = new Date().toISOString();

  const [postgres, redis] = await Promise.all([
    probePostgres(deps.db),
    probeRedis(deps.redis, timestamp),
  ]);

  const ok = postgres === "ok" && (redis === "ok" || redis === "skipped");

  return { postgres, redis, timestamp, ok };
}

async function probePostgres(
  db: Pick<typeof DbType, "execute">,
): Promise<ProbeStatus> {
  try {
    await db.execute(sql`select 1`);
    return "ok";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[keep-alive] Postgres probe failed:", message);
    return { error: message };
  }
}

async function probeRedis(
  redis: Redis | null,
  timestamp: string,
): Promise<ProbeStatus> {
  if (!redis) {
    console.warn("[keep-alive] Redis not configured — skipping probe");
    return "skipped";
  }
  try {
    await redis.set(HEALTH_KEY, timestamp);
    return "ok";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[keep-alive] Redis probe failed:", message);
    return { error: message };
  }
}
