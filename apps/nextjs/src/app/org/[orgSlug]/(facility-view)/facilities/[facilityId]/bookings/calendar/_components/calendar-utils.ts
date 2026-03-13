import { addDays, startOfWeek } from "date-fns";

/**
 * Convert time string (HH:mm:ss or HH:mm) to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Convert minutes from midnight to time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate time slots array from open to close time
 * Returns array of time strings in HH:mm format
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes = 60,
): string[] {
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const slots: string[] = [];

  for (let m = openMinutes; m < closeMinutes; m += intervalMinutes) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Calculate booking position and height for grid rendering
 * Returns values as percentages relative to operating hours
 */
export function calculateBookingPosition(
  startTime: string,
  endTime: string,
  openTime: string,
  closeTime: string,
): { topPercent: number; heightPercent: number } {
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const totalMinutes = closeMinutes - openMinutes;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const topPercent = ((startMinutes - openMinutes) / totalMinutes) * 100;
  const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

  return { topPercent, heightPercent };
}

/**
 * Check if a time falls within a peak period
 */
export function isTimeInPeakPeriod(
  time: string,
  peakPeriods: { startTime: string; endTime: string }[],
): boolean {
  const minutes = timeToMinutes(time);

  return peakPeriods.some((period) => {
    const startMinutes = timeToMinutes(period.startTime);
    const endMinutes = timeToMinutes(period.endTime);
    return minutes >= startMinutes && minutes < endMinutes;
  });
}

/**
 * Get Monday of the week for a given date
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

/**
 * Get array of dates for a week starting from Monday
 */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Format time string for display (HH:mm:ss -> HH:mm)
 */
export function formatTime(time: string): string {
  return time.substring(0, 5);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Calculate end time by adding 90 minutes (1.5h) to start time
 */
export function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0) + 90;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
}

/**
 * Check if a time slot is within a blocked slot for a given court
 */
export function isTimeBlocked(
  time: string,
  courtId: string,
  blockedSlots: {
    courtId: string | null;
    startTime: string;
    endTime: string;
  }[],
): boolean {
  const minutes = timeToMinutes(time);
  return blockedSlots.some((bs) => {
    // null courtId means facility-wide block
    if (bs.courtId !== null && bs.courtId !== courtId) return false;
    const startMinutes = timeToMinutes(bs.startTime);
    const endMinutes = timeToMinutes(bs.endTime);
    return minutes >= startMinutes && minutes < endMinutes;
  });
}

/**
 * Check if a time slot is outside operating hours (closed)
 */
export function isTimeOutsideOperatingHours(
  time: string,
  operatingHours: { openTime: string; closeTime: string; isClosed: boolean },
): boolean {
  if (operatingHours.isClosed) return true;
  const minutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(operatingHours.openTime);
  const closeMinutes = timeToMinutes(operatingHours.closeTime);
  return minutes < openMinutes || minutes >= closeMinutes;
}

/**
 * Get status color classes for booking blocks
 */
export function getStatusColors(status: string): {
  bg: string;
  border: string;
  text: string;
} {
  switch (status) {
    case "confirmed":
      return {
        bg: "bg-blue-50",
        border: "border-l-blue-500",
        text: "text-blue-900",
      };
    case "in_progress":
      return {
        bg: "bg-green-50",
        border: "border-l-green-500",
        text: "text-green-900",
      };
    case "completed":
      return {
        bg: "bg-gray-50",
        border: "border-l-gray-400",
        text: "text-gray-600",
      };
    case "cancelled":
      return {
        bg: "bg-red-50",
        border: "border-l-red-500",
        text: "text-red-900",
      };
    case "pending":
      return {
        bg: "bg-yellow-50",
        border: "border-l-yellow-500",
        text: "text-yellow-900",
      };
    case "open_match":
      return {
        bg: "bg-amber-50",
        border: "border-l-amber-500",
        text: "text-amber-900",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-l-gray-400",
        text: "text-gray-900",
      };
  }
}
