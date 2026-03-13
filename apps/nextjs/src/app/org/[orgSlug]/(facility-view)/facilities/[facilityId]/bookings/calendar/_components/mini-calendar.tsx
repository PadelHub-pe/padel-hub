"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { isSameDay, isToday } from "./calendar-utils";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function MiniCalendar({
  selectedDate,
  onDateSelect,
}: MiniCalendarProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));

  // Fetch dates with bookings for the current view month
  const { data: bookingDatesData } = useQuery({
    ...trpc.calendar.getMonthBookingDates.queryOptions({
      facilityId,
      month: viewMonth,
    }),
  });

  const bookingDatesSet = new Set(
    bookingDatesData?.dates.map((d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }) ?? [],
  );

  const hasBookings = (day: Date): boolean =>
    bookingDatesSet.has(
      `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
    );

  const handlePrevMonth = () => {
    setViewMonth(subMonths(viewMonth, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(addMonths(viewMonth, 1));
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-7 w-7"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-medium text-gray-900 capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="mt-3 grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="flex h-8 items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isTodayDate = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const hasDayBookings = isCurrentMonth && hasBookings(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              disabled={!isCurrentMonth}
              className={`relative flex h-8 w-8 flex-col items-center justify-center rounded-full text-sm transition-colors ${
                !isCurrentMonth
                  ? "text-gray-300"
                  : isSelected
                    ? "bg-blue-600 font-semibold text-white"
                    : isTodayDate
                      ? "bg-blue-100 font-semibold text-blue-600"
                      : "text-gray-900 hover:bg-gray-100"
              }`}
            >
              {format(day, "d")}
              {hasDayBookings && (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                    isSelected ? "bg-white" : "bg-blue-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
