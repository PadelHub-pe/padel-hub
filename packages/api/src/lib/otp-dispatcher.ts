import { sendOtpEmail } from "@wifo/email";
import { sendOtp as sendOtpWhatsApp } from "@wifo/whatsapp";

// ---------------------------------------------------------------------------
// OTP Channel Config
// ---------------------------------------------------------------------------

export type OtpChannel = "email" | "whatsapp";

/**
 * Read the OTP delivery channel from the environment.
 * Defaults to "email" (safe while WhatsApp Business verification is pending).
 */
export function getOtpChannel(): OtpChannel {
  const channel = process.env.OTP_CHANNEL;
  if (channel === "whatsapp") return "whatsapp";
  return "email";
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

interface SendOtpResult {
  success: boolean;
  error?: string;
}

/**
 * Send an OTP code via the configured delivery channel.
 *
 * @param identifier - Phone number (WhatsApp) or email address (email)
 * @param code - The OTP code to send
 */
export async function dispatchOtp(
  identifier: string,
  code: string,
): Promise<SendOtpResult> {
  const channel = getOtpChannel();

  if (channel === "whatsapp") {
    return sendOtpWhatsApp({ phone: identifier, code });
  }

  const result = await sendOtpEmail({ email: identifier, code });
  return result;
}
