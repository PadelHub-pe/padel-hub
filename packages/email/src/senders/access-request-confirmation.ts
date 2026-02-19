import type {
  AccessRequestConfirmationEmailParams,
  SendEmailResult,
} from "../types";
import { sendEmail } from "../send";
import { AccessRequestConfirmation } from "../templates/AccessRequestConfirmation";

export async function sendAccessRequestConfirmation(
  params: AccessRequestConfirmationEmailParams,
): Promise<SendEmailResult> {
  const { email } = params;

  return sendEmail({
    to: email,
    subject: "Recibimos tu solicitud — PadelHub",
    react: AccessRequestConfirmation({ email }),
  });
}
