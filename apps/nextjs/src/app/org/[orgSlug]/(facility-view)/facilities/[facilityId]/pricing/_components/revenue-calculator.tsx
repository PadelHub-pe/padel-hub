"use client";

import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@wifo/ui";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

const OCCUPANCY_PRESETS = [50, 60, 70, 80, 90];

function formatCentsCurrency(cents: number): string {
  return `S/ ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function RevenueCalculator() {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [occupancy, setOccupancy] = useState(70);

  // Prefetched default data
  const { data: defaultData } = useSuspenseQuery(
    trpc.pricing.calculateRevenue.queryOptions({
      facilityId,
      occupancyPercent: 70,
    }),
  );

  // Dynamic query when occupancy changes from default
  const { data: dynamicData } = useQuery(
    trpc.pricing.calculateRevenue.queryOptions({
      facilityId,
      occupancyPercent: occupancy,
    }),
  );

  const data = occupancy === 70 ? defaultData : (dynamicData ?? defaultData);

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold">
            Ingreso Semanal Estimado
          </h3>
          <p className="text-sm text-blue-100">
            Basado en tarifas actuales y {occupancy}% de ocupacion
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold">
            {formatCentsCurrency(data.totalWeekly)}
          </p>
          <p className="text-sm text-blue-200">
            por semana ({data.courtCount} canchas)
          </p>
        </div>
      </div>

      {/* Occupancy selector */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-blue-200">Ocupacion:</span>
        {OCCUPANCY_PRESETS.map((pct) => (
          <button
            key={pct}
            onClick={() => setOccupancy(pct)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
              occupancy === pct
                ? "bg-white text-blue-600"
                : "bg-blue-400/30 text-blue-100 hover:bg-blue-400/50",
            )}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-blue-400 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {formatCentsCurrency(data.regularRevenue)}
          </p>
          <p className="text-xs text-blue-200">Horas Regulares</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {formatCentsCurrency(data.peakRevenue)}
          </p>
          <p className="text-xs text-blue-200">Horas Pico</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            +{formatCentsCurrency(data.peakMarkupBonus)}
          </p>
          <p className="text-xs text-blue-200">Bonus Hora Pico</p>
        </div>
      </div>
    </div>
  );
}
