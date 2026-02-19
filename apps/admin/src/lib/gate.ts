const COOKIE_NAME = "__padelhub-admin-gate";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

async function hmacSign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function buildPayload(): string {
  // Payload includes a fixed prefix — could add expiry later
  return "gate:valid";
}

export async function createGateToken(secret: string): Promise<string> {
  const payload = buildPayload();
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyGateToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = await hmacSign(payload, secret);
  return signature === expected;
}

export function getGateCookieName(): string {
  return COOKIE_NAME;
}

export function getGateCookieOptions(isSecure: boolean) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}
