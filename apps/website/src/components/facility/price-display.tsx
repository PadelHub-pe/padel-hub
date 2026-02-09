import { cn } from "@wifo/ui";

import { formatPricePEN } from "~/lib/format";

export function PriceDisplay({
  priceInCents,
  label,
  className,
}: {
  priceInCents: number | null;
  label?: string;
  className?: string;
}) {
  if (priceInCents === null) return null;

  return (
    <span className={cn("text-sm", className)}>
      {label && (
        <span className="text-muted-foreground">{label} </span>
      )}
      <span className="font-semibold">{formatPricePEN(priceInCents)}</span>
    </span>
  );
}

export function PriceRange({
  courts,
  className,
}: {
  courts: { priceInCents: number | null }[];
  className?: string;
}) {
  const prices = courts
    .map((c) => c.priceInCents)
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return (
    <span className={cn("text-sm font-semibold", className)}>
      {min === max
        ? formatPricePEN(min)
        : `${formatPricePEN(min)} - ${formatPricePEN(max)}`}
    </span>
  );
}
