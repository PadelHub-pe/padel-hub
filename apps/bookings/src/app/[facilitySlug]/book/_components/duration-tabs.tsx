"use client";

import { cn } from "@wifo/ui";

interface DurationTabsProps {
  durations: number[];
  selected: number;
  onSelect: (duration: number) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function DurationTabs({
  durations,
  selected,
  onSelect,
}: DurationTabsProps) {
  return (
    <div className="flex gap-2">
      {durations.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            d === selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/50",
          )}
        >
          {formatDuration(d)}
        </button>
      ))}
    </div>
  );
}
