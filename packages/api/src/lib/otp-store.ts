import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTP_CODE_PREFIX = "otp:code:";
const OTP_ATTEMPTS_PREFIX = "otp:attempts:";
const OTP_TTL_SECONDS = 600; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Redis singleton (lazy)
// ---------------------------------------------------------------------------

let redis: Redis | null | undefined;
let didWarnRedis = false;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!didWarnRedis) {
      console.warn("[OTP] Redis not configured — using in-memory OTP store");
      didWarnRedis = true;
    }
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev only)
// ---------------------------------------------------------------------------

const MEM_STORE_MAX_SIZE = 1000;
const memStore = new Map<string, { value: string; expiresAt: number }>();

/** Evict expired entries from the in-memory store. */
function memEvictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (entry.expiresAt < now) memStore.delete(key);
  }
}

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttlMs: number): void {
  // Evict expired entries before adding new ones
  if (memStore.size >= MEM_STORE_MAX_SIZE) {
    memEvictExpired();
  }
  // Reject if still over capacity (fail-closed)
  if (memStore.size >= MEM_STORE_MAX_SIZE && !memStore.has(key)) {
    console.warn("[OTP] In-memory store at capacity, rejecting new entry");
    return;
  }
  memStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function memDel(key: string): void {
  memStore.delete(key);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store an OTP code for a phone number. Resets any existing code + attempts.
 */
export async function storeOtpCode(phone: string, code: string): Promise<void> {
  const r = getRedis();
  const codeKey = `${OTP_CODE_PREFIX}${phone}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;

  if (r) {
    await Promise.all([
      r.setex(codeKey, OTP_TTL_SECONDS, code),
      r.del(attemptsKey),
    ]);
  } else {
    const ttlMs = OTP_TTL_SECONDS * 1000;
    memSet(codeKey, code, ttlMs);
    memDel(attemptsKey);
  }
}

/**
 * Verify an OTP code for a phone number.
 *
 * Returns:
 * - `"valid"` — code matches (code is consumed)
 * - `"invalid"` — code doesn't match (attempt counter incremented)
 * - `"expired"` — no code found (never sent or TTL elapsed)
 * - `"max_attempts"` — too many failed verification attempts
 */
export async function verifyOtpCode(
  phone: string,
  code: string,
): Promise<"valid" | "invalid" | "expired" | "max_attempts"> {
  const r = getRedis();
  const codeKey = `${OTP_CODE_PREFIX}${phone}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;

  // 1. Get stored code
  // Upstash Redis may return a number for all-digit strings, so coerce to string
  let storedCode: string | null;
  if (r) {
    const raw = await r.get<string | number>(codeKey);
    storedCode = raw != null ? String(raw) : null;
  } else {
    storedCode = memGet(codeKey);
  }

  if (!storedCode) return "expired";

  // 2. Check attempt count
  let attempts: number;
  if (r) {
    const raw = await r.get<number>(attemptsKey);
    attempts = raw ?? 0;
  } else {
    const raw = memGet(attemptsKey);
    attempts = raw ? parseInt(raw, 10) : 0;
  }

  if (attempts >= MAX_VERIFY_ATTEMPTS) return "max_attempts";

  // 3. Compare
  if (code !== storedCode) {
    // Increment attempts
    if (r) {
      const newCount = await r.incr(attemptsKey);
      if (newCount === 1) await r.expire(attemptsKey, OTP_TTL_SECONDS);
    } else {
      memSet(attemptsKey, (attempts + 1).toString(), OTP_TTL_SECONDS * 1000);
    }
    return "invalid";
  }

  // 4. Code matches — consume it
  if (r) {
    await Promise.all([r.del(codeKey), r.del(attemptsKey)]);
  } else {
    memDel(codeKey);
    memDel(attemptsKey);
  }

  return "valid";
}
