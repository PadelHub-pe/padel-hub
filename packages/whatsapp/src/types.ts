export interface SendOtpParams {
  /** Phone number in E.164 format (e.g., "51987654321") */
  phone: string;
  /** 6-digit OTP code to send */
  code: string;
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendBookingConfirmationParams {
  phone: string;
  customerName: string;
  facilityName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingCode: string;
}

export interface SendBookingConfirmationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
