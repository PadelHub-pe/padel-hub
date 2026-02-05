"use client";

import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@wifo/ui/button";

interface ScheduleHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBlockClick: () => void;
}

export function ScheduleHeader({
  selectedDate,
  onDateChange,
  onBlockClick,
}: ScheduleHeaderProps) {
  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Horarios y Disponibilidad
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura horarios de operacion, periodos pico y bloquea horarios
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onDateChange(subDays(selectedDate, 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
            disabled={isToday}
          >
            Hoy
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Date Display */}
        <span className="min-w-[180px] text-center text-sm font-medium text-gray-700">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </span>

        {/* Block Time Button */}
        <Button onClick={onBlockClick}>
          <BanIcon className="mr-2 h-4 w-4" />
          Bloquear Horario
        </Button>
      </div>
    </div>
  );
}

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

function BanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}
