"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { formatLimaDate, parseLimaDateParam } from "@wifo/api/datetime";
import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import type { CancelBookingInfo } from "../../_components/cancel-booking-dialog";
import { useSetBreadcrumbEntity } from "~/components/navigation";
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
  const { facilityId } = useFacilityContext();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: booking } = useSuspenseQuery(
    trpc.booking.getById.queryOptions({ facilityId, id: bookingId }),
  );

  // Set breadcrumb entity label for the layout-level breadcrumbs
  useSetBreadcrumbEntity(booking.code);

  const confirmMutation = useMutation(
    trpc.booking.confirm.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva confirmada");
        void queryClient.invalidateQueries({
          queryKey: trpc.booking.getById.queryKey({
            facilityId,
            id: bookingId,
          }),
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
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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
        bookingInfo={buildCancelInfo(booking)}
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onCancelled={invalidateBooking}
      />
    </>
  );
}

function buildCancelInfo(booking: {
  code: string;
  court: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  playerCount: number;
}): CancelBookingInfo {
  const st = booking.startTime.substring(0, 5);
  const et = booking.endTime.substring(0, 5);
  return {
    code: booking.code,
    courtName: booking.court.name,
    date: formatLimaDate(parseLimaDateParam(booking.date), "EEE d MMM"),
    timeRange: `${st} - ${et}`,
    playerCount: booking.playerCount,
  };
}
