"use client";

import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@wifo/ui";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

const OCCUPANCY_PRESETS = [50, 60, 70, 80, 90];
const MONTHLY_MULTIPLIER = 4.33;

function formatCentsCurrency(cents: number): string {
  return `S/ ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function RevenueCalculator() {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [occupancy, setOccupancy] = useState(70);
  const [showMonthly, setShowMonthly] = useState(false);

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

  const multiplier = showMonthly ? MONTHLY_MULTIPLIER : 1;
  const totalDisplay = Math.round(data.totalWeekly * multiplier);
  const regularDisplay = Math.round(data.regularRevenue * multiplier);
  const peakDisplay = Math.round(data.peakRevenue * multiplier);
  const bonusDisplay = Math.round(data.peakMarkupBonus * multiplier);

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold">
            {showMonthly
              ? "Ingreso Mensual Estimado"
              : "Ingreso Semanal Estimado"}
          </h3>
          <p className="text-sm text-blue-100">
            Basado en tarifas actuales y {occupancy}% de ocupación
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold">
            {formatCentsCurrency(totalDisplay)}
          </p>
          <p className="text-sm text-blue-200">
            por {showMonthly ? "mes" : "semana"} ({data.courtCount} canchas)
          </p>
        </div>
      </div>

      {/* Occupancy selector: slider + presets */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200">Ocupación:</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={occupancy}
            onChange={(e) => setOccupancy(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-blue-400/30 accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="min-w-[3ch] text-right text-sm font-bold">
            {occupancy}%
          </span>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-blue-400 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {formatCentsCurrency(regularDisplay)}
          </p>
          <p className="text-xs text-blue-200">Horas Regulares</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {formatCentsCurrency(peakDisplay)}
          </p>
          <p className="text-xs text-blue-200">Horas Pico</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            +{formatCentsCurrency(bonusDisplay)}
          </p>
          <p className="text-xs text-blue-200">Bonus Hora Pico</p>
        </div>
      </div>

      {/* Monthly toggle */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => setShowMonthly((prev) => !prev)}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
            showMonthly
              ? "bg-white text-blue-600"
              : "bg-blue-400/30 text-blue-100 hover:bg-blue-400/50",
          )}
        >
          {showMonthly ? "Ver proyección semanal" : "Ver proyección mensual"}
        </button>
      </div>
    </div>
  );
}
