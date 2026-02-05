"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

interface SidebarMiniCalendarProps {
  selectedDate?: Date;
}

export function SidebarMiniCalendar({ selectedDate }: SidebarMiniCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate ?? new Date()));

  const handlePrevMonth = () => {
    setViewMonth(subMonths(viewMonth, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(addMonths(viewMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    // Navigate to calendar page with the selected date
    const dateStr = format(day, "yyyy-MM-dd");
    router.push(`/bookings/calendar?date=${dateStr}`);
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  const today = new Date();
  const isToday = (day: Date) =>
    day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear();

  const isSelected = (day: Date) =>
    selectedDate &&
    day.getDate() === selectedDate.getDate() &&
    day.getMonth() === selectedDate.getMonth() &&
    day.getFullYear() === selectedDate.getFullYear();

  const isOnCalendarPage = pathname.startsWith("/bookings/calendar");

  return (
    <div className="px-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium capitalize text-white">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-1 text-[10px] font-medium uppercase text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isTodayDate = isToday(day);
          const isSelectedDate = isSelected(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={!isCurrentMonth}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
                !isCurrentMonth
                  ? "text-gray-600"
                  : isSelectedDate && isOnCalendarPage
                    ? "bg-blue-600 font-semibold text-white"
                    : isTodayDate
                      ? "bg-blue-500/20 font-semibold text-blue-400"
                      : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
