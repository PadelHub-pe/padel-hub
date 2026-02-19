import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env";

let authLimiter: Ratelimit | null | undefined;
let trpcLimiter: Ratelimit | null | undefined;
let gateLimiter: Ratelimit | null | undefined;

function getRedis(): Redis | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** 10 requests per 60s per IP — for /api/auth */
export function getAuthLimiter(): Ratelimit | null {
  if (authLimiter !== undefined) return authLimiter;
  const redis = getRedis();
  if (!redis) {
    authLimiter = null;
    return null;
  }
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:admin:auth",
  });
  return authLimiter;
}

/** 20 requests per 60s per IP — for POST /api/trpc */
export function getTrpcLimiter(): Ratelimit | null {
  if (trpcLimiter !== undefined) return trpcLimiter;
  const redis = getRedis();
  if (!redis) {
    trpcLimiter = null;
    return null;
  }
  trpcLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "rl:admin:trpc",
  });
  return trpcLimiter;
}

/** 5 requests per 60s per IP — for POST /api/gate */
export function getGateLimiter(): Ratelimit | null {
  if (gateLimiter !== undefined) return gateLimiter;
  const redis = getRedis();
  if (!redis) {
    gateLimiter = null;
    return null;
  }
  gateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:admin:gate",
  });
  return gateLimiter;
}
