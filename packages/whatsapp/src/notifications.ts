import type {
  SendBookingConfirmationParams,
  SendBookingConfirmationResult,
} from "./types";
import { whatsapp } from "./client";
import { whatsappConfig } from "./config";

/**
 * Send a booking confirmation message via WhatsApp.
 * Uses a pre-approved UTILITY template with booking details.
 */
export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams,
): Promise<SendBookingConfirmationResult> {
  const {
    phone,
    customerName,
    facilityName,
    courtName,
    date,
    startTime,
    endTime,
    bookingCode,
  } = params;

  if (!whatsapp) {
    console.log("─".repeat(60));
    console.log(`[whatsapp] BOOKING CONFIRMATION TO: ${phone}`);
    console.log(`[whatsapp] ${customerName} — ${facilityName}`);
    console.log(`[whatsapp] ${courtName} | ${date} ${startTime}-${endTime}`);
    console.log(`[whatsapp] Code: ${bookingCode}`);
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
        name: whatsappConfig.templates.bookingConfirmation,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: facilityName },
              { type: "text", text: courtName },
              { type: "text", text: date },
              { type: "text", text: `${startTime} - ${endTime}` },
              { type: "text", text: bookingCode },
            ],
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
    console.error("[whatsapp] Failed to send booking confirmation:", message);
    return { success: false, error: message };
  }
}
