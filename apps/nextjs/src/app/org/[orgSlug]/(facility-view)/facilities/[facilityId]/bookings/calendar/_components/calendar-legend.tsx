"use client";

import { usePermission } from "~/hooks/use-permission";

interface CalendarLegendProps {
  stats: {
    totalBookings: number;
    revenueInCents: number;
    utilizationPercent: number;
  };
  userRole: "org_admin" | "facility_manager" | "staff";
  nextBooking?: {
    customerName: string | null;
    startTime: string;
    courtName: string;
  } | null;
}

const zoneItems = [
  { label: "Horario Regular", swatch: "bg-green-50 border-green-300" },
  { label: "Hora Pico", swatch: "bg-amber-50 border-amber-300" },
  { label: "Reservado", swatch: "bg-blue-50 border-blue-300" },
  { label: "Bloqueado", swatch: "bg-red-50 border-red-300" },
];

function formatRevenue(cents: number) {
  return `S/ ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
}

function formatTime(time: string) {
  // "10:30:00" → "10:30"
  return time.slice(0, 5);
}

export function CalendarLegend({
  stats,
  userRole,
  nextBooking,
}: CalendarLegendProps) {
  const { canViewReports } = usePermission(userRole);

  return (
    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2">
      {/* Zone legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {zoneItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-sm border ${item.swatch}`} />
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 text-sm">
        {canViewReports ? (
          <span className="text-gray-700">
            <span className="font-medium text-gray-900">
              {stats.totalBookings}
            </span>{" "}
            reservas{" · "}
            <span className="font-medium text-gray-900">
              {formatRevenue(stats.revenueInCents)}
            </span>
            {" · "}
            <span className="font-medium text-gray-900">
              {stats.utilizationPercent}%
            </span>{" "}
            ocupación
          </span>
        ) : (
          <span className="text-gray-700">
            <span className="font-medium text-gray-900">
              {stats.totalBookings}
            </span>{" "}
            reservas
            {nextBooking && (
              <>
                {" · "}
                <span className="text-gray-500">
                  Próxima: {formatTime(nextBooking.startTime)}{" "}
                  {nextBooking.customerName ?? "Sin nombre"} (
                  {nextBooking.courtName})
                </span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
