export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export interface OrganizationInviteEmailParams {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  role: "org_admin" | "facility_manager" | "staff";
  facilityNames?: string[];
  inviteToken: string;
  expiresInDays?: number;
}

export interface PasswordResetEmailParams {
  userEmail: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface AccessRequestConfirmationEmailParams {
  email: string;
}

export interface AccessRequestApprovalEmailParams {
  email: string;
  organizationName: string;
  inviteToken: string;
  expiresInDays?: number;
}
