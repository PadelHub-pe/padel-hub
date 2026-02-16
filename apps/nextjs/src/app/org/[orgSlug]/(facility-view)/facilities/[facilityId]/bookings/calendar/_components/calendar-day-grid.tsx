"use client";

import { useState } from "react";

import { BookingTooltip } from "./booking-tooltip";
import { CalendarBookingBlock } from "./calendar-booking-block";
import { CalendarTimeIndicator } from "./calendar-time-indicator";
import {
  calculateBookingPosition,
  generateTimeSlots,
  isTimeInPeakPeriod,
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
  onBookingClick: (bookingId: string) => void;
  onEmptySlotClick: (courtId: string, startTime: string) => void;
}

export function CalendarDayGrid({
  currentDate,
  courts,
  bookings,
  operatingHours,
  peakPeriods,
  onBookingClick,
  onEmptySlotClick,
}: CalendarDayGridProps) {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  if (operatingHours.isClosed) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">Cerrado este día</p>
      </div>
    );
  }

  const timeSlots = generateTimeSlots(
    operatingHours.openTime,
    operatingHours.closeTime,
    60,
  );

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
        {courts.map((court) => (
          <div
            key={court.id}
            className="flex min-w-[150px] flex-1 items-center gap-2 border-r px-3 py-3 last:border-r-0"
          >
            <span className="text-sm font-medium text-gray-900">{court.name}</span>
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
                  className={`relative h-16 min-w-[150px] flex-1 cursor-pointer border-r transition-colors last:border-r-0 hover:bg-gray-50 ${
                    isPeak ? "bg-stripes-orange" : ""
                  }`}
                  onClick={() => onEmptySlotClick(court.id, time)}
                >
                  {/* Empty slot - booking blocks are rendered as overlay */}
                </div>
              ))}
            </div>
          );
        })}

        {/* Overlay bookings positioned absolutely */}
        <div className="pointer-events-none absolute inset-0" style={{ left: "80px" }}>
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
                {bookingsByCourtId[court.id]?.map((booking) => {
                  const { topPercent, heightPercent } = calculateBookingPosition(
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
