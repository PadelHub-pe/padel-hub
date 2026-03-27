"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@wifo/ui";

const MAX_DAYS_AHEAD = 14;
const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function DatePicker({
  selectedDate,
  onSelectDate,
  className,
}: DatePickerProps) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, MAX_DAYS_AHEAD);

  // Show quick date buttons for next 7 days
  const quickDates = eachDayOfInterval({
    start: today,
    end: addDays(today, 6),
  });

  function getDayLabel(date: Date): string {
    if (isSameDay(date, today)) return "Hoy";
    if (isSameDay(date, addDays(today, 1))) return "Mañana";
    return format(date, "EEE", { locale: es });
  }

  return (
    <div className={className}>
      {/* Quick date buttons */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {quickDates.map((date) => {
          const isSelected = selectedDate && isSameDay(selectedDate, date);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex flex-none flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
            >
              <span className="text-xs capitalize">{getDayLabel(date)}</span>
              <span className="text-lg font-semibold">{format(date, "d")}</span>
              <span className="text-xs capitalize">
                {format(date, "MMM", { locale: es })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full calendar below */}
      <MiniCalendar
        today={today}
        maxDate={maxDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
    </div>
  );
}

// =============================================================================
// Mini Calendar
// =============================================================================

function MiniCalendar({
  today,
  maxDate,
  selectedDate,
  onSelectDate,
}: {
  today: Date;
  maxDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  // Always show the month of today
  const currentMonth = startOfMonth(today);
  const nextMonth = addMonths(currentMonth, 1);

  // Show two months if maxDate extends into next month
  const showNextMonth = !isSameMonth(maxDate, currentMonth);

  return (
    <div className="mt-4 space-y-4">
      <CalendarMonth
        month={currentMonth}
        today={today}
        maxDate={maxDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
      {showNextMonth && (
        <CalendarMonth
          month={nextMonth}
          today={today}
          maxDate={maxDate}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      )}
    </div>
  );
}

function CalendarMonth({
  month,
  today,
  maxDate,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  today: Date;
  maxDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // getDay returns 0=Sun, we want Mon=0
  const startDayOffset = (getDay(monthStart) + 6) % 7;

  return (
    <div>
      <h3 className="text-muted-foreground text-sm font-medium capitalize">
        {format(month, "MMMM yyyy", { locale: es })}
      </h3>

      {/* Weekday headers */}
      <div className="mt-2 grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground py-1 text-xs font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 text-center">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const isDisabled = isBefore(day, today) || isBefore(maxDate, day);
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(day)}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                !isDisabled && !isSelected && "hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground",
                isToday && !isSelected && "font-bold",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
