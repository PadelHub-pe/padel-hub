"use client";

import type { SlotItem } from "./slot-grid";

interface CourtInfo {
  courtId: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  slotCount: number;
  minPrice: number;
}

interface CourtSelectorProps {
  slots: SlotItem[];
  onSelect: (courtId: string) => void;
}

function groupCourts(slots: SlotItem[]): CourtInfo[] {
  const map = new Map<string, CourtInfo>();

  for (const slot of slots) {
    const existing = map.get(slot.courtId);
    if (existing) {
      existing.slotCount++;
      existing.minPrice = Math.min(existing.minPrice, slot.priceInCents);
    } else {
      map.set(slot.courtId, {
        courtId: slot.courtId,
        courtName: slot.courtName,
        courtType: slot.courtType,
        slotCount: 1,
        minPrice: slot.priceInCents,
      });
    }
  }

  return Array.from(map.values());
}

function formatPrice(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`;
}

export function CourtSelector({ slots, onSelect }: CourtSelectorProps) {
  const courts = groupCourts(slots);

  if (courts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No hay horarios disponibles para esta duración.
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Prueba con otra duración o fecha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courts.map((court) => (
        <button
          key={court.courtId}
          type="button"
          onClick={() => onSelect(court.courtId)}
          className="border-border hover:border-primary/40 hover:bg-primary/5 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{court.courtName}</h3>
              <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize">
                {court.courtType}
              </span>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
              <span>
                {court.slotCount}{" "}
                {court.slotCount === 1
                  ? "horario disponible"
                  : "horarios disponibles"}
              </span>
              <span>·</span>
              <span>Desde {formatPrice(court.minPrice)}</span>
            </div>
          </div>

          {/* Chevron */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-muted-foreground shrink-0"
          >
            <path
              d="M7.5 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
