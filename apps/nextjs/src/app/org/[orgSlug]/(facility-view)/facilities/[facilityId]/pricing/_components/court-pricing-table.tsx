"use client";

import { useState } from "react";
import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";

import { EditCourtPricingDialog } from "./edit-court-pricing-dialog";

interface Court {
  id: string;
  name: string;
  type: "indoor" | "outdoor";
  status: string;
  priceInCents: number | null;
  isActive: boolean;
}

interface CourtPricingTableProps {
  courts: Court[];
  facilityId: string;
  avgMarkupPercent: number;
}

const COURT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-pink-500",
];

function formatPrice(cents: number | null): string | null {
  if (cents === null || cents === 0) return null;
  return `S/ ${(cents / 100).toFixed(0)}`;
}

export function CourtPricingTable({
  courts,
  facilityId,
  avgMarkupPercent,
}: CourtPricingTableProps) {
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Tarifas por Cancha</h3>
        <span className="text-xs text-gray-500">
          La tarifa pico se calcula automaticamente con el % de incremento
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Cancha
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Tipo
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-emerald-600">
                Tarifa Regular
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-amber-600">
                Tarifa Pico
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Accion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courts.map((court, index) => {
              const hasPrice =
                court.priceInCents !== null && court.priceInCents > 0;
              const regularPrice = formatPrice(court.priceInCents);
              const computedPeakCents =
                hasPrice && avgMarkupPercent > 0
                  ? Math.round(
                      court.priceInCents! * (1 + avgMarkupPercent / 100),
                    )
                  : null;
              const peakPrice = formatPrice(computedPeakCents);

              return (
                <tr
                  key={court.id}
                  className={cn(
                    "hover:bg-gray-50",
                    hasPrice && "bg-blue-50/30",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${COURT_COLORS[index % COURT_COLORS.length]}`}
                      />
                      <span className="font-medium text-gray-900">
                        {court.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium",
                        court.type === "indoor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700",
                      )}
                    >
                      {court.type === "indoor" ? "Indoor" : "Outdoor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {regularPrice ? (
                      <span className="font-bold text-emerald-600">
                        {regularPrice}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Sin precio</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {peakPrice ? (
                      <span className="font-bold text-amber-600">
                        {peakPrice}
                        <span className="ml-1 text-xs font-normal text-amber-400">
                          (+{avgMarkupPercent}%)
                        </span>
                      </span>
                    ) : hasPrice ? (
                      <span className="text-sm text-gray-400">
                        Sin periodo pico
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasPrice ? (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        Configurado
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        Sin configurar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCourt(court)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingCourt && (
        <EditCourtPricingDialog
          open={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          facilityId={facilityId}
          court={editingCourt}
          avgMarkupPercent={avgMarkupPercent}
        />
      )}
    </div>
  );
}
