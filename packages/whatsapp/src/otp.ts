import type { SendOtpParams, SendOtpResult } from "./types";
import { whatsapp } from "./client";
import { whatsappConfig } from "./config";

/**
 * Generate a random numeric OTP code.
 */
export function generateOtpCode(
  length: number = whatsappConfig.otp.codeLength,
): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Send an OTP verification code via WhatsApp using the AUTHENTICATION template.
 * The code should be stored in Redis by the caller for later verification.
 */
export async function sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
  const { phone, code } = params;

  if (!whatsapp) {
    console.log("─".repeat(60));
    console.log(`[whatsapp] OTP TO: ${phone}`);
    console.log(`[whatsapp] CODE: ${code}`);
    console.log(
      `[whatsapp] (Message logged — set KAPSO_API_KEY to send via WhatsApp)`,
    );
    console.log("─".repeat(60));
    return { success: true };
  }

  try {
    const response = await whatsapp.messages.sendTemplate({
      phoneNumberId: whatsappConfig.phoneNumberId,
      to: phone,
      template: {
        name: whatsappConfig.templates.otp,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: code }],
          },
          {
            type: "button",
            subType: "url",
            index: 0,
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    });

    return {
      success: true,
      messageId: response.messages[0]?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[whatsapp] Failed to send OTP:", message);
    return { success: false, error: message };
  }
}
