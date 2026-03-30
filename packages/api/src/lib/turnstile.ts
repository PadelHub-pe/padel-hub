// ---------------------------------------------------------------------------
// Cloudflare Turnstile server-side token verification
// ---------------------------------------------------------------------------

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Turnstile token against the Cloudflare siteverify API.
 *
 * Skips validation when `TURNSTILE_SECRET_KEY` is not set (dev mode).
 * Returns `true` if the token is valid or if Turnstile is not configured.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // dev mode — skip validation

  const res = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
