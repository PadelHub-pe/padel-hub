"use client";

interface CalendarLegendProps {
  stats: {
    totalBookings: number;
    revenueInCents: number;
    utilizationPercent: number;
  };
}

const statusItems = [
  { status: "confirmed", label: "Confirmada", color: "bg-blue-500" },
  { status: "in_progress", label: "En Progreso", color: "bg-green-500" },
  { status: "pending", label: "Pendiente", color: "bg-yellow-500" },
  { status: "completed", label: "Completada", color: "bg-gray-400" },
  { status: "cancelled", label: "Cancelada", color: "bg-red-500" },
];

export function CalendarLegend({ stats }: CalendarLegendProps) {
  const formatRevenue = (cents: number) => {
    return `S/ ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2">
      {/* Status legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {statusItems.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${item.color}`} />
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-900">{stats.totalBookings}</span>
          <span className="text-gray-500">reservas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-900">
            {formatRevenue(stats.revenueInCents)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-900">{stats.utilizationPercent}%</span>
          <span className="text-gray-500">ocupación</span>
        </div>
      </div>
    </div>
  );
}
