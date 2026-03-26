import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis singleton (lazy)
// ---------------------------------------------------------------------------

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

// ---------------------------------------------------------------------------
// Rate limiter (lazy singleton)
// ---------------------------------------------------------------------------

let otpSendLimiter: Ratelimit | null | undefined;

function getOtpSendLimiter(): Ratelimit | null {
  if (otpSendLimiter !== undefined) return otpSendLimiter;
  const r = getRedis();
  if (!r) {
    otpSendLimiter = null;
    return null;
  }
  otpSendLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rl:otp:send",
  });
  return otpSendLimiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether an OTP send is allowed for this phone number.
 * Returns `{ allowed: true }` when under the limit (or Redis is not configured).
 * Returns `{ allowed: false, retryAfterSeconds }` when rate-limited.
 */
export async function checkOtpSendRateLimit(
  phone: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const limiter = getOtpSendLimiter();
  if (!limiter) return { allowed: true };

  const { success, reset } = await limiter.limit(phone);
  if (success) return { allowed: true };

  const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
  return { allowed: false, retryAfterSeconds };
}
