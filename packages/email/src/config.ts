import { emailEnv } from "../env";

const env = emailEnv();

const baseUrl =
  env.VERCEL_ENV === "production"
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const emailConfig = {
  from: {
    noreply: "PadelHub <no-reply@padelhub.pe>",
  },
  replyTo: "support@padelhub.pe",
  baseUrl,
} as const;
