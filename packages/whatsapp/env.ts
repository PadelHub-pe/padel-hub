import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function whatsappEnv() {
  return createEnv({
    server: {
      KAPSO_API_KEY: z.string().min(1).optional(),
      WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
