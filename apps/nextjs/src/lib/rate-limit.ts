import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env";

let authLimiter: Ratelimit | null | undefined;

function getRedis(): Redis | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** 5 requests per 15 min per IP — for POST /api/auth (login lockout) */
export function getAuthLimiter(): Ratelimit | null {
  if (authLimiter !== undefined) return authLimiter;
  const redis = getRedis();
  if (!redis) {
    authLimiter = null;
    return null;
  }
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "rl:web:auth",
  });
  return authLimiter;
}
