import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function imagesEnv() {
  return createEnv({
    server: {
      CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
      CLOUDFLARE_IMAGES_TOKEN: z.string().min(1),
    },
    clientPrefix: "PUBLIC_",
    client: {},
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}

/**
 * Account hash used in delivery URLs (public, not secret).
 * Read from env at runtime — no validation needed since it's optional in dev.
 */
export function getAccountHash(): string {
  const hash = process.env.CLOUDFLARE_IMAGES_HASH;
  if (!hash) {
    throw new Error("CLOUDFLARE_IMAGES_HASH is not set");
  }
  return hash;
}
