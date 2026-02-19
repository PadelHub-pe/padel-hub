import type { OrganizationInviteEmailParams, SendEmailResult } from "../types";
import { emailConfig } from "../config";
import { sendEmail } from "../send";
import { OrganizationInvite } from "../templates/OrganizationInvite";

export async function sendOrganizationInvite(
  params: OrganizationInviteEmailParams,
): Promise<SendEmailResult> {
  const {
    inviteeEmail,
    organizationName,
    inviterName,
    role,
    facilityNames,
    inviteToken,
    expiresInDays = 7,
  } = params;

  const inviteUrl = `${emailConfig.baseUrl}/register?token=${inviteToken}`;
  const subject = `${inviterName} te invitó a ${organizationName} en PadelHub`;

  return sendEmail({
    to: inviteeEmail,
    subject,
    react: OrganizationInvite({
      inviteeEmail,
      organizationName,
      inviterName,
      role,
      facilityNames,
      inviteUrl,
      expiresInDays,
    }),
  });
}
