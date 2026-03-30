"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { BookingTooltip } from "./booking-tooltip";
import {
  generateTimeSlots,
  getCourtDotColor,
  getStatusColors,
  getWeekDates,
  getWeekStart,
  isToday,
  timeToMinutes,
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
  courts: Court[];
  onBookingClick: (bookingId: string) => void;
  onDayClick: (date: Date) => void;
  onEmptySlotClick: (date: Date, startTime: string) => void;
}

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export const CalendarWeekGrid = memo(function CalendarWeekGrid({
  weekStart,
  days,
  bookings,
  courts,
  onBookingClick,
  onDayClick,
  onEmptySlotClick,
}: CalendarWeekGridProps) {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const weekDates = getWeekDates(getWeekStart(weekStart));

  // Update current time every minute (for time indicator)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Build court name lookup for color dots
  const courtNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courts) {
      map.set(c.id, c.name);
    }
    return map;
  }, [courts]);

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

  // Current time indicator calculations
  const todayColumnIndex = weekDates.findIndex((d) => isToday(d));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(operatingHours.openTime);
  const closeMinutes = timeToMinutes(operatingHours.closeTime);
  const showTimeIndicator =
    todayColumnIndex >= 0 &&
    currentMinutes >= openMinutes &&
    currentMinutes <= closeMinutes;
  const timeIndicatorTopPercent = showTimeIndicator
    ? ((currentMinutes - openMinutes) / (closeMinutes - openMinutes)) * 100
    : 0;

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
          const weekend = dayInfo ? isWeekend(dayInfo.dayOfWeek) : false;

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDayClick(date)}
              className={`flex min-w-[120px] flex-1 flex-col items-center border-r px-2 py-2 transition-colors last:border-r-0 hover:bg-gray-100 ${
                isTodayDate ? "bg-blue-50" : weekend ? "bg-gray-50/70" : ""
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
        {/* Current time red line indicator */}
        {showTimeIndicator && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex"
            style={{ top: `${timeIndicatorTopPercent}%` }}
          >
            <div className="w-20 shrink-0" />
            {weekDates.map((_, i) => (
              <div key={i} className="relative min-w-[120px] flex-1">
                {i === todayColumnIndex && (
                  <div className="absolute inset-x-0 flex items-center">
                    <div className="relative -left-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <div className="h-[2px] flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
              const weekend = dayInfo ? isWeekend(dayInfo.dayOfWeek) : false;
              const slotBookings = isClosed
                ? []
                : getBookingsForSlot(date, time);

              return (
                <div
                  key={date.toISOString()}
                  className={`group relative min-h-[48px] min-w-[120px] flex-1 border-r p-0.5 last:border-r-0 ${
                    isClosed
                      ? "bg-stripes-gray cursor-not-allowed bg-gray-100"
                      : isTodayDate
                        ? "bg-blue-50/50"
                        : weekend
                          ? "bg-gray-50/50"
                          : ""
                  } ${!isClosed ? "cursor-pointer hover:bg-blue-50/40" : ""}`}
                  onClick={() => {
                    if (!isClosed) {
                      onEmptySlotClick(date, time);
                    }
                  }}
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
                        const courtName =
                          courtNameMap.get(booking.courtId) ?? "";

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
                              className={`flex w-full items-center gap-1 truncate rounded border-l-2 px-1 py-0.5 text-left text-[10px] ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80`}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: getCourtDotColor(courtName),
                                }}
                              />
                              <span className="truncate">{displayName}</span>
                            </button>
                          </BookingTooltip>
                        );
                      })}
                      {slotBookings.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDayClick(date);
                          }}
                          className="text-center text-[10px] font-medium text-blue-600 hover:text-blue-700"
                        >
                          +{slotBookings.length - 2} más
                        </button>
                      )}
                    </div>
                  )}

                  {/* "+" hover indicator for empty clickable cells */}
                  {!isClosed && slotBookings.length === 0 && (
                    <div className="absolute inset-0 hidden items-center justify-center group-hover:flex">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-500">
                        +
                      </span>
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
});
