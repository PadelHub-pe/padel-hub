import { whatsappEnv } from "../env";

const env = whatsappEnv();

export const whatsappConfig = {
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  templates: {
    otp: "booking_verification",
    bookingConfirmation: "booking_confirmation",
  },
  otp: {
    codeLength: 6,
    expirationMinutes: 10,
  },
} as const;
