"use client";

export function DayOverviewLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-600">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded border-l-2 border-blue-500 bg-blue-50" />
        <span>Reserva</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded border-l-2 border-red-500 bg-red-50" />
        <span>Bloqueado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" />
        <span>Horario Pico</span>
      </div>
    </div>
  );
}
