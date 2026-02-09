import { cn } from "@wifo/ui";

import type { AmenityKey } from "~/lib/constants";
import { AMENITIES } from "~/lib/constants";

export function AmenitiesList({
  amenities,
  className,
  compact = false,
}: {
  amenities: string[] | null;
  className?: string;
  compact?: boolean;
}) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <div
      className={cn(
        compact
          ? "flex flex-wrap gap-2"
          : "grid grid-cols-2 gap-2 sm:grid-cols-3",
        className,
      )}
    >
      {amenities.map((key) => {
        const amenity = AMENITIES[key as AmenityKey] as
          | (typeof AMENITIES)[AmenityKey]
          | undefined;
        if (!amenity) return null;

        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-2 text-sm",
              compact
                ? "bg-muted/50 rounded-md px-2 py-1"
                : "text-muted-foreground",
            )}
          >
            <span className="text-base" role="img" aria-hidden>
              {amenity.icon}
            </span>
            <span>{amenity.label}</span>
          </div>
        );
      })}
    </div>
  );
}
