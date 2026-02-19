"use client";

import { forwardRef } from "react";

import { formatTime, getStatusColors } from "./calendar-utils";

interface CalendarBookingBlockProps {
  booking: {
    id: string;
    code: string;
    startTime: string;
    endTime: string;
    status: string;
    isPeakRate: boolean;
    customerName: string | null;
    playerCount: number;
    user: { name: string | null; email: string } | null;
  };
  topPercent: number;
  heightPercent: number;
  onClick: () => void;
}

export const CalendarBookingBlock = forwardRef<
  HTMLButtonElement,
  CalendarBookingBlockProps
>(function CalendarBookingBlock(
  { booking, topPercent, heightPercent, onClick },
  ref,
) {
  const colors = getStatusColors(booking.status);
  const displayName =
    booking.user?.name ??
    booking.customerName ??
    booking.user?.email ??
    "Sin nombre";

  // Determine if we have enough height to show full content
  const isCompact = heightPercent < 8;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`absolute inset-x-1 overflow-hidden rounded border-l-[3px] text-left transition-shadow hover:shadow-md ${colors.bg} ${colors.border}`}
      style={{
        top: `${topPercent}%`,
        height: `calc(${heightPercent}% - 2px)`,
      }}
    >
      <div className={`h-full p-1.5 ${colors.text}`}>
        {isCompact ? (
          <div className="flex items-center gap-1 truncate text-xs font-medium">
            <span className="truncate">{displayName}</span>
            <span className="shrink-0 rounded bg-white/60 px-1 text-[10px] font-medium">
              {booking.playerCount}/4
            </span>
            {booking.isPeakRate && (
              <span className="shrink-0 rounded bg-orange-100 px-1 text-[10px] font-medium text-orange-700">
                P
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span className="truncate text-xs font-medium">
                {displayName}
              </span>
              <span className="shrink-0 rounded bg-white/60 px-1 text-[10px] font-medium">
                {booking.playerCount}/4
              </span>
              {booking.isPeakRate && (
                <span className="shrink-0 rounded bg-orange-100 px-1 text-[10px] font-medium text-orange-700">
                  Peak
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] opacity-80">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </div>
          </>
        )}
      </div>
    </button>
  );
});
