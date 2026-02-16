import { cn } from "@wifo/ui";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open_match";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const statusConfig: Record<
  BookingStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  pending: {
    label: "Pendiente",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-700",
  },
  confirmed: {
    label: "Confirmada",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
  in_progress: {
    label: "En Progreso",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
  completed: {
    label: "Completada",
    bgClass: "bg-gray-100",
    textClass: "text-gray-600",
  },
  cancelled: {
    label: "Cancelada",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
  },
  open_match: {
    label: "Partido Abierto",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        config.bgClass,
        config.textClass,
      )}
    >
      {config.label}
    </span>
  );
}
