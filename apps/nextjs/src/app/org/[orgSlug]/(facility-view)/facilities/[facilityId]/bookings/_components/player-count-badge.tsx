import { cn } from "@wifo/ui";

interface PlayerCountBadgeProps {
  count: number;
  max?: number;
}

export function PlayerCountBadge({ count, max = 4 }: PlayerCountBadgeProps) {
  const remaining = max - count;

  let bgClass: string;
  let textClass: string;
  let label: string;

  if (count >= max) {
    bgClass = "bg-green-100";
    textClass = "text-green-700";
    label = "Completo";
  } else if (remaining === 1) {
    bgClass = "bg-amber-100";
    textClass = "text-amber-700";
    label = "Falta 1";
  } else if (remaining === 2) {
    bgClass = "bg-amber-100";
    textClass = "text-amber-700";
    label = "Faltan 2";
  } else {
    bgClass = "bg-red-100";
    textClass = "text-red-700";
    label = `Faltan ${remaining}`;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
          bgClass,
          textClass,
        )}
      >
        {count}/{max}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
