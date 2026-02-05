"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@wifo/ui/popover";

import { useTRPC } from "~/trpc/react";
import { BookingStatusBadge } from "../../_components/booking-status-badge";
import { formatTime, getStatusColors } from "./calendar-utils";

interface BookingTooltipProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails: () => void;
  children: React.ReactNode;
}

export function BookingTooltip({
  bookingId,
  open,
  onOpenChange,
  onViewDetails,
  children,
}: BookingTooltipProps) {
  const trpc = useTRPC();

  const { data: booking, isLoading } = useQuery({
    ...trpc.booking.getById.queryOptions({ id: bookingId }),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="start"
        sideOffset={8}
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        ) : booking ? (
          <BookingTooltipContent
            booking={booking}
            onViewDetails={onViewDetails}
          />
        ) : (
          <div className="p-4 text-sm text-gray-500">
            Reserva no encontrada
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

interface BookingData {
  id: string;
  code: string;
  status: BookingStatus;
  date: Date;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  customerName: string | null;
  user: {
    name: string | null;
    email: string;
  } | null;
  court: {
    id: string;
    name: string;
  };
}

function BookingTooltipContent({
  booking,
  onViewDetails,
}: {
  booking: BookingData;
  onViewDetails: () => void;
}) {
  const colors = getStatusColors(booking.status);
  const customerName =
    booking.user?.name ?? booking.customerName ?? "Cliente";
  const initials = getInitials(customerName);

  return (
    <div className="divide-y">
      {/* Header with code and status */}
      <div className="flex items-center justify-between p-3">
        <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-sm font-semibold text-blue-600">
          {booking.code}
        </span>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Customer info */}
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{customerName}</p>
          <p className="text-xs text-gray-500">
            {booking.user?.email ?? "Sin email"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 p-3">
        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span>
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>

        {/* Court */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span
            className={`h-2.5 w-2.5 rounded-full ${colors.bg.replace("bg-", "bg-").replace("/10", "")}`}
            style={{ backgroundColor: getCourtDotColor(booking.court.name) }}
          />
          <span>{booking.court.name}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            S/ {(booking.priceInCents / 100).toFixed(2)}
          </span>
          {booking.isPeakRate && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
              Peak
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="p-3">
        <button
          onClick={onViewDetails}
          className="flex w-full items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver detalles
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (name.slice(0, 2) || "??").toUpperCase();
}

function getCourtDotColor(courtName: string): string {
  // Generate a consistent color based on court name
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // purple
    "#EF4444", // red
    "#06B6D4", // cyan
  ];
  let hash = 0;
  for (let i = 0; i < courtName.length; i++) {
    hash = courtName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "#3B82F6";
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
