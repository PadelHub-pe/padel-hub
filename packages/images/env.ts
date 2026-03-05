import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function imagesEnv() {
  return createEnv({
    server: {
      CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
      CLOUDFLARE_IMAGES_HASH: z.string().min(1),
      CLOUDFLARE_IMAGES_TOKEN: z.string().min(1),
    },
    clientPrefix: "PUBLIC_",
    client: {},
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}

export function getAccountHash(): string {
  return imagesEnv().CLOUDFLARE_IMAGES_HASH;
}
