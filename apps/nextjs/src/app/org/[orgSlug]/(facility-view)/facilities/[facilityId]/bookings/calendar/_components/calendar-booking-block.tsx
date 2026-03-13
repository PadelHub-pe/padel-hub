"use client";

import { forwardRef } from "react";

import {
  formatTime,
  getDurationMinutes,
  getStatusColors,
} from "./calendar-utils";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
  pending: "Pendiente",
  open_match: "Abierto",
  blocked: "Bloqueado",
};

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

  const durationMinutes = getDurationMinutes(
    booking.startTime,
    booking.endTime,
  );
  const isTall = durationMinutes > 90;

  // Determine if we have enough height to show full content
  const isCompact = heightPercent < 8;

  const borderStyle = colors.dashed ? "border-dashed" : "";

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`absolute inset-x-1 overflow-hidden rounded border-l-[3px] text-left transition-shadow hover:shadow-md ${colors.bg} ${colors.border} ${borderStyle} ${colors.opacity ? "opacity-60" : ""}`}
      style={{
        top: `${topPercent}%`,
        height: `calc(${heightPercent}% - 2px)`,
      }}
    >
      <div className={`h-full p-1.5 ${colors.text}`}>
        {isCompact ? (
          <div className="flex items-center gap-1 truncate text-xs font-medium">
            <span
              className={`truncate ${colors.strikethrough ? "line-through" : ""}`}
            >
              {displayName}
            </span>
            <span className="shrink-0 rounded bg-white/60 px-1 text-[10px] font-medium">
              {booking.playerCount}/4
            </span>
            {booking.isPeakRate && (
              <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
                ⚡
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span
                className={`truncate text-xs font-medium ${colors.strikethrough ? "line-through" : ""}`}
              >
                {displayName}
              </span>
              <span className="shrink-0 rounded bg-white/60 px-1 text-[10px] font-medium">
                {booking.playerCount}/4
              </span>
              {booking.isPeakRate && (
                <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
                  ⚡
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[10px] opacity-80">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
              <span className="shrink-0 rounded bg-white/50 px-1 text-[9px] font-medium">
                {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </div>
            {isTall && (
              <div className="mt-0.5 font-mono text-[10px] opacity-70">
                {booking.code}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
});
