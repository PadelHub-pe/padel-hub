"use client";

import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";

export interface SlotItem {
  courtId: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInCents: number;
  isPeakRate: boolean;
  zone: "regular" | "peak";
}

interface SlotGridProps {
  slots: SlotItem[];
  selectedSlot: SlotItem | null;
  onSelect: (slot: SlotItem) => void;
}

function formatPrice(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`;
}

function formatTime(time: string): string {
  return time;
}

/** Group slots by courtId, preserving order */
function groupByCourt(slots: SlotItem[]): {
  courtId: string;
  courtName: string;
  courtType: string;
  slots: SlotItem[];
}[] {
  const map = new Map<
    string,
    { courtId: string; courtName: string; courtType: string; slots: SlotItem[] }
  >();

  for (const slot of slots) {
    let group = map.get(slot.courtId);
    if (!group) {
      group = {
        courtId: slot.courtId,
        courtName: slot.courtName,
        courtType: slot.courtType,
        slots: [],
      };
      map.set(slot.courtId, group);
    }
    group.slots.push(slot);
  }

  return Array.from(map.values());
}

export function SlotGrid({ slots, selectedSlot, onSelect }: SlotGridProps) {
  if (slots.length === 0) {
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

  const groups = groupByCourt(slots);
  const singleCourt = groups.length === 1;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.courtId}>
          {/* Court header — hidden when showing a single court */}
          {!singleCourt && (
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold">{group.courtName}</h3>
              <Badge variant="outline" className="text-xs capitalize">
                {group.courtType}
              </Badge>
            </div>
          )}

          {/* Time slot chips */}
          <div className="grid grid-cols-2 gap-2">
            {group.slots.map((slot) => {
              const isSelected =
                selectedSlot != null &&
                selectedSlot.courtId === slot.courtId &&
                selectedSlot.startTime === slot.startTime &&
                selectedSlot.endTime === slot.endTime;

              return (
                <button
                  key={`${slot.courtId}-${slot.startTime}-${slot.endTime}`}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-medium">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        slot.isPeakRate
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatPrice(slot.priceInCents)}
                    </span>
                    {slot.isPeakRate && (
                      <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">
                        Punta
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
