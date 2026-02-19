import type { ReactElement } from "react";

import type { SendEmailResult } from "./types";
import { resend } from "./client";
import { emailConfig } from "./config";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const { to, subject, react } = options;

  if (!resend) {
    console.log("─".repeat(60));
    console.log(`[email] TO: ${to}`);
    console.log(`[email] SUBJECT: ${subject}`);
    console.log(`[email] (Email logged — set RESEND_API_KEY to send)`);
    console.log("─".repeat(60));
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: emailConfig.from.noreply,
      to,
      replyTo: emailConfig.replyTo,
      subject,
      react,
    });

    if (error) {
      console.error("[email] Failed to send:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Unexpected error:", message);
    return { success: false, error: message };
  }
}
