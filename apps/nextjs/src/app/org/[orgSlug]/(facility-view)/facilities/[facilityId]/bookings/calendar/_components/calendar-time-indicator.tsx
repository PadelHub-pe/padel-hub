"use client";

import { useEffect, useState } from "react";

import { isToday, timeToMinutes } from "./calendar-utils";

interface CalendarTimeIndicatorProps {
  currentDate: Date;
  openTime: string;
  closeTime: string;
}

export function CalendarTimeIndicator({
  currentDate,
  openTime,
  closeTime,
}: CalendarTimeIndicatorProps) {
  const [now, setNow] = useState(new Date());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Only show indicator for today
  if (!isToday(currentDate)) {
    return null;
  }

  // Calculate position
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const totalMinutes = closeMinutes - openMinutes;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Don't show if current time is outside operating hours
  if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
    return null;
  }

  const topPercent = ((currentMinutes - openMinutes) / totalMinutes) * 100;

  return (
    <div
      className="pointer-events-none absolute right-0 z-20 flex items-center"
      style={{
        top: `${topPercent}%`,
        left: "80px", // Align with grid content (past time column)
      }}
    >
      {/* Left dot */}
      <div className="relative -left-1 h-2.5 w-2.5 rounded-full bg-red-500" />

      {/* Line */}
      <div className="h-[2px] flex-1 bg-red-500" />

      {/* AHORA badge */}
      <div className="absolute -left-1 -top-5 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
        AHORA
      </div>
    </div>
  );
}
