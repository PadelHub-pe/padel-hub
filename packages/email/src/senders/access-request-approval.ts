import type {
  AccessRequestApprovalEmailParams,
  SendEmailResult,
} from "../types";
import { emailConfig } from "../config";
import { sendEmail } from "../send";
import { AccessRequestApproval } from "../templates/AccessRequestApproval";

export async function sendAccessRequestApproval(
  params: AccessRequestApprovalEmailParams,
): Promise<SendEmailResult> {
  const { email, organizationName, inviteToken, expiresInDays = 7 } = params;

  const activateUrl = `${emailConfig.baseUrl}/register?token=${inviteToken}`;

  return sendEmail({
    to: email,
    subject: `Tu acceso a ${organizationName} fue aprobado — PadelHub`,
    react: AccessRequestApproval({
      email,
      organizationName,
      activateUrl,
      expiresInDays,
    }),
  });
}
