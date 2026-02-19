import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function emailEnv() {
  return createEnv({
    server: {
      RESEND_API_KEY: z.string().min(1).optional(),
      VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
      VERCEL_URL: z.string().optional(),
      VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
