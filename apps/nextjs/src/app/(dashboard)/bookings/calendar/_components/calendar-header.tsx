"use client";

import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";

import { getWeekStart, isToday } from "./calendar-utils";

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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: "day" | "week";
  onViewModeChange: (mode: "day" | "week") => void;
  onAddBooking: () => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  onAddBooking,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (viewMode === "day") {
      onDateChange(subDays(currentDate, 1));
    } else {
      onDateChange(subDays(currentDate, 7));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      onDateChange(addDays(currentDate, 1));
    } else {
      onDateChange(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatDateDisplay = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } else {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = addDays(weekStart, 6);
      const startMonth = format(weekStart, "MMMM", { locale: es });
      const endMonth = format(weekEnd, "MMMM", { locale: es });

      if (startMonth === endMonth) {
        return `${format(weekStart, "d", { locale: es })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
      } else {
        return `${format(weekStart, "d 'de' MMMM", { locale: es })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="h-9 w-9"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            disabled={isToday(currentDate)}
            className="px-3"
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="h-9 w-9"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Date display */}
        <h2 className="text-lg font-semibold capitalize text-gray-900">
          {formatDateDisplay()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* View toggle */}
        <div className="inline-flex rounded-md border bg-gray-50">
          <button
            onClick={() => onViewModeChange("day")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "day"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            } rounded-l-md`}
          >
            <CalendarIcon className="mr-1.5 inline-block h-4 w-4" />
            Día
          </button>
          <button
            onClick={() => onViewModeChange("week")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "week"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            } rounded-r-md`}
          >
            <CalendarIcon className="mr-1.5 inline-block h-4 w-4" />
            Semana
          </button>
        </div>

        {/* Add booking button */}
        <Button onClick={onAddBooking}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Agregar Reserva
        </Button>
      </div>
    </div>
  );
}
