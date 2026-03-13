"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@wifo/ui";

import { BookingActionsMenu } from "./booking-actions-menu";
import { BookingStatusBadge } from "./booking-status-badge";
import { CourtBadge } from "./court-badge";
import { PlayerCountBadge } from "./player-count-badge";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open_match";

export interface BookingRow {
  id: string;
  code: string;
  date: Date;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  status: BookingStatus;
  playerCount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  court: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ColumnsOptions {
  courtIndexMap: Map<string, number>;
  onBookingUpdated: () => void;
  basePath: string;
}

export function getBookingsColumns({
  courtIndexMap,
  onBookingUpdated,
  basePath,
}: ColumnsOptions): ColumnDef<BookingRow>[] {
  return [
    {
      accessorKey: "code",
      header: "CÓDIGO",
      cell: ({ row }) => {
        const isCancelled = row.original.status === "cancelled";
        return (
          <Link
            href={`${basePath}/bookings/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline",
              isCancelled && "line-through opacity-60",
            )}
          >
            {row.original.code}
          </Link>
        );
      },
    },
    {
      accessorKey: "date",
      header: "FECHA",
      cell: ({ row }) => {
        const booking = row.original;
        const isCancelled = booking.status === "cancelled";
        const isStartingSoon = checkStartingSoon(booking);
        const dateFormatted = formatBookingDate(booking.date);

        return (
          <div>
            {isStartingSoon && !isCancelled && (
              <div className="mb-0.5 text-xs font-medium text-amber-600">
                Comienza pronto
              </div>
            )}
            <div className="text-gray-900">{dateFormatted}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: "HORARIO",
      cell: ({ row }) => {
        const booking = row.original;
        const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
        const durationMin = calculateDurationMinutes(
          booking.startTime,
          booking.endTime,
        );
        const durationLabel = formatDuration(durationMin);

        return (
          <div>
            <div className="text-gray-900">{timeRange}</div>
            <div className="text-xs text-gray-500">{durationLabel}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "court",
      header: "CANCHA",
      cell: ({ row }) => {
        const courtIndex = courtIndexMap.get(row.original.court.id) ?? 0;
        return <CourtBadge name={row.original.court.name} index={courtIndex} />;
      },
    },
    {
      accessorKey: "playerCount",
      header: "JUGADORES",
      cell: ({ row }) => <PlayerCountBadge count={row.original.playerCount} />,
    },
    {
      accessorKey: "priceInCents",
      header: "PRECIO",
      cell: ({ row }) => {
        const booking = row.original;
        const price = `S/ ${(booking.priceInCents / 100).toFixed(0)}`;

        return (
          <div>
            <div className="font-medium text-gray-900">{price}</div>
            {booking.isPeakRate && (
              <div className="text-xs text-amber-600">Hora punta</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "ESTADO",
      cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <BookingActionsMenu
          bookingId={row.original.id}
          status={row.original.status}
          onViewDetails={() => {
            // This will be handled by row click
          }}
          onBookingUpdated={onBookingUpdated}
        />
      ),
    },
  ];
}

// Helper functions
function checkStartingSoon(booking: BookingRow): boolean {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const [hours, minutes] = booking.startTime.split(":").map(Number);

  bookingDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  const diffMs = bookingDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= 30;
}

function formatBookingDate(date: Date): string {
  const bookingDate = new Date(date);

  if (isToday(bookingDate)) {
    return "Hoy";
  } else if (isTomorrow(bookingDate)) {
    return "Mañana";
  } else if (isYesterday(bookingDate)) {
    return "Ayer";
  }

  return format(bookingDate, "EEE d MMM", { locale: es });
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return ((eh ?? 0) - (sh ?? 0)) * 60 + ((em ?? 0) - (sm ?? 0));
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${String(h)}h ${String(m)}m`;
  if (h > 0) return `${String(h)}h`;
  return `${String(m)}m`;
}
