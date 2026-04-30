"use client";

import {
  addLimaDays,
  formatLimaDate,
  formatLimaDateParam,
  startOfLimaDay,
  startOfLimaMonth,
} from "@wifo/api/datetime";
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
  const today = startOfLimaDay(new Date());
  const todayYmd = formatLimaDateParam(today);
  const tomorrowYmd = formatLimaDateParam(addLimaDays(today, 1));
  const maxDate = addLimaDays(today, MAX_DAYS_AHEAD);
  const maxYmd = formatLimaDateParam(maxDate);
  const selectedYmd = selectedDate ? formatLimaDateParam(selectedDate) : null;

  const quickDates = Array.from({ length: 7 }, (_, i) => addLimaDays(today, i));

  function getDayLabel(ymd: string, date: Date): string {
    if (ymd === todayYmd) return "Hoy";
    if (ymd === tomorrowYmd) return "Mañana";
    return formatLimaDate(date, "EEE");
  }

  return (
    <div className={className}>
      {/* Quick date buttons */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {quickDates.map((date) => {
          const ymd = formatLimaDateParam(date);
          const isSelected = selectedYmd === ymd;
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex flex-none flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
            >
              <span className="text-xs capitalize">
                {getDayLabel(ymd, date)}
              </span>
              <span className="text-lg font-semibold">
                {formatLimaDate(date, "d")}
              </span>
              <span className="text-xs capitalize">
                {formatLimaDate(date, "MMM")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full calendar below */}
      <MiniCalendar
        today={today}
        todayYmd={todayYmd}
        maxYmd={maxYmd}
        selectedYmd={selectedYmd}
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
  todayYmd,
  maxYmd,
  selectedYmd,
  onSelectDate,
}: {
  today: Date;
  todayYmd: string;
  maxYmd: string;
  selectedYmd: string | null;
  onSelectDate: (date: Date) => void;
}) {
  const currentMonth = startOfLimaMonth(today);
  // Adding 32 days from any month start always lands inside the next month.
  const nextMonth = startOfLimaMonth(addLimaDays(currentMonth, 32));

  // Show next month if maxDate extends into it
  const currentMonthYm = formatLimaDate(currentMonth, "yyyy-MM");
  const maxMonthYm = maxYmd.slice(0, 7);
  const showNextMonth = maxMonthYm !== currentMonthYm;

  return (
    <div className="mt-4 space-y-4">
      <CalendarMonth
        month={currentMonth}
        todayYmd={todayYmd}
        maxYmd={maxYmd}
        selectedYmd={selectedYmd}
        onSelectDate={onSelectDate}
      />
      {showNextMonth && (
        <CalendarMonth
          month={nextMonth}
          todayYmd={todayYmd}
          maxYmd={maxYmd}
          selectedYmd={selectedYmd}
          onSelectDate={onSelectDate}
        />
      )}
    </div>
  );
}

function CalendarMonth({
  month,
  todayYmd,
  maxYmd,
  selectedYmd,
  onSelectDate,
}: {
  month: Date;
  todayYmd: string;
  maxYmd: string;
  selectedYmd: string | null;
  onSelectDate: (date: Date) => void;
}) {
  const monthYmd = formatLimaDateParam(month);
  // Days of this calendar month: walk forward from the 1st until the month flips.
  const days: Date[] = [];
  for (let i = 0; i < 31; i++) {
    const day = addLimaDays(month, i);
    if (formatLimaDate(day, "yyyy-MM") !== formatLimaDate(month, "yyyy-MM")) {
      break;
    }
    days.push(day);
  }

  // Lima day-of-week of the 1st: 0=Sun..6=Sat. Convert to Mon-based offset.
  const firstDow = Number(formatLimaDate(month, "i")); // ISO 1=Mon..7=Sun
  const startDayOffset = firstDow - 1;

  return (
    <div>
      <h3 className="text-muted-foreground text-sm font-medium capitalize">
        {formatLimaDate(month, "MMMM yyyy")}
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
          <div key={`empty-${monthYmd}-${i}`} />
        ))}

        {days.map((day) => {
          const dayYmd = formatLimaDateParam(day);
          const isDisabled = dayYmd < todayYmd || dayYmd > maxYmd;
          const isSelected = selectedYmd === dayYmd;
          const isToday = dayYmd === todayYmd;

          return (
            <button
              key={dayYmd}
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
              {formatLimaDate(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
