import type { SendEmailResult } from "../types";
import { sendEmail } from "../send";
import { OtpVerification } from "../templates/OtpVerification";

export interface SendOtpEmailParams {
  email: string;
  code: string;
  expiresInMinutes?: number;
}

export async function sendOtpEmail(
  params: SendOtpEmailParams,
): Promise<SendEmailResult> {
  const { email, code, expiresInMinutes = 10 } = params;

  return sendEmail({
    to: email,
    subject: "Tu código de verificación de PadelHub",
    react: OtpVerification({ email, code, expiresInMinutes }),
  });
}
