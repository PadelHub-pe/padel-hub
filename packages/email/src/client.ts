import { Resend } from "resend";

import { emailEnv } from "../env";

const env = emailEnv();

function createResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    console.warn(
      "[email] RESEND_API_KEY not set — emails will be logged to console",
    );
    return null;
  }
  return new Resend(env.RESEND_API_KEY);
}

export const resend = createResendClient();
