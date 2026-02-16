"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { BookingStatusBadge } from "../../_components/booking-status-badge";
import { CancelBookingDialog } from "../../_components/cancel-booking-dialog";
import { PlayerCountBadge } from "../../_components/player-count-badge";
import { ActivityTimeline } from "./activity-timeline";
import { BookingInfoPanel } from "./booking-info-panel";
import { CourtVisualization } from "./court-visualization";
import { PlayerGrid } from "./player-grid";

export function BookingDetailView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { facilityId, basePath } = useFacilityContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: booking } = useSuspenseQuery(
    trpc.booking.getById.queryOptions({ facilityId, id: bookingId }),
  );

  const confirmMutation = useMutation(
    trpc.booking.confirm.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva confirmada");
        void queryClient.invalidateQueries({
          queryKey: trpc.booking.getById.queryKey({ facilityId, id: bookingId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleConfirm = () => {
    confirmMutation.mutate({ facilityId, id: bookingId });
  };

  const invalidateBooking = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.booking.getById.queryKey({ facilityId, id: bookingId }),
    });
  };

  const canConfirm =
    booking.status === "pending" || booking.status === "open_match";
  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed" ||
    booking.status === "open_match";

  return (
    <>
      <div className="p-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={`${basePath}/bookings`}
            className="hover:text-gray-700 hover:underline"
          >
            Reservas
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="font-medium text-gray-900">{booking.code}</span>
        </nav>

        {/* Header row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold text-blue-600">
              {booking.code}
            </h1>
            <BookingStatusBadge status={booking.status} />
            <PlayerCountBadge count={booking.playerCount} />
          </div>

          <div className="flex items-center gap-3">
            {canConfirm && (
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Confirmando..." : "Confirmar"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancelar reserva
              </Button>
            )}
          </div>
        </div>

        {/* 2-column grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CourtVisualization
              players={booking.players}
              court={booking.court}
            />
          </div>
          <div className="lg:col-span-2">
            <BookingInfoPanel booking={booking} />
          </div>
        </div>

        {/* Player grid */}
        <div className="mt-8">
          <PlayerGrid
            players={booking.players}
            bookingId={bookingId}
            bookingStatus={booking.status}
            onPlayerChanged={invalidateBooking}
          />
        </div>

        {/* Activity timeline */}
        <div className="mt-8">
          <ActivityTimeline activities={booking.activity} />
        </div>
      </div>

      {/* Cancel dialog */}
      <CancelBookingDialog
        bookingId={bookingId}
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onCancelled={invalidateBooking}
      />
    </>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
