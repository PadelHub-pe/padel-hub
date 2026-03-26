import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret)
    throw new Error("AUTH_SECRET is required for verification tokens");
  return secret;
}

function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a signed verification token for a verified phone number.
 * Token format: `v1.{phone}.{expiresAt}.{signature}`
 */
export function createVerificationToken(phone: string): string {
  const secret = getSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${phone}.${expiresAt}`;
  const signature = hmac(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Validate a verification token.
 * Returns the phone number if valid, or `null` if invalid/expired.
 */
export function validateVerificationToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [version, phone, expiresAtStr, signature] = parts;
  if (version !== TOKEN_VERSION || !phone || !expiresAtStr || !signature) {
    return null;
  }

  // Check expiration
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  // Verify signature (timing-safe comparison)
  const secret = getSecret();
  const payload = `${TOKEN_VERSION}.${phone}.${expiresAtStr}`;
  const expectedSignature = hmac(payload, secret);

  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  return phone;
}
