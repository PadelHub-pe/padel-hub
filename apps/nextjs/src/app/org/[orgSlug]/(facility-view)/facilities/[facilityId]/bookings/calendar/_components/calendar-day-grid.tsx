"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BookingTooltip } from "./booking-tooltip";
import { CalendarBookingBlock } from "./calendar-booking-block";
import { CalendarTimeIndicator } from "./calendar-time-indicator";
import {
  calculateBookingPosition,
  generateTimeSlots,
  isTimeBlocked,
  isTimeInPeakPeriod,
  isToday,
} from "./calendar-utils";

interface Court {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Booking {
  id: string;
  code: string;
  courtId: string;
  date: Date;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  status: string;
  customerName: string | null;
  playerCount: number;
  user: { name: string | null; email: string } | null;
}

interface BlockedSlot {
  id: string;
  courtId: string | null;
  startTime: string;
  endTime: string;
  reason: string;
}

interface CalendarDayGridProps {
  currentDate: Date;
  courts: Court[];
  bookings: Booking[];
  operatingHours: {
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  };
  peakPeriods: { startTime: string; endTime: string }[];
  blockedSlots: BlockedSlot[];
  onBookingClick: (bookingId: string) => void;
  onEmptySlotClick: (courtId: string, startTime: string) => void;
}

/** Map blocked slot reason to Spanish label */
function getBlockedReasonLabel(reason: string): string {
  switch (reason) {
    case "maintenance":
      return "Mantenimiento";
    case "private_event":
      return "Evento Privado";
    case "tournament":
      return "Torneo";
    case "weather":
      return "Clima";
    case "other":
      return "Bloqueado";
    default:
      return "Bloqueado";
  }
}

export function CalendarDayGrid({
  currentDate,
  courts,
  bookings,
  operatingHours,
  peakPeriods,
  blockedSlots,
  onBookingClick,
  onEmptySlotClick,
}: CalendarDayGridProps) {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // Sort courts: active first (by name), then maintenance (by name)
  const sortedCourts = useMemo(() => {
    return [...courts].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [courts]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (operatingHours.isClosed) {
    return (
      <div className="bg-stripes-gray flex h-96 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">Cerrado este día</p>
      </div>
    );
  }

  const timeSlots = generateTimeSlots(
    operatingHours.openTime,
    operatingHours.closeTime,
    60,
  );

  // Determine which time slot is closest to current time (for auto-scroll)
  const currentTimeSlot = isToday(currentDate)
    ? (() => {
        const now = new Date();
        const currentHour = now.getHours();
        const slot = `${currentHour.toString().padStart(2, "0")}:00`;
        return timeSlots.includes(slot) ? slot : null;
      })()
    : null;

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

  return (
    <div className="relative overflow-auto rounded-lg border bg-white">
      {/* Header row with court names */}
      <div className="sticky top-0 z-10 flex border-b bg-gray-50">
        <div className="w-20 shrink-0 border-r px-2 py-3">
          <span className="text-xs font-medium text-gray-500">Hora</span>
        </div>
        {sortedCourts.map((court) => (
          <div
            key={court.id}
            className={`flex min-w-[150px] flex-1 items-center gap-2 border-r px-3 py-3 last:border-r-0 ${
              court.status === "maintenance" ? "bg-gray-100" : ""
            }`}
          >
            {/* Status dot */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                court.status === "active" ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            {/* Type icon */}
            <span className="text-xs">
              {court.type === "indoor" ? "🏠" : "☀️"}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {court.name}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                court.type === "indoor"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {court.type === "indoor" ? "Techada" : "Al aire"}
            </span>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="relative">
        {/* Time indicator */}
        <CalendarTimeIndicator
          currentDate={currentDate}
          openTime={operatingHours.openTime}
          closeTime={operatingHours.closeTime}
        />

        {/* Time slots */}
        {timeSlots.map((time) => {
          const isPeak = isTimeInPeakPeriod(time, peakPeriods);
          const isCurrentSlot = time === currentTimeSlot;

          return (
            <div
              key={time}
              ref={isCurrentSlot ? scrollTargetRef : undefined}
              className="flex border-b last:border-b-0"
            >
              {/* Time label */}
              <div className="w-20 shrink-0 border-r px-2 py-2">
                <span className="text-xs font-medium text-gray-500">
                  {time}
                </span>
              </div>

              {/* Court columns */}
              {sortedCourts.map((court) => {
                const blocked = isTimeBlocked(time, court.id, blockedSlots);
                const isMaintenance = court.status === "maintenance";
                const isClickable = !blocked && !isMaintenance;

                return (
                  <div
                    key={court.id}
                    className={`group relative h-16 min-w-[150px] flex-1 border-r transition-colors last:border-r-0 ${
                      blocked
                        ? "cursor-not-allowed bg-red-50"
                        : isMaintenance
                          ? "cursor-not-allowed bg-gray-50/50"
                          : isPeak
                            ? "bg-stripes-orange cursor-pointer bg-amber-50 hover:bg-blue-50"
                            : "cursor-pointer bg-green-50/50 hover:bg-blue-50"
                    }`}
                    onClick={
                      isClickable
                        ? () => onEmptySlotClick(court.id, time)
                        : undefined
                    }
                  >
                    {/* "+" hover indicator for clickable empty cells */}
                    {isClickable && (
                      <div className="absolute inset-0 hidden items-center justify-center group-hover:flex">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-500">
                          +
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Overlay: blocked slots + bookings positioned absolutely */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ left: "80px" }}
        >
          <div className="relative h-full">
            {sortedCourts.map((court, courtIndex) => (
              <div
                key={court.id}
                className="absolute top-0 h-full"
                style={{
                  left: `${(courtIndex / sortedCourts.length) * 100}%`,
                  width: `${100 / sortedCourts.length}%`,
                }}
              >
                {/* Blocked slot overlays */}
                {blockedSlots
                  .filter(
                    (bs) => bs.courtId === null || bs.courtId === court.id,
                  )
                  .map((bs) => {
                    const { topPercent, heightPercent } =
                      calculateBookingPosition(
                        bs.startTime,
                        bs.endTime,
                        operatingHours.openTime,
                        operatingHours.closeTime,
                      );

                    return (
                      <div
                        key={`blocked-${bs.id}-${court.id}`}
                        className="absolute inset-x-1 flex items-center gap-1.5 overflow-hidden rounded border-l-[3px] border-l-red-300 bg-red-50/80 px-2"
                        style={{
                          top: `${topPercent}%`,
                          height: `calc(${heightPercent}% - 2px)`,
                        }}
                      >
                        <BlockedIcon className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span className="truncate text-xs font-medium text-red-700">
                          {getBlockedReasonLabel(bs.reason)}
                        </span>
                      </div>
                    );
                  })}

                {/* Booking blocks */}
                <div className="pointer-events-auto">
                  {bookingsByCourtId[court.id]?.map((booking) => {
                    const { topPercent, heightPercent } =
                      calculateBookingPosition(
                        booking.startTime,
                        booking.endTime,
                        operatingHours.openTime,
                        operatingHours.closeTime,
                      );

                    return (
                      <BookingTooltip
                        key={booking.id}
                        bookingId={booking.id}
                        open={openTooltipId === booking.id}
                        onOpenChange={(open) => {
                          setOpenTooltipId(open ? booking.id : null);
                        }}
                        onViewDetails={() => {
                          setOpenTooltipId(null);
                          onBookingClick(booking.id);
                        }}
                      >
                        <CalendarBookingBlock
                          booking={booking}
                          topPercent={topPercent}
                          heightPercent={heightPercent}
                          onClick={() => setOpenTooltipId(booking.id)}
                        />
                      </BookingTooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small blocked/ban icon */
function BlockedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
