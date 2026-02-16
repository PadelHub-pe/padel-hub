"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { BookingTooltip } from "./booking-tooltip";
import {
  generateTimeSlots,
  getStatusColors,
  getWeekDates,
  getWeekStart,
  isToday,
  timeToMinutes,
} from "./calendar-utils";

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

interface DayInfo {
  date: Date;
  dayOfWeek: number;
  operatingHours: {
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  };
  bookingCount: number;
  revenueInCents: number;
}

interface CalendarWeekGridProps {
  weekStart: Date;
  days: DayInfo[];
  bookings: Booking[];
  onBookingClick: (bookingId: string) => void;
  onDayClick: (date: Date) => void;
}

export function CalendarWeekGrid({
  weekStart,
  days,
  bookings,
  onBookingClick,
  onDayClick,
}: CalendarWeekGridProps) {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const weekDates = getWeekDates(getWeekStart(weekStart));

  // Find common operating hours (use first non-closed day as reference)
  const referenceDay = days.find((d) => !d.operatingHours.isClosed);
  const defaultHours = { openTime: "08:00", closeTime: "22:00" };
  const operatingHours = referenceDay?.operatingHours ?? defaultHours;

  const timeSlots = generateTimeSlots(
    operatingHours.openTime,
    operatingHours.closeTime,
    60,
  );

  // Group bookings by date
  const bookingsByDate = bookings.reduce<Record<string, Booking[]>>(
    (acc, booking) => {
      const dateKey = format(new Date(booking.date), "yyyy-MM-dd");
      const existing = acc[dateKey] ?? [];
      existing.push(booking);
      acc[dateKey] = existing;
      return acc;
    },
    {},
  );

  // Get bookings for a specific time slot and date
  const getBookingsForSlot = (date: Date, timeSlot: string) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayBookings = bookingsByDate[dateKey] ?? [];
    const slotMinutes = timeToMinutes(timeSlot);
    const nextSlotMinutes = slotMinutes + 60;

    return dayBookings.filter((b) => {
      const startMinutes = timeToMinutes(b.startTime);
      const endMinutes = timeToMinutes(b.endTime);
      // Booking overlaps with this slot
      return startMinutes < nextSlotMinutes && endMinutes > slotMinutes;
    });
  };

  return (
    <div className="overflow-auto rounded-lg border bg-white">
      {/* Header row with day names */}
      <div className="sticky top-0 z-10 flex border-b bg-gray-50">
        <div className="w-20 shrink-0 border-r px-2 py-3">
          <span className="text-xs font-medium text-gray-500">Hora</span>
        </div>
        {weekDates.map((date, index) => {
          const dayInfo = days[index];
          const isTodayDate = isToday(date);
          const isClosed = dayInfo?.operatingHours.isClosed;

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDayClick(date)}
              className={`flex min-w-[120px] flex-1 flex-col items-center border-r px-2 py-2 transition-colors last:border-r-0 hover:bg-gray-100 ${
                isTodayDate ? "bg-blue-50" : ""
              }`}
            >
              <span
                className={`text-xs uppercase ${
                  isTodayDate ? "font-semibold text-blue-600" : "text-gray-500"
                }`}
              >
                {format(date, "EEE", { locale: es })}
              </span>
              <span
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  isTodayDate
                    ? "bg-blue-600 text-white"
                    : isClosed
                      ? "text-gray-400"
                      : "text-gray-900"
                }`}
              >
                {format(date, "d")}
              </span>
              {!isClosed && dayInfo && (
                <span className="mt-1 text-[10px] text-gray-500">
                  {dayInfo.bookingCount} reservas
                </span>
              )}
              {isClosed && (
                <span className="mt-1 text-[10px] text-gray-400">Cerrado</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots grid */}
      <div className="relative">
        {timeSlots.map((time) => (
          <div key={time} className="flex border-b last:border-b-0">
            {/* Time label */}
            <div className="w-20 shrink-0 border-r px-2 py-2">
              <span className="text-xs font-medium text-gray-500">{time}</span>
            </div>

            {/* Day columns */}
            {weekDates.map((date, index) => {
              const dayInfo = days[index];
              const isTodayDate = isToday(date);
              const isClosed = dayInfo?.operatingHours.isClosed;
              const slotBookings = getBookingsForSlot(date, time);

              return (
                <div
                  key={date.toISOString()}
                  className={`relative min-h-[48px] min-w-[120px] flex-1 border-r p-0.5 last:border-r-0 ${
                    isTodayDate ? "bg-blue-50/50" : ""
                  } ${isClosed ? "bg-gray-100" : ""}`}
                  onClick={() => !isClosed && onDayClick(date)}
                >
                  {!isClosed && (
                    <div className="flex flex-col gap-0.5">
                      {slotBookings.slice(0, 2).map((booking) => {
                        const colors = getStatusColors(booking.status);
                        const displayName =
                          booking.user?.name ??
                          booking.customerName ??
                          booking.user?.email ??
                          "Reserva";

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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenTooltipId(booking.id);
                              }}
                              className={`truncate rounded border-l-2 px-1 py-0.5 text-left text-[10px] ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80`}
                            >
                              {displayName}
                            </button>
                          </BookingTooltip>
                        );
                      })}
                      {slotBookings.length > 2 && (
                        <span className="text-center text-[10px] text-gray-500">
                          +{slotBookings.length - 2} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
