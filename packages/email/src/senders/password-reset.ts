import type { PasswordResetEmailParams, SendEmailResult } from "../types";
import { sendEmail } from "../send";
import { PasswordReset } from "../templates/PasswordReset";

export async function sendPasswordReset(
  params: PasswordResetEmailParams,
): Promise<SendEmailResult> {
  const { userEmail, resetUrl, expiresInMinutes = 60 } = params;

  return sendEmail({
    to: userEmail,
    subject: "Restablece tu contraseña de PadelHub",
    react: PasswordReset({
      userEmail,
      resetUrl,
      expiresInMinutes,
    }),
  });
}
