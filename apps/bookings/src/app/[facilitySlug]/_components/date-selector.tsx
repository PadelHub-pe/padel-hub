"use client";

import {
  addLimaDays,
  formatLimaDate,
  formatLimaDateParam,
  startOfLimaDay,
} from "@wifo/api/datetime";
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
  const today = startOfLimaDay(new Date());
  const dates = Array.from({ length: MAX_DAYS_AHEAD }, (_, i) =>
    addLimaDays(today, i),
  );
  const selectedYmd = formatLimaDateParam(selectedDate);
  const todayYmd = formatLimaDateParam(today);
  const tomorrowYmd = formatLimaDateParam(addLimaDays(today, 1));

  function getDayLabel(ymd: string, date: Date): string {
    if (ymd === todayYmd) return "Hoy";
    if (ymd === tomorrowYmd) return "Mañana";
    return formatLimaDate(date, "EEE");
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
          const ymd = formatLimaDateParam(date);
          const isSelected = ymd === selectedYmd;
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={formatLimaDate(date, "EEEE d 'de' MMMM")}
              aria-pressed={isSelected}
              className={cn(
                "flex w-14 flex-none flex-col items-center rounded-xl border py-2 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span className="text-[11px] leading-none font-medium capitalize">
                {getDayLabel(ymd, date)}
              </span>
              <span className="mt-0.5 text-lg leading-tight font-bold">
                {formatLimaDate(date, "d")}
              </span>
              <span className="text-[11px] leading-none capitalize opacity-70">
                {formatLimaDate(date, "MMM")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
