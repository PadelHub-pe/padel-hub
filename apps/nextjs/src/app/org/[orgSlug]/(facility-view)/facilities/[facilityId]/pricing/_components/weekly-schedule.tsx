"use client";

import { useMemo } from "react";

interface OperatingDay {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface PeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
}

interface WeeklyScheduleProps {
  operatingHours: OperatingDay[];
  peakPeriods: PeakPeriod[];
  medianRegularCents: number;
  medianPeakCents: number;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
const WEEKEND_DAYS = [0, 6];

// Grid runs from 6AM to midnight (18 hours)
const GRID_START = 6;
const GRID_END = 24;
const TOTAL_SLOTS = GRID_END - GRID_START;

const TIME_LABELS = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM"];

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) + (m ?? 0) / 60;
}

type SegmentType = "closed" | "regular" | "peak";

interface Segment {
  type: SegmentType;
  startHour: number;
  endHour: number;
  widthPercent: number;
}

function buildSegments(day: OperatingDay, periods: PeakPeriod[]): Segment[] {
  if (day.isClosed) {
    return [
      {
        type: "closed",
        startHour: GRID_START,
        endHour: GRID_END,
        widthPercent: 100,
      },
    ];
  }

  const open = Math.max(parseTime(day.openTime), GRID_START);
  const close = Math.min(parseTime(day.closeTime), GRID_END);

  // Build hour-by-hour classification
  const hours: SegmentType[] = Array(TOTAL_SLOTS).fill(
    "closed",
  ) as SegmentType[];
  for (let h = 0; h < TOTAL_SLOTS; h++) {
    const hour = GRID_START + h;
    if (hour >= open && hour < close) {
      hours[h] = "regular";
    }
  }

  // Mark peak hours
  for (const period of periods) {
    if (!period.daysOfWeek.includes(day.dayOfWeek)) continue;
    const pStart = parseTime(period.startTime);
    const pEnd = parseTime(period.endTime);
    for (let h = 0; h < TOTAL_SLOTS; h++) {
      const hour = GRID_START + h;
      if (hour >= pStart && hour < pEnd && hours[h] === "regular") {
        hours[h] = "peak";
      }
    }
  }

  // Merge consecutive same-type segments
  const segments: Segment[] = [];
  let currentType = hours[0] ?? "closed";
  let start = GRID_START;

  for (let h = 1; h <= TOTAL_SLOTS; h++) {
    const type =
      h < TOTAL_SLOTS ? (hours[h] ?? "closed") : ("end" as SegmentType);
    if (type !== currentType || h === TOTAL_SLOTS) {
      const end = GRID_START + h;
      segments.push({
        type: currentType,
        startHour: start,
        endHour: end,
        widthPercent: ((end - start) / TOTAL_SLOTS) * 100,
      });
      currentType = type;
      start = end;
    }
  }

  return segments;
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`;
}

export function WeeklySchedule({
  operatingHours,
  peakPeriods,
  medianRegularCents,
  medianPeakCents,
}: WeeklyScheduleProps) {
  const daySegments = useMemo(() => {
    return DISPLAY_ORDER.map((dayOfWeek) => {
      const day = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
      const defaultDay: OperatingDay = {
        dayOfWeek,
        openTime: "08:00",
        closeTime: "22:00",
        isClosed: true,
      };
      return {
        dayOfWeek,
        segments: buildSegments(day ?? defaultDay, peakPeriods),
      };
    });
  }, [operatingHours, peakPeriods]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">
        Horario Semanal de Tarifas
      </h3>

      {/* Time header */}
      <div className="mb-1 flex">
        <div className="w-12 shrink-0" />
        <div className="flex flex-1 text-xs text-gray-400">
          {TIME_LABELS.map((label) => (
            <div key={label} className="flex-1 text-center">
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day rows */}
      <div className="space-y-1">
        {daySegments.map(({ dayOfWeek, segments }) => (
          <div key={dayOfWeek} className="flex items-center">
            <div
              className={`w-12 shrink-0 text-sm font-medium ${
                WEEKEND_DAYS.includes(dayOfWeek)
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {DAY_LABELS[dayOfWeek]}
            </div>
            <div className="flex h-8 flex-1 overflow-hidden rounded-lg">
              {segments.map((seg, i) => {
                const bgClass =
                  seg.type === "closed"
                    ? "bg-gray-200"
                    : seg.type === "peak"
                      ? "bg-amber-300"
                      : "bg-emerald-200";

                const showLabel = seg.widthPercent > 15;

                return (
                  <div
                    key={i}
                    className={`${bgClass} flex items-center justify-center transition-opacity hover:opacity-80`}
                    style={{ width: `${seg.widthPercent}%` }}
                  >
                    {showLabel && seg.type === "regular" && (
                      <span className="text-[10px] font-medium text-emerald-700">
                        {formatCents(medianRegularCents)}/hr
                      </span>
                    )}
                    {showLabel && seg.type === "peak" && (
                      <span className="text-[10px] font-bold text-amber-800">
                        {formatCents(medianPeakCents)}/hr
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <span className="text-xs text-gray-500">Cerrado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-emerald-200" />
          <span className="text-xs text-gray-500">
            Regular ({formatCents(medianRegularCents)}/hr)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-300" />
          <span className="text-xs text-gray-500">
            Pico ({formatCents(medianPeakCents)}/hr)
          </span>
        </div>
      </div>
    </div>
  );
}
