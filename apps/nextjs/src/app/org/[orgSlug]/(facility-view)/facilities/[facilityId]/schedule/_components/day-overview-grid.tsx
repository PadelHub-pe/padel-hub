"use client";

import { cn } from "@wifo/ui";

interface Court {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface PeakPeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  markupPercent: number;
}

interface Booking {
  id: string;
  code: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  isPeakRate: boolean;
}

interface BlockedSlot {
  id: string;
  courtId: string | null;
  courtName: string | null;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string | null;
}

interface DayOverviewGridProps {
  date: Date;
  courts: Court[];
  operatingHours: {
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  };
  peakPeriods: PeakPeriod[];
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  onEmptySlotClick: (courtId: string, startTime: string) => void;
}

/**
 * Convert time string to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Convert minutes to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate time slots from open to close
 */
function generateTimeSlots(openTime: string, closeTime: string): string[] {
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const slots: string[] = [];

  for (let m = openMinutes; m < closeMinutes; m += 60) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Check if time is in peak period
 */
function isTimeInPeak(time: string, peakPeriods: PeakPeriod[]): boolean {
  const minutes = timeToMinutes(time);
  return peakPeriods.some((p) => {
    const start = timeToMinutes(p.startTime);
    const end = timeToMinutes(p.endTime);
    return minutes >= start && minutes < end;
  });
}

/**
 * Calculate position and height percentages for a time block
 */
function calculateBlockPosition(
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

const reasonLabels: Record<string, string> = {
  maintenance: "Mantenimiento",
  private_event: "Evento Privado",
  tournament: "Torneo",
  weather: "Clima",
  other: "Otro",
};

export function DayOverviewGrid({
  courts,
  operatingHours,
  peakPeriods,
  bookings,
  blockedSlots,
  onEmptySlotClick,
}: DayOverviewGridProps) {
  if (operatingHours.isClosed) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">Cerrado este dia</p>
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No hay canchas activas</p>
          <p className="mt-1 text-sm text-gray-400">
            Agrega canchas desde la seccion de Canchas
          </p>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots(
    operatingHours.openTime,
    operatingHours.closeTime,
  );

  if (timeSlots.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Horario no configurado</p>
          <p className="mt-1 text-sm text-gray-400">
            {operatingHours.openTime} - {operatingHours.closeTime}
          </p>
        </div>
      </div>
    );
  }

  // Group bookings by court
  const bookingsByCourtId = bookings.reduce<Record<string, Booking[]>>(
    (acc, booking) => {
      const existing = acc[booking.courtId] ?? [];
      existing.push(booking);
      acc[booking.courtId] = existing;
      return acc;
    },
    {},
  );

  // Group blocked slots by court (null courtId means all courts)
  const blockedByCourtId = blockedSlots.reduce<Record<string, BlockedSlot[]>>(
    (acc, slot) => {
      if (slot.courtId) {
        const existing = acc[slot.courtId] ?? [];
        existing.push(slot);
        acc[slot.courtId] = existing;
      } else {
        // Apply to all courts
        courts.forEach((court) => {
          const existing = acc[court.id] ?? [];
          existing.push(slot);
          acc[court.id] = existing;
        });
      }
      return acc;
    },
    {},
  );

  return (
    <div className="relative overflow-auto rounded-lg border bg-white">
      {/* Header row with court names */}
      <div className="sticky top-0 z-10 flex border-b bg-gray-50">
        <div className="w-20 shrink-0 border-r px-2 py-3">
          <span className="text-xs font-medium text-gray-500">Hora</span>
        </div>
        {courts.map((court) => (
          <div
            key={court.id}
            className="flex min-w-[140px] flex-1 items-center gap-2 border-r px-3 py-3 last:border-r-0"
          >
            <span className="text-sm font-medium text-gray-900">{court.name}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                court.type === "indoor"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              {court.type === "indoor" ? "Techada" : "Al aire"}
            </span>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="relative">
        {/* Time slots */}
        {timeSlots.map((time) => {
          const isPeak = isTimeInPeak(time, peakPeriods);

          return (
            <div key={time} className="flex border-b last:border-b-0">
              {/* Time label */}
              <div className="w-20 shrink-0 border-r px-2 py-2">
                <span className="text-xs font-medium text-gray-500">{time}</span>
              </div>

              {/* Court columns */}
              {courts.map((court) => (
                <div
                  key={court.id}
                  className={cn(
                    "relative h-16 min-w-[140px] flex-1 cursor-pointer border-r transition-colors last:border-r-0 hover:bg-gray-50",
                    isPeak && "bg-amber-50/50",
                  )}
                  onClick={() => onEmptySlotClick(court.id, time)}
                >
                  {/* Peak indicator stripe */}
                  {isPeak && (
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-1 bg-amber-400/30" />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Overlay: Bookings and Blocked slots */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ left: "80px" }}
        >
          <div className="relative h-full">
            {courts.map((court, courtIndex) => (
              <div
                key={court.id}
                className="pointer-events-auto absolute top-0 h-full"
                style={{
                  left: `${(courtIndex / courts.length) * 100}%`,
                  width: `${100 / courts.length}%`,
                }}
              >
                {/* Blocked slots */}
                {blockedByCourtId[court.id]?.map((slot) => {
                  const { topPercent, heightPercent } = calculateBlockPosition(
                    slot.startTime,
                    slot.endTime,
                    operatingHours.openTime,
                    operatingHours.closeTime,
                  );

                  return (
                    <div
                      key={slot.id}
                      className="absolute mx-1 flex flex-col justify-center rounded border-l-4 border-red-500 bg-red-50 px-2 py-1"
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <span className="truncate text-xs font-medium text-red-800">
                        {reasonLabels[slot.reason] ?? slot.reason}
                      </span>
                      <span className="truncate text-[10px] text-red-600">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  );
                })}

                {/* Bookings */}
                {bookingsByCourtId[court.id]?.map((booking) => {
                  const { topPercent, heightPercent } = calculateBlockPosition(
                    booking.startTime,
                    booking.endTime,
                    operatingHours.openTime,
                    operatingHours.closeTime,
                  );

                  const statusColors = getStatusColors(booking.status);

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "absolute mx-1 flex flex-col justify-center rounded border-l-4 px-2 py-1",
                        statusColors.bg,
                        statusColors.border,
                      )}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <span
                        className={cn(
                          "truncate text-xs font-medium",
                          statusColors.text,
                        )}
                      >
                        {booking.customerName ?? booking.code}
                      </span>
                      <span className="truncate text-[10px] text-gray-500">
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColors(status: string): {
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
    default:
      return {
        bg: "bg-gray-50",
        border: "border-l-gray-400",
        text: "text-gray-900",
      };
  }
}
