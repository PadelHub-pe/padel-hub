"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wifo/ui/dropdown-menu";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { CancelBookingDialog } from "./cancel-booking-dialog";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

interface BookingActionsMenuProps {
  bookingId: string;
  status: BookingStatus;
  onViewDetails: () => void;
  onBookingUpdated: () => void;
}

export function BookingActionsMenu({
  bookingId,
  status,
  onViewDetails,
  onBookingUpdated,
}: BookingActionsMenuProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const confirmMutation = useMutation(
    trpc.booking.confirm.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva confirmada");
        onBookingUpdated();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleConfirm = () => {
    confirmMutation.mutate({ facilityId, id: bookingId });
  };

  const canConfirm = status === "pending";
  const canCancel = status === "pending" || status === "confirmed";
  const canEdit = status === "confirmed";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded p-1 hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontalIcon className="h-5 w-5 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onViewDetails}>
            <EyeIcon className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem>
              <PencilIcon className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {canConfirm && (
            <DropdownMenuItem onClick={handleConfirm}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Confirmar
            </DropdownMenuItem>
          )}

          {(canConfirm || canCancel) && <DropdownMenuSeparator />}

          {canCancel && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <XIcon className="mr-2 h-4 w-4" />
              Cancelar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelBookingDialog
        bookingId={bookingId}
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onCancelled={onBookingUpdated}
      />
    </>
  );
}

function MoreHorizontalIcon({ className }: { className?: string }) {
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
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
