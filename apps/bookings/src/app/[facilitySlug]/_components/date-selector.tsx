"use client";

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@wifo/ui";

const MAX_DAYS_AHEAD = 14;

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
}: DateSelectorProps) {
  const today = startOfDay(new Date());
  const dates = eachDayOfInterval({
    start: today,
    end: addDays(today, MAX_DAYS_AHEAD - 1),
  });

  function getDayLabel(date: Date): string {
    if (isSameDay(date, today)) return "Hoy";
    if (isSameDay(date, addDays(today, 1))) return "Mañana";
    return format(date, "EEE", { locale: es });
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">
        ¿Cuándo quieres jugar?
      </h2>
      <div
        className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(selectedDate, date);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={format(date, "EEEE d 'de' MMMM", { locale: es })}
              aria-pressed={isSelected}
              className={cn(
                "flex w-14 flex-none flex-col items-center rounded-xl border py-2 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span className="text-[11px] leading-none font-medium capitalize">
                {getDayLabel(date)}
              </span>
              <span className="mt-0.5 text-lg leading-tight font-bold">
                {format(date, "d")}
              </span>
              <span className="text-[11px] leading-none capitalize opacity-70">
                {format(date, "MMM", { locale: es })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
